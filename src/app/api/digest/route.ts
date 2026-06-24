import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { emailConfigured, sendEmail, digestEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Weekly digest cron: e-mail verified opt-in subscribers the week's biggest drops. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  if (!emailConfigured()) return NextResponse.json({ ok: false, reason: "email not configured" });

  await ensureSchema();
  const origin = new URL(req.url).origin;

  const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base='USD_TRY' LIMIT 1`) as { rate: number }[];
  const fx = fxRows.length ? Number(fxRows[0].rate) : 1;

  // Top 8 current discounts across the whole catalog.
  const dealRows = (await sql!.query(
    `
    WITH pr AS (
      SELECT slug,
        MIN(CASE WHEN currency='USD' THEN amount*$1 ELSE amount END) AS min_try,
        MAX(COALESCE(discount_percent,0)) AS max_disc
      FROM game_prices GROUP BY slug
    )
    SELECT c.slug, c.title, pr.min_try, pr.max_disc
    FROM catalog c JOIN pr ON pr.slug = c.slug
    WHERE pr.max_disc > 0 AND pr.min_try IS NOT NULL
    ORDER BY pr.max_disc DESC, c.score DESC
    LIMIT 8`,
    [fx],
  )) as { slug: string; title: string; min_try: string | number; max_disc: string | number }[];

  if (dealRows.length === 0) return NextResponse.json({ ok: true, sent: 0, reason: "no deals" });

  const items = dealRows.map((r) => ({
    title: r.title,
    priceText: `₺${Number(r.min_try).toFixed(2)}`,
    discount: Number(r.max_disc) || null,
    gameUrl: `${origin}/oyun/${r.slug}`,
  }));
  const browseUrl = `${origin}/oyunlar?disc=1`;

  const subs = (await sql!`SELECT email, token FROM email_subs WHERE verified = true AND digest = true`) as {
    email: string;
    token: string;
  }[];

  let sent = 0;
  for (const s of subs) {
    const html = digestEmailHtml({
      items,
      browseUrl,
      unsubUrl: `${origin}/api/email/digest?token=${s.token}&on=0`,
    });
    if (await sendEmail(s.email, "pricespawn — bu haftanın en büyük indirimleri", html)) sent++;
  }

  return NextResponse.json({ ok: true, subscribers: subs.length, sent, deals: items.length });
}
