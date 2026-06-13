import { NextResponse } from "next/server";
import { GAMES } from "@/data/games";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { psSearch, mapLimit } from "@/lib/fetchers";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// All games (PS search is by title, so a Steam appid isn't required).
// Skip unreleased titles — they have no real price to find.
function catalog() {
  return GAMES.filter((g) => !g.unreleased).map((g) => ({
    slug: g.slug,
    appid: g.id, // ps_map key (appid or slug)
    title: g.title,
  }));
}

async function writePrice(slug: string, amount: number, cut: number, productId: string, today: string) {
  const original = cut > 0 ? Math.round((amount / (1 - cut / 100)) * 100) / 100 : null;
  const url = `https://store.playstation.com/tr-tr/product/${productId}`;
  await sql!`
    INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, url, updated_at)
    VALUES (${slug}, 'playstation', ${amount}, 'TRY', ${original}, ${cut > 0 ? cut : null}, ${url}, now())
    ON CONFLICT (slug, store) DO UPDATE
      SET amount = ${amount}, currency = 'TRY',
          original_amount = ${original}, discount_percent = ${cut > 0 ? cut : null},
          url = ${url}, updated_at = now()`;
  await sql!`
    INSERT INTO price_history (slug, store, day, try_amount)
    VALUES (${slug}, 'playstation', ${today}, ${amount})
    ON CONFLICT (slug, store, day) DO UPDATE SET try_amount = ${amount}`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });

  await ensureSchema();
  const games = catalog();
  const today = new Date().toISOString().slice(0, 10);

  const mapRows = (await sql!`SELECT appid, product_id FROM ps_map`) as { appid: string; product_id: string }[];
  const pidByAppid = new Map(mapRows.map((r) => [r.appid, r.product_id]));
  const slugByAppid = new Map(games.map((g) => [g.appid, g.slug]));

  let found = 0;
  let pricedNow = 0;

  // Phase 1: discover unmapped games (search also returns the price).
  const unmapped = games.filter((g) => !pidByAppid.has(g.appid)).slice(0, 80);
  await mapLimit(unmapped, 3, async (g) => {
    const hit = await psSearch(g.title);
    const pid = hit?.productId ?? "";
    pidByAppid.set(g.appid, pid);
    await sql!`
      INSERT INTO ps_map (appid, product_id) VALUES (${g.appid}, ${pid})
      ON CONFLICT (appid) DO UPDATE SET product_id = ${pid}`;
    if (hit) {
      found++;
      await writePrice(g.slug, hit.amount, hit.cut, hit.productId, today);
      pricedNow++;
    }
  }, 150);

  // Phase 2: refresh prices for games already confirmed on PS.
  // Skipped during seeding (?seed=1) since discovery already priced each game.
  const seedOnly = new URL(req.url).searchParams.get("seed") === "1";
  const onPs = seedOnly ? [] : games.filter((g) => pidByAppid.get(g.appid));
  await mapLimit(onPs, 3, async (g) => {
    const hit = await psSearch(g.title);
    if (hit) {
      await writePrice(g.slug, hit.amount, hit.cut, hit.productId, today);
      pricedNow++;
    }
  }, 150);

  return NextResponse.json({
    ok: true,
    searchedUnmapped: unmapped.length,
    newlyFound: found,
    onPs: onPs.length,
    pricedNow,
    at: new Date().toISOString(),
  });
}
