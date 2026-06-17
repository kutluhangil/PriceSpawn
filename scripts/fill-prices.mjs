// Fill prices for catalog games that have no price rows yet (e.g. lost to the
// transient Neon errors at the end of the big import). Re-queries ITAD prices/v3
// for their mapped itad ids. Run: DBURL=... ITAD_KEY=... node scripts/fill-prices.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DBURL);
const KEY = process.env.ITAD_KEY;
if (!KEY) throw new Error("ITAD_KEY missing");
const SHOP = { 61: "steam", 16: "epic", 35: "gog", 37: "humble", 62: "ubisoft", 48: "xbox" };

// catalog slugs with a mapped itad id but no price rows
const rows = await sql`
  SELECT c.slug, m.itad_id
  FROM catalog c
  JOIN itad_map m ON m.appid = c.appid AND m.itad_id <> ''
  WHERE NOT EXISTS (SELECT 1 FROM game_prices gp WHERE gp.slug = c.slug)`;
console.log("priceless catalog games with itad id:", rows.length);
const slugByItad = new Map(rows.map((r) => [r.itad_id, r.slug]));
const ids = [...slugByItad.keys()];

let priceRows = 0;
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  try {
    const r = await fetch(`https://api.isthereanydeal.com/games/prices/v3?key=${KEY}&country=TR&capacity=8`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    const data = await r.json();
    for (const g of data) {
      const slug = slugByItad.get(g.id);
      if (!slug) continue;
      for (const deal of g.deals || []) {
        const store = SHOP[deal.shop?.id];
        if (!store) continue;
        const amount = deal.price?.amount;
        const cur = deal.price?.currency || "TRY";
        const cut = deal.cut || 0;
        if (amount == null) continue;
        const original = cut > 0 ? Math.round((amount / (1 - cut / 100)) * 100) / 100 : null;
        await sql`
          INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, url, updated_at)
          VALUES (${slug}, ${store}, ${amount}, ${cur}, ${original}, ${cut > 0 ? cut : null}, ${deal.url || null}, now())
          ON CONFLICT (slug, store) DO UPDATE SET amount=${amount}, currency=${cur}, original_amount=${original}, discount_percent=${cut > 0 ? cut : null}, url=${deal.url || null}, updated_at=now()`;
        priceRows++;
      }
    }
  } catch (e) {
    console.log("batch err", String(e).slice(0, 60));
  }
  if (i % 1000 === 0) console.log(`  ${i}/${ids.length}`);
}
console.log("price rows written:", priceRows);
const withPrices = await sql`SELECT COUNT(DISTINCT slug)::int n FROM game_prices WHERE slug IN (SELECT slug FROM catalog)`;
console.log("catalog WITH prices now:", withPrices[0].n);
