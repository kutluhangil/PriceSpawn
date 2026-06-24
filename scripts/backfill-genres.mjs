// Backfill genre + release year for catalog rows that came in without them
// (the SteamSpy bulk import leaves genres=[] and year=0). Source: Steam appdetails
// (Turkish), which returns Turkish genre labels matching the rest of the catalog and
// the real release year. Rate-limited (~200/5min) → ~1.6s/call with 429 backoff.
//
// One pass over the current year=0 set. year is only written when Steam reports a real
// dated release; genres are written whenever present. Re-runnable (re-checks rows still
// at year=0). No sentinel values → nothing surprising for the year>0 UI guards.
//
// Reads DATABASE_URL from .env.local. Run: node scripts/backfill-genres.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const sql = neon(env.match(/^DATABASE_URL=(.+)$/m)[1].replace(/^["']|["']$/g, ""));
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const DELAY = Number(process.env.AD_DELAY || 1600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Fetch Steam appdetails with 429/5xx backoff. Returns { genres[], year, type } | null.
async function appdetails(appid) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=tr&l=turkish&filters=basic,genres,release_date`,
        { headers: { "User-Agent": UA } },
      );
      if (r.status === 429 || r.status >= 500) {
        await sleep(8000 * (attempt + 1)); // back off hard on throttle
        continue;
      }
      const j = await r.json();
      const entry = j?.[appid];
      if (!entry) return null;
      if (!entry.success) return { type: "missing" };
      const d = entry.data;
      if (!d) return { type: "missing" };
      const genres = (d.genres || []).map((x) => String(x.description)).filter(Boolean).slice(0, 3);
      const ym = String(d.release_date?.date || "").match(/(\d{4})/);
      return { type: d.type || "game", genres, year: ym ? Number(ym[1]) : 0 };
    } catch {
      await sleep(4000);
    }
  }
  return null;
}

const rows = await sql`SELECT appid, slug FROM catalog WHERE year = 0 AND appid <> '' ORDER BY score DESC`;
console.log("rows to backfill (year=0):", rows.length);

let bothSet = 0, genreSet = 0, yearSet = 0, skipped = 0, failed = 0;
for (let i = 0; i < rows.length; i++) {
  const { appid, slug } = rows[i];
  const d = await appdetails(appid);
  await sleep(DELAY);
  if (!d) { failed++; continue; } // network give-up: leave for a later run
  if (d.type !== "game") { skipped++; continue; } // delisted / DLC / soundtrack etc

  const hasGenres = d.genres.length > 0;
  const hasYear = d.year > 0;
  if (hasGenres && hasYear) {
    await sql`UPDATE catalog SET genres = ${JSON.stringify(d.genres)}::jsonb, year = ${d.year} WHERE slug = ${slug}`;
    bothSet++;
  } else if (hasGenres) {
    await sql`UPDATE catalog SET genres = ${JSON.stringify(d.genres)}::jsonb WHERE slug = ${slug}`;
    genreSet++;
  } else if (hasYear) {
    await sql`UPDATE catalog SET year = ${d.year} WHERE slug = ${slug}`;
    yearSet++;
  } else {
    skipped++;
  }
  if ((i + 1) % 100 === 0) {
    console.log(`  ${i + 1}/${rows.length} | both ${bothSet} | genre-only ${genreSet} | year-only ${yearSet} | skip ${skipped} | fail ${failed}`);
  }
}
console.log(`DONE. processed ${rows.length} | genre+year ${bothSet} | genre-only ${genreSet} | year-only ${yearSet} | skip ${skipped} | network-fail ${failed}`);
