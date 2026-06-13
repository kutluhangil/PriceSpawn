import { NextResponse } from "next/server";
import webpush from "web-push";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { bestLiveTRY } from "@/lib/best-live";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@pricespawn.com";
  if (!pub || !priv) return NextResponse.json({ error: "no vapid keys" }, { status: 503 });
  webpush.setVapidDetails(subject, pub, priv);

  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);

  const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`) as { rate: number }[];
  const fx = fxRows.length ? Number(fxRows[0].rate) : 1;

  const watches = (await sql!`
    SELECT w.endpoint, w.slug, w.target_try, w.last_notified_day,
           s.p256dh, s.auth
    FROM push_watches w
    JOIN push_subs s ON s.endpoint = w.endpoint
    WHERE w.target_try IS NOT NULL`) as {
    endpoint: string;
    slug: string;
    target_try: number;
    last_notified_day: string | null;
    p256dh: string;
    auth: string;
  }[];

  let sent = 0;
  let expired = 0;
  for (const w of watches) {
    if (w.last_notified_day && String(w.last_notified_day).slice(0, 10) === today) continue;
    const priceRows = (await sql!`
      SELECT amount, currency FROM game_prices WHERE slug = ${w.slug}`) as {
      amount: number;
      currency: string;
    }[];
    const best = bestLiveTRY(
      priceRows.map((r) => ({ amount: Number(r.amount), currency: r.currency })),
      fx
    );
    if (best === null || best > Number(w.target_try)) continue;

    const payload = JSON.stringify({
      title: "Fiyat düştü! 🎯",
      body: `${w.slug} hedef fiyatına ulaştı: ₺${best.toFixed(2)}`,
      url: `/oyun/${w.slug}`,
    });
    try {
      await webpush.sendNotification(
        { endpoint: w.endpoint, keys: { p256dh: w.p256dh, auth: w.auth } },
        payload
      );
      sent++;
      await sql!`UPDATE push_watches SET last_notified_day = ${today} WHERE endpoint = ${w.endpoint} AND slug = ${w.slug}`;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        expired++;
        await sql!`DELETE FROM push_watches WHERE endpoint = ${w.endpoint}`;
        await sql!`DELETE FROM push_subs WHERE endpoint = ${w.endpoint}`;
      }
    }
  }
  return NextResponse.json({ ok: true, checked: watches.length, sent, expired, at: new Date().toISOString() });
}
