// Bulk catalog import: franchises (Steam search) + SteamSpy top-owners → enrich
// via Steam appdetails (TR) → insert into `catalog` (DB-only, not GAMES) → price
// via ITAD. Run locally against the shared Neon DB:
//   DBURL=... ITAD_KEY=... node scripts/import-catalog.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DBURL);
const KEY = process.env.ITAD_KEY;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36";
const MAX_NEW = Number(process.env.MAX_NEW || 300);
const SPY_PAGES = Number(process.env.SPY_PAGES || 60);
const SPY_TAKE = Number(process.env.SPY_TAKE || 3000);
const AD_DELAY = Number(process.env.AD_DELAY || 1200); // Steam appdetails ~200/5min
const MIN_YEAR = Number(process.env.MIN_YEAR ?? 2016);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FRANCHISES = [
  "NBA 2K25", "NBA 2K24", "EA SPORTS FC 25", "EA SPORTS FC 24", "FIFA 23", "Madden NFL 25",
  "F1 24", "F1 25", "F1 23", "WWE 2K25", "WWE 2K24", "EA SPORTS WRC", "PGA TOUR 2K25",
  "Football Manager 2024", "Tekken 8", "Mortal Kombat 1", "Street Fighter 6",
  "DRAGON BALL Sparking ZERO", "EA SPORTS UFC 5", "TopSpin 2K25", "NHL 24", "MLB The Show 24",
  "Cities Skylines II", "Call of Duty Black Ops 6", "Call of Duty Modern Warfare III",
  "Microsoft Flight Simulator 2024", "EA SPORTS PGA", "Need for Speed Unbound",
];

