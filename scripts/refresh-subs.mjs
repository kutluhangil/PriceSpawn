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

// Ensure the change table exists (route's ensureSchema may not have run here).
await sql`CREATE TABLE IF NOT EXISTS sub_changes (
  slug text NOT NULL, sub_id text NOT NULL, change text NOT NULL, day date NOT NULL,
  PRIMARY KEY (slug, sub_id, day, change))`;

// Capture added/removed by diffing the previous ITAD membership before rewrite.
const ITAD_SERVICES = ["gamepass", "eaplay", "eaplaypro", "ubisoftplus", "luna"];
const oldRows = await sql`SELECT slug, sub_id FROM game_subs WHERE sub_id <> 'psplus'`;
const oldM = new Map();
for (const r of oldRows) { if (!oldM.has(r.slug)) oldM.set(r.slug, new Set()); oldM.get(r.slug).add(r.sub_id); }
const warm = new Set();
for (const set of oldM.values()) for (const s of set) warm.add(s);
const coldServices = new Set(ITAD_SERVICES.filter((s) => !warm.has(s)));
const today = new Date().toISOString().slice(0, 10);
const changeRows = [];
const allSlugs = new Set([...oldM.keys(), ...bySlug.keys()]);
for (const slug of allSlugs) {
  const oldSet = oldM.get(slug) ?? new Set();
  const newSet = bySlug.get(slug) ?? new Set();
  for (const s of ITAD_SERVICES) {
    const inOld = oldSet.has(s), inNew = newSet.has(s);
    if (inNew && !inOld) { if (!coldServices.has(s)) changeRows.push([slug, s, "added"]); }
    else if (inOld && !inNew) changeRows.push([slug, s, "removed"]);
  }
}
for (const [slug, s, change] of changeRows) {
  await sql`INSERT INTO sub_changes (slug, sub_id, change, day) VALUES (${slug}, ${s}, ${change}, ${today}) ON CONFLICT DO NOTHING`;
}
console.log("sub_changes recorded:", changeRows.length);

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
