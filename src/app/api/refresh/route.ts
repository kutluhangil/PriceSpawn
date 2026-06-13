import { NextResponse } from "next/server";
import { GAMES } from "@/data/games";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { fetchUsdTry, itadLookup, itadPrices, itadStoreLow, mapLimit } from "@/lib/fetchers";

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

  // 3) Prices for all ITAD ids (chunked), real TR across stores.
  // Collect all rows first, then write them with bounded concurrency so the
  // whole refresh stays well within the 60s function limit.
  const allIds = [...slugByItad.keys()];
  const today = new Date().toISOString().slice(0, 10);
  const ops: { slug: string; store: string; amount: number; original: number | null; cut: number | null; url: string }[] = [];
  const pricedSlugs = new Set<string>();

  for (const ids of chunk(allIds, 100)) {
    const byItad = await itadPrices(ids, key);
    for (const [itadId, deals] of Object.entries(byItad)) {
      const slug = slugByItad.get(itadId);
      if (!slug) continue;
      pricedSlugs.add(slug);
      for (const d of deals) {
        const original = d.cut > 0 ? Math.round((d.amount / (1 - d.cut / 100)) * 100) / 100 : null;
        ops.push({ slug, store: d.store, amount: d.amount, original, cut: d.cut > 0 ? d.cut : null, url: d.url });
      }
    }
  }

  await mapLimit(ops, 24, async (o) => {
    await sql!`
      INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, url, updated_at)
      VALUES (${o.slug}, ${o.store}, ${o.amount}, 'TRY', ${o.original}, ${o.cut}, ${o.url || null}, now())
      ON CONFLICT (slug, store) DO UPDATE
        SET amount = ${o.amount}, currency = 'TRY',
            original_amount = ${o.original}, discount_percent = ${o.cut},
            url = ${o.url || null}, updated_at = now()`;
    await sql!`
      INSERT INTO price_history (slug, store, day, try_amount)
      VALUES (${o.slug}, ${o.store}, ${today}, ${o.amount})
      ON CONFLICT (slug, store, day) DO UPDATE SET try_amount = ${o.amount}`;
  });

  // 4) Real all-time-low (ITAD storelow), chunked.
  let lows = 0;
  for (const ids of chunk(allIds, 100)) {
    const byItad = await itadStoreLow(ids, key);
    const lowOps = Object.entries(byItad)
      .map(([itadId, low]) => ({ slug: slugByItad.get(itadId), low }))
      .filter((x): x is { slug: string; low: typeof x.low } => !!x.slug);
    await mapLimit(lowOps, 24, async ({ slug, low }) => {
      await sql!`
        INSERT INTO all_time_low (slug, amount, shop, day)
        VALUES (${slug}, ${low.amount}, ${low.shop}, ${low.day})
        ON CONFLICT (slug) DO UPDATE
          SET amount = ${low.amount}, shop = ${low.shop}, day = ${low.day}`;
      lows++;
    });
  }

  return NextResponse.json({
    ok: true,
    fx: rate,
    games: games.length,
    lookedUp,
    pricedGames: pricedSlugs.size,
    priceRows: ops.length,
    allTimeLows: lows,
    at: new Date().toISOString(),
  });
}