const normTitle = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[™®©]/g, "")
    .replace(/&/g, "and").replace(/\b(the\s+)?(definitive|deluxe|standard|ultimate|complete|gold|goty|remastered|remaster|edition|anniversary)\b/g, "")
    .replace(/[:\-–—'’!.,()]/g, " ").replace(/\s+/g, " ").trim();
const normTR = (s) =>
  s.replace(/[ıİşŞçÇğĞöÖüÜ]/g, (c) => ({ ı: "i", İ: "i", ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g", ö: "o", Ö: "o", ü: "u", Ü: "u" }[c]))
    .toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

async function steamSearch(term) {
  try {
    const r = await fetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&cc=us&l=english`, { headers: { "User-Agent": UA } });
    const d = await r.json();
    return (d.items || [])[0]?.id ? String((d.items || [])[0].id) : null;
  } catch { return null; }
}

async function steamSpyTop(pages, take) {
  const all = [];
  for (let p = 0; p < pages; p++) {
    try {
      const r = await fetch(`https://steamspy.com/api.php?request=all&page=${p}`, { headers: { "User-Agent": UA } });
      const d = await r.json();
      const ks = Object.keys(d);
      if (ks.length === 0) break;
      for (const k of ks) {
        const g = d[k];
        const lo = Number(String(g.owners || "0").split("..")[0].replace(/[^\d]/g, "")) || 0;
        all.push({ appid: String(g.appid), owners: lo });
      }
    } catch { break; }
    await sleep(1100);
  }
  all.sort((a, b) => b.owners - a.owners);
  return all.slice(0, take).map((x) => x.appid);
}

async function appdetails(appid) {
  try {
    const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=tr&l=turkish&filters=basic,genres,release_date,metacritic`, { headers: { "User-Agent": UA } });
    const j = await r.json();
    const d = j?.[appid]?.data;
    if (!d || d.type !== "game") return null;
    const genres = (d.genres || []).map((x) => String(x.description)).filter(Boolean).slice(0, 3);
    const ym = String(d.release_date?.date || "").match(/(\d{4})/);
    return {
      title: String(d.name || "").replace(/[™®©]/g, "").trim(),
      genres: genres.length ? genres : ["Aksiyon"],
      year: ym ? Number(ym[1]) : 0,
      score: d.metacritic?.score ? Number(d.metacritic.score) : 78,
    };
  } catch { return null; }
}

// ── gather candidates ──────────────────────────────────────────────────────
const ex = await sql`SELECT appid, slug FROM catalog`;
const haveApp = new Set(ex.map((r) => r.appid).filter(Boolean));
const haveSlug = new Set(ex.map((r) => r.slug));
console.log("catalog has", ex.length, "rows");

const franchiseAppids = [];
for (const f of FRANCHISES) {
  const id = await steamSearch(f);
  if (id) franchiseAppids.push(id);
  await sleep(350);
}
console.log("franchise appids:", franchiseAppids.length);

const spyAppids = await steamSpyTop(SPY_PAGES, SPY_TAKE);
console.log("steamspy top-owner appids:", spyAppids.length);

// franchises first (always), then steamspy; dedupe vs catalog
const seen = new Set();
const candidates = [];
for (const a of [...franchiseAppids, ...spyAppids]) {
  if (!a || haveApp.has(a) || seen.has(a)) continue;
  seen.add(a);
  candidates.push({ appid: a, franchise: franchiseAppids.includes(a) });
}
console.log("new candidates (not in catalog):", candidates.length);

// ── enrich + insert (capped) ─────────────────────────────────────────────────
const usedSlug = new Set(haveSlug);
const inserted = [];
let processed = 0;
for (const c of candidates) {
  if (inserted.length >= MAX_NEW) break;
  processed++;
  const d = await appdetails(c.appid);
  await sleep(AD_DELAY);
  if (!d || !d.title) continue;
  if (!c.franchise && d.year && d.year < MIN_YEAR) continue; // 10-year window for the broad set
  const norm = normTitle(d.title);
  let slug = slugify(d.title) || `game-${c.appid}`;
  if (usedSlug.has(slug)) slug = `${slug}-${c.appid}`;
  usedSlug.add(slug);
  const cover = `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${c.appid}/header.jpg`;
  await sql`
    INSERT INTO catalog (slug, appid, title, norm, cover, genres, score, year, unreleased, updated_at)
    VALUES (${slug}, ${c.appid}, ${d.title}, ${normTR(d.title)}, ${cover}, ${JSON.stringify(d.genres)}::jsonb, ${d.score}, ${d.year || 0}, false, now())
    ON CONFLICT (slug) DO NOTHING`;
  inserted.push({ slug, appid: c.appid, title: d.title });
  if (inserted.length % 25 === 0) console.log(`  inserted ${inserted.length} (processed ${processed})`);
}
console.log("INSERTED into catalog:", inserted.length);

// ── price the new games via ITAD ─────────────────────────────────────────────
const slugByItad = new Map();
const fxRows = await sql`SELECT rate FROM fx_rate WHERE base='USD_TRY' LIMIT 1`;
const fx = fxRows.length ? Number(fxRows[0].rate) : 40;
// lookup itad ids
for (const g of inserted) {
  try {
    const r = await fetch(`https://api.isthereanydeal.com/games/lookup/v1?key=${KEY}&appid=${g.appid}`);
    const d = await r.json();
    const id = d?.found ? d.game.id : "";
    await sql`INSERT INTO itad_map (appid, itad_id) VALUES (${g.appid}, ${id}) ON CONFLICT (appid) DO UPDATE SET itad_id=${id}`;
    if (id) slugByItad.set(id, g.slug);
  } catch {}
  await sleep(340); // ITAD ~1000/5min
}
console.log("itad ids:", slugByItad.size);
const ids = [...slugByItad.keys()];
const SHOP = { 61: "steam", 16: "epic", 35: "gog", 37: "humble", 62: "ubisoft", 48: "xbox" };
let priceRows = 0;
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  try {
    const r = await fetch(`https://api.isthereanydeal.com/games/prices/v3?key=${KEY}&country=TR&capacity=8`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(batch) });
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
}
console.log("price rows written:", priceRows, "| fx", fx);
const total = await sql`SELECT COUNT(*)::int c FROM catalog`;
console.log("catalog total now:", total[0].c);
