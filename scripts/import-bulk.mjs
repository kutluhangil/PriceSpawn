// Bulk-grow the catalog toward TARGET games WITHOUT per-game Steam appdetails
// (which is rate-limited to ~200/5min). Source: SteamSpy `all` pages, which already
// carry name + genre + owners + review counts. Steam appdetails stays as the
// on-demand enrichment path (/api/game) for detail pages — not needed at import time.
//
// Phases: 1) insert new catalog rows (most-owned first) up to TARGET,
//         2) ITAD lookup → itad_map, 3) ITAD prices/v3 for the new games.
//
// Reads DATABASE_URL + ITAD_API_KEY straight from .env.local. Run:
//   node scripts/import-bulk.mjs
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const pick = (k) => env.match(new RegExp(`^${k}=(.+)$`, "m"))?.[1]?.replace(/^["']|["']$/g, "");
const sql = neon(pick("DATABASE_URL"));
const KEY = pick("ITAD_API_KEY");
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36";

const TARGET = Number(process.env.TARGET || 20000);
const SPY_PAGES = Number(process.env.SPY_PAGES || 80);
// Quality gate: skip games with fewer than this many total Steam reviews
// (positive+negative). 0 = no gate. Keeps dead shovelware/asset-flips out.
const MIN_REVIEWS = Number(process.env.MIN_REVIEWS || 0);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// NOTE: SteamSpy's `request=all` pages carry name/owners/reviews but NOT genre or
// release date. So bulk rows go in with genres=[] (genre unknown, not faked) and
// year=0; the on-demand detail page (/api/game) still enriches media/reviews, and a
// later Steam-appdetails pass can backfill genres if wanted. No fake data.
const NON_GAME = /(soundtrack|\bost\b|\bdlc\b|artbook|art book|season pass|\bdemo\b|wallpaper|dedicated server|\bsdk\b|expansion pass|upgrade pack|bonus content|prologue pack|character pack|skin pack|pack$)/i;

const normTR = (s) =>
  s.replace(/[ıİşŞçÇğĞöÖüÜ]/g, (c) => ({ ı: "i", İ: "i", ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g", ö: "o", Ö: "o", ü: "u", Ü: "u" }[c]))
    .toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function spyPage(p) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://steamspy.com/api.php?request=all&page=${p}`, { headers: { "User-Agent": UA } });
      if (!r.ok) { await sleep(2500); continue; }
      const d = await r.json();
      return Object.values(d);
    } catch { await sleep(2500); }
  }
  return [];
}

// ── existing catalog ────────────────────────────────────────────────────────
const ex = await sql`SELECT appid, slug FROM catalog`;
const haveApp = new Set(ex.map((r) => r.appid).filter(Boolean));
const usedSlug = new Set(ex.map((r) => r.slug));
let count = ex.length;
console.log(`catalog has ${count}; target ${TARGET}; need ${Math.max(0, TARGET - count)} more`);

// ── phase 1: insert new rows from SteamSpy (most-owned first) ────────────────
const inserted = [];
for (let p = 0; p < SPY_PAGES && count < TARGET; p++) {
  const apps = await spyPage(p);
  if (apps.length === 0) { console.log(`page ${p}: empty, stopping`); break; }
  let pageNew = 0;
  for (const a of apps) {
    if (count >= TARGET) break;
    const appid = String(a.appid);
    const name = String(a.name || "").replace(/[™®©]/g, "").trim();
    if (!appid || !name || haveApp.has(appid) || NON_GAME.test(name)) continue;
    const pos = Number(a.positive || 0), neg = Number(a.negative || 0);
    if (pos + neg < MIN_REVIEWS) continue; // quality gate
    let slug = slugify(name) || `game-${appid}`;
    if (usedSlug.has(slug)) slug = `${slug}-${appid}`;
    if (usedSlug.has(slug)) continue;
    const score = pos + neg > 50 ? Math.min(97, Math.max(40, Math.round((100 * pos) / (pos + neg)))) : 70;
    const cover = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
    try {
      await sql`
        INSERT INTO catalog (slug, appid, title, norm, cover, genres, score, year, unreleased, updated_at)
        VALUES (${slug}, ${appid}, ${name}, ${normTR(name)}, ${cover}, '[]'::jsonb, ${score}, 0, false, now())
        ON CONFLICT (slug) DO NOTHING`;
      haveApp.add(appid); usedSlug.add(slug);
      inserted.push({ slug, appid }); count++; pageNew++;
    } catch (e) { console.log("insert err", String(e).slice(0, 50)); }
  }
  console.log(`page ${p}: +${pageNew} | catalog ${count}`);
  await sleep(1100);
}
console.log(`PHASE 1 done. inserted ${inserted.length}. catalog now ${count}`);

if (!KEY) { console.log("no ITAD_API_KEY — skipping pricing"); process.exit(0); }

// ── phase 2: ITAD lookup → itad_map ──────────────────────────────────────────
const slugByItad = new Map();
let looked = 0;
for (const g of inserted) {
  try {
    const r = await fetch(`https://api.isthereanydeal.com/games/lookup/v1?key=${KEY}&appid=${g.appid}`);
    const d = await r.json();
    const id = d?.found ? d.game.id : "";
    await sql`INSERT INTO itad_map (appid, itad_id) VALUES (${g.appid}, ${id}) ON CONFLICT (appid) DO UPDATE SET itad_id=${id}`;
    if (id) slugByItad.set(id, g.slug);
  } catch {}
  if (++looked % 250 === 0) console.log(`  lookup ${looked}/${inserted.length} (mapped ${slugByItad.size})`);
  await sleep(330); // ITAD ~1000/5min
}
console.log(`PHASE 2 done. itad ids: ${slugByItad.size}`);

// ── phase 3: ITAD prices/v3 (TR) ─────────────────────────────────────────────
const SHOP = { 61: "steam", 16: "epic", 35: "gog", 37: "humble", 62: "ubisoft", 48: "xbox" };
const ids = [...slugByItad.keys()];
let priceRows = 0;
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  try {
    const r = await fetch(`https://api.isthereanydeal.com/games/prices/v3?key=${KEY}&country=TR&capacity=8`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(batch),
    });
    const data = await r.json();
    for (const g of data) {
      const slug = slugByItad.get(g.id); if (!slug) continue;
      for (const deal of g.deals || []) {
        const store = SHOP[deal.shop?.id]; if (!store) continue;
        const amount = deal.price?.amount, cur = deal.price?.currency || "TRY", cut = deal.cut || 0;
        if (amount == null) continue;
        const original = cut > 0 ? Math.round((amount / (1 - cut / 100)) * 100) / 100 : null;
        await sql`
          INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, url, updated_at)
          VALUES (${slug}, ${store}, ${amount}, ${cur}, ${original}, ${cut > 0 ? cut : null}, ${deal.url || null}, now())
          ON CONFLICT (slug, store) DO UPDATE SET amount=${amount}, currency=${cur}, original_amount=${original}, discount_percent=${cut > 0 ? cut : null}, url=${deal.url || null}, updated_at=now()`;
        priceRows++;
      }
    }
  } catch (e) { console.log("price batch err", String(e).slice(0, 60)); }
  if (i % 1000 === 0) console.log(`  price ${i}/${ids.length}`);
}
const total = await sql`SELECT COUNT(*)::int c FROM catalog`;
const priced = await sql`SELECT COUNT(DISTINCT slug)::int c FROM game_prices`;
console.log(`DONE. catalog ${total[0].c} | priced slugs ${priced[0].c} | new price rows ${priceRows}`);
