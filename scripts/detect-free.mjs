// Mark genuinely free-to-play games with `catalog.free = true` using Steam's
// authoritative `is_free` flag (ITAD keeps no "deal" for F2P, so these show as
// priceless). Run: DBURL=... node scripts/detect-free.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DBURL);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isFree(appid) {
  try {
    const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&filters=basic`, { headers: { "User-Agent": UA } });
    const j = await r.json();
    const d = j?.[appid]?.data;
    return d ? Boolean(d.is_free) : null; // null = unknown (delisted/region)
  } catch {
    return null;
  }
}

const rows = await sql`
  SELECT slug, appid FROM catalog c
  WHERE c.appid <> '' AND c.free = false
    AND NOT EXISTS (SELECT 1 FROM game_prices gp WHERE gp.slug = c.slug)`;
console.log("priceless to scan:", rows.length);

let freed = 0, done = 0;
const CONC = 3;
for (let i = 0; i < rows.length; i += CONC) {
  const batch = rows.slice(i, i + CONC);
  await Promise.all(
    batch.map(async (r) => {
      const free = await isFree(r.appid);
      if (free === true) {
        await sql`UPDATE catalog SET free = true WHERE slug = ${r.slug}`;
        freed++;
      }
    }),
  );
  done += batch.length;
  if (done % 150 === 0) console.log(`  ${done}/${rows.length} · free so far ${freed}`);
  await sleep(900); // Steam appdetails ~200/5min — modest concurrency + pacing
}
const total = (await sql`SELECT COUNT(*)::int n FROM catalog WHERE free = true`)[0].n;
console.log("FREE marked this run:", freed, "| catalog free total:", total);
