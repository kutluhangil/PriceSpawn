import { NextResponse } from "next/server";
import { GAMES } from "@/data/games";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { fetchUsdTry, itadLookup, itadPrices, mapLimit } from "@/lib/fetchers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// Games keyed by a numeric Steam appid.
function steamGames() {
  return GAMES.filter((g) => /^\d+$/.test(g.id)).map((g) => ({ slug: g.slug, appid: g.id }));
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  const key = process.env.ITAD_API_KEY;
  if (!key) return NextResponse.json({ error: "no ITAD key" }, { status: 503 });

  await ensureSchema();

  // 1) FX (kept for the few demo USD prices and display)
  const rate = await fetchUsdTry();
  if (rate) {
    await sql!`
      INSERT INTO fx_rate (base, rate, updated_at) VALUES ('USD_TRY', ${rate}, now())
      ON CONFLICT (base) DO UPDATE SET rate = ${rate}, updated_at = now()`;
  }

  const games = steamGames();

  // 2) Resolve ITAD ids (cache in itad_map; only look up missing appids)
  const mapRows = (await sql!`SELECT appid, itad_id FROM itad_map`) as { appid: string; itad_id: string }[];
  const idByAppid = new Map(mapRows.map((r) => [r.appid, r.itad_id]));
  const missing = games.filter((g) => !idByAppid.has(g.appid));
  let lookedUp = 0;
  await mapLimit(missing, 6, async (g) => {
    const id = await itadLookup(g.appid, key);
    idByAppid.set(g.appid, id);
    await sql!`
      INSERT INTO itad_map (appid, itad_id) VALUES (${g.appid}, ${id})
      ON CONFLICT (appid) DO UPDATE SET itad_id = ${id}`;
    if (id) lookedUp++;
  });

  // appid → slug, and itad_id → slug
  const slugByAppid = new Map(games.map((g) => [g.appid, g.slug]));
  const slugByItad = new Map<string, string>();
  for (const [appid, itadId] of idByAppid) {
    if (itadId && slugByAppid.has(appid)) slugByItad.set(itadId, slugByAppid.get(appid)!);
  }

  // 3) Prices for all ITAD ids (chunked), real TR across stores
  const allIds = [...slugByItad.keys()];
  const today = new Date().toISOString().slice(0, 10);
  let priced = 0;
  let rows = 0;

  for (const ids of chunk(allIds, 100)) {
    const byItad = await itadPrices(ids, key);
    for (const [itadId, deals] of Object.entries(byItad)) {
      const slug = slugByItad.get(itadId);
      if (!slug) continue;
      priced++;
      for (const d of deals) {
        const original = d.cut > 0 ? Math.round((d.amount / (1 - d.cut / 100)) * 100) / 100 : null;
        await sql!`
          INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, updated_at)
          VALUES (${slug}, ${d.store}, ${d.amount}, 'TRY', ${original}, ${d.cut > 0 ? d.cut : null}, now())
          ON CONFLICT (slug, store) DO UPDATE
            SET amount = ${d.amount}, currency = 'TRY',
                original_amount = ${original},
                discount_percent = ${d.cut > 0 ? d.cut : null}, updated_at = now()`;
        await sql!`
          INSERT INTO price_history (slug, store, day, try_amount)
          VALUES (${slug}, ${d.store}, ${today}, ${d.amount})
          ON CONFLICT (slug, store, day) DO UPDATE SET try_amount = ${d.amount}`;
        rows++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    fx: rate,
    games: games.length,
    lookedUp,
    pricedGames: priced,
    priceRows: rows,
    at: new Date().toISOString(),
  });
}
