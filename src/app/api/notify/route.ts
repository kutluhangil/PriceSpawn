import { NextResponse } from "next/server";
import webpush from "web-push";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { bestLiveTRY } from "@/lib/best-live";
import { emailConfigured, sendEmail, priceDropHtml } from "@/lib/email";
import { GAMES } from "@/data/games";
import { STORES } from "@/lib/stores";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const TITLE = new Map(GAMES.map((g) => [g.slug, g.title]));

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });

  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);
  const origin = new URL(req.url).origin;

  const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`) as { rate: number }[];
  const fx = fxRows.length ? Number(fxRows[0].rate) : 1;

  // Cheapest live TRY price for a slug (shared by push + email).
  async function bestFor(slug: string): Promise<number | null> {
    const rows = (await sql!`SELECT amount, currency FROM game_prices WHERE slug = ${slug}`) as {
      amount: number;
      currency: string;
    }[];
    return bestLiveTRY(
      rows.map((r) => ({ amount: Number(r.amount), currency: r.currency })),
      fx,
    );
  }

  // ── Web Push ──────────────────────────────────────────────────────────
  let sent = 0;
  let expired = 0;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (pub && priv) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@pricespawn.com", pub, priv);
    const watches = (await sql!`
      SELECT w.endpoint, w.slug, w.target_try, w.last_notified_day, s.p256dh, s.auth
      FROM push_watches w JOIN push_subs s ON s.endpoint = w.endpoint
      WHERE w.target_try IS NOT NULL`) as {
      endpoint: string;
      slug: string;
      target_try: number;
      last_notified_day: string | null;
      p256dh: string;
      auth: string;
    }[];

    for (const w of watches) {
      if (w.last_notified_day && String(w.last_notified_day).slice(0, 10) === today) continue;
      const best = await bestFor(w.slug);
      if (best === null || best > Number(w.target_try)) continue;
      const payload = JSON.stringify({
        title: "Fiyat düştü! 🎯",
        body: `${TITLE.get(w.slug) ?? w.slug} hedef fiyatına ulaştı: ₺${best.toFixed(2)}`,
        url: `/oyun/${w.slug}`,
      });
      try {
        await webpush.sendNotification(
          { endpoint: w.endpoint, keys: { p256dh: w.p256dh, auth: w.auth } },
          payload,
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
  }

  // ── Email ─────────────────────────────────────────────────────────────
  let emailed = 0;
  if (emailConfigured()) {
    const ew = (await sql!`
      SELECT w.email, w.slug, w.target_try, w.last_notified_day, s.token
      FROM email_watches w JOIN email_subs s ON s.email = w.email
      WHERE w.target_try IS NOT NULL AND s.verified = true`) as {
      email: string;
      slug: string;
      target_try: number;
      last_notified_day: string | null;
      token: string;
    }[];

    for (const w of ew) {
      if (w.last_notified_day && String(w.last_notified_day).slice(0, 10) === today) continue;
      const best = await bestFor(w.slug);
      if (best === null || best > Number(w.target_try)) continue;

      // Cheapest store label for a nicer email line.
      const storeRows = (await sql!`
        SELECT store, amount, currency FROM game_prices WHERE slug = ${w.slug}`) as {
        store: string;
        amount: number;
        currency: string;
      }[];
      const cheapest = storeRows
        .map((r) => ({ store: r.store, try: r.currency === "USD" ? Number(r.amount) * fx : Number(r.amount) }))
        .sort((a, b) => a.try - b.try)[0];
      const storeText = cheapest && STORES[cheapest.store as keyof typeof STORES]
        ? STORES[cheapest.store as keyof typeof STORES].label
        : undefined;

      const ok = await sendEmail(
        w.email,
        `🎯 Fiyat düştü: ${TITLE.get(w.slug) ?? w.slug}`,
        priceDropHtml({
          title: TITLE.get(w.slug) ?? w.slug,
          priceText: `₺${best.toFixed(2)}`,
          storeText,
          gameUrl: `${origin}/oyun/${w.slug}`,
          unsubUrl: `${origin}/api/email/unsubscribe?token=${w.token}`,
        }),
      );
      if (ok) {
        emailed++;
        await sql!`UPDATE email_watches SET last_notified_day = ${today} WHERE email = ${w.email} AND slug = ${w.slug}`;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, expired, emailed, at: new Date().toISOString() });
}
