// Standalone subscription-membership rebuild against the shared Neon DB.
// Mirrors /api/refresh-subs but runs locally (no 300s limit) over the full
// catalog. Run: DBURL=... ITAD_KEY=... node scripts/refresh-subs.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DBURL);
const KEY = process.env.ITAD_KEY;
if (!KEY) throw new Error("ITAD_KEY missing");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ITAD subscription service id → our SubscriptionId (matches src/lib/fetchers.ts)
const ITAD_SUB_TO_ID = { 1: "luna", 2: "eaplay", 3: "eaplaypro", 4: "ubisoftplus", 5: "ubisoftplus", 6: "gamepass" };

const catRows = await sql`SELECT appid, slug FROM catalog WHERE appid <> ''`;
const slugByAppid = new Map(catRows.map((r) => [r.appid, r.slug]));
const mapRows = await sql`SELECT appid, itad_id FROM itad_map WHERE itad_id <> ''`;
const slugByItad = new Map();
for (const r of mapRows) {
  const slug = slugByAppid.get(r.appid);
  if (slug) slugByItad.set(r.itad_id, slug);
}
const ids = [...slugByItad.keys()];
console.log("itad ids to query:", ids.length);

const bySlug = new Map();
for (let i = 0; i < ids.length; i += 50) {
  const batch = ids.slice(i, i + 50);
  try {
    const res = await fetch(`https://api.isthereanydeal.com/games/subs/v1?key=${KEY}&country=US`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      const data = await res.json();
      for (const g of data) {
        const slug = slugByItad.get(g.id);
        if (!slug) continue;
        const set = bySlug.get(slug) ?? new Set();
        for (const s of g.subs ?? []) {
          const mapped = ITAD_SUB_TO_ID[s.id];
          if (mapped) set.add(mapped);
        }
        if (set.size) bySlug.set(slug, set);
      }
    }
  } catch (e) {
    console.log("batch err", String(e).slice(0, 60));
  }
  if (i % 1000 === 0) console.log(`  queried ${i}/${ids.length}`);
  await sleep(320); // ITAD ~1000/5min
}
console.log("games with subs:", bySlug.size);

// Rewrite ITAD-owned services; psplus is managed separately.
await sql`DELETE FROM game_subs WHERE sub_id <> 'psplus'`;
const slugs = [];
const subs = [];
for (const [slug, set] of bySlug) for (const s of set) { slugs.push(slug); subs.push(s); }
for (let i = 0; i < slugs.length; i += 500) {
  const s = slugs.slice(i, i + 500);
  const u = subs.slice(i, i + 500);
  await sql`INSERT INTO game_subs (slug, sub_id) SELECT * FROM UNNEST(${s}::text[], ${u}::text[]) ON CONFLICT DO NOTHING`;
}

const tally = await sql`SELECT sub_id, COUNT(*)::int n FROM game_subs GROUP BY sub_id ORDER BY n DESC`;
console.log("game_subs now:", JSON.stringify(tally));
