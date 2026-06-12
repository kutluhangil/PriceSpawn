import { NextResponse } from "next/server";
import { GAMES } from "@/data/games";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { fetchSteamPrice, fetchUsdTry, mapLimit } from "@/lib/fetchers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Games that have a numeric Steam appid as their id.
function steamGames() {
  return GAMES.filter((g) => /^\d+$/.test(g.id)).map((g) => ({ slug: g.slug, appid: g.id }));
}

export async function GET(req: Request) {
  // Auth: Vercel cron sends Authorization: Bearer ${CRON_SECRET}.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  if (!hasDb()) {
    return NextResponse.json({ error: "no database configured" }, { status: 503 });
  }

  await ensureSchema();

  // 1) FX
  const rate = await fetchUsdTry();
  if (rate) {
    await sql!`
      INSERT INTO fx_rate (base, rate, updated_at) VALUES ('USD_TRY', ${rate}, now())
      ON CONFLICT (base) DO UPDATE SET rate = ${rate}, updated_at = now()`;
  }

  // 2) Steam prices (concurrency-limited)
  const games = steamGames();
  const today = new Date().toISOString().slice(0, 10);
  let updated = 0;

  const fxForHistory = rate ?? 44.2;
  await mapLimit(games, 8, async (g) => {
    const p = await fetchSteamPrice(g.appid);
    if (!p) return;
    await sql!`
      INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, updated_at)
      VALUES (${g.slug}, 'steam', ${p.amount}, 'USD', ${p.originalAmount ?? null}, ${p.discountPercent ?? null}, now())
      ON CONFLICT (slug, store) DO UPDATE
        SET amount = ${p.amount}, currency = 'USD',
            original_amount = ${p.originalAmount ?? null},
            discount_percent = ${p.discountPercent ?? null}, updated_at = now()`;
    const tl = Math.round(p.amount * fxForHistory * 100) / 100;
    await sql!`
      INSERT INTO price_history (slug, store, day, try_amount)
      VALUES (${g.slug}, 'steam', ${today}, ${tl})
      ON CONFLICT (slug, store, day) DO UPDATE SET try_amount = ${tl}`;
    updated++;
  });

  return NextResponse.json({
    ok: true,
    fx: rate,
    steamGames: games.length,
    updated,
    at: new Date().toISOString(),
  });
}
