import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const dbMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!dbMatch) throw new Error("DATABASE_URL not found");
const dbUrl = dbMatch[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(dbUrl);

const itadKeyMatch = envContent.match(/^ITAD_API_KEY=(.+)$/m);
if (!itadKeyMatch) throw new Error("ITAD_API_KEY not found");
const KEY = itadKeyMatch[1].trim().replace(/^["']|["']$/g, "");

const ITAD_SUB_TO_ID = { 1: "luna", 2: "eaplay", 3: "eaplaypro", 4: "ubisoftplus", 5: "ubisoftplus", 6: "gamepass" };

async function getPSPlusTitles() {
  console.log("Fetching PS Plus titles from gamescriptions...");
  const res = await fetch("https://gamescriptions.com/subscription/service/ps_extra", {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out = [];
  const seen = new Set();
  const NOISE = new Set(["PlayStation", "PC", "Xbox", "PlayStation 4", "PlayStation 5", "PlayStation Plus", "PS Plus Extra", "PS Plus Premium", "Compare this service with others", "Copy link to this section"]);
  for (const m of html.matchAll(/title="([^"]+)"/g)) {
    const t = m[1].replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').trim();
    const tClean = t.replace(/\(\d{4}\)$/, '').trim();
    if (tClean.length < 2 || NOISE.has(tClean) || tClean.startsWith("Compare") || tClean.startsWith("Copy link")) continue;
    if (seen.has(tClean)) continue;
    seen.add(tClean);
    out.push(tClean);
  }
  console.log(`Found ${out.length} PS Plus titles.`);
  return out;
}

// Normalize title for matching
function normTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
  const gamesTsPath = path.resolve(process.cwd(), "src/data/games.ts");
  const gamesContent = fs.readFileSync(gamesTsPath, "utf-8");
  
  // We will dynamically import the GAMES array to map slugs
  // We can't easily import a .ts file directly in node without ts-node/tsx.
  // Instead, let's use regex or simple parsing if we only need to update it.
  // Wait, parsing 4000 lines of TS with regex is robust if we just replace subscriptions: [...]
  
  // Actually, we can fetch all mappings from DB
  const mapRows = await sql`SELECT appid, itad_id FROM itad_map WHERE itad_id <> ''`;
  console.log(`Loaded ${mapRows.length} ITAD mappings.`);
  
  // To know which appid -> slug, we read catalog
  const catRows = await sql`SELECT appid, slug, title FROM catalog WHERE appid <> ''`;
  const slugByAppid = new Map(catRows.map((r) => [r.appid, r.slug]));
  const slugByNorm = new Map(catRows.map((r) => [normTitle(r.title), r.slug]));
  
  const slugByItad = new Map();
  for (const r of mapRows) {
    const slug = slugByAppid.get(r.appid);
    if (slug) slugByItad.set(r.itad_id, slug);
  }
  
  const ids = [...slugByItad.keys()];
  const subsBySlug = new Map();
  
  // ITAD
  console.log(`Querying ITAD for ${ids.length} games...`);
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
          const set = subsBySlug.get(slug) ?? new Set();
          for (const s of g.subs ?? []) {
            const mapped = ITAD_SUB_TO_ID[s.id];
            if (mapped) set.add(mapped);
          }
          if (set.size) subsBySlug.set(slug, set);
        }
      }
    } catch (e) {
      console.log("batch err", String(e).slice(0, 60));
    }
    if (i % 1000 === 0) console.log(`  queried ${i}/${ids.length}`);
    await sleep(320);
  }
  
  // PS Plus
  const psPlusTitles = await getPSPlusTitles();
  for (const t of psPlusTitles) {
    const slug = slugByNorm.get(normTitle(t));
    if (slug) {
      const set = subsBySlug.get(slug) ?? new Set();
      set.add("psplus");
      subsBySlug.set(slug, set);
    }
  }
  
  // Now modify games.ts string directly
  console.log("Updating games.ts...");
  let updatedContent = gamesContent;
  let matches = 0;
  
  // The structure is:
  // slug: "game-slug",
  // ...
  // subscriptions: [],
  // We can use a regex to replace subscriptions: [...] for each game.
  
  // It's safer to split by objects or just do a generic replace
  updatedContent = updatedContent.replace(/(slug:\s*"([^"]+)"[\s\S]*?subscriptions:\s*)\[([^\]]*)\]/g, (match, prefix, slug) => {
    const set = subsBySlug.get(slug);
    if (!set || set.size === 0) {
      return `${prefix}[]`;
    }
    matches++;
    const subsStr = Array.from(set).map(s => `"${s}"`).join(", ");
    return `${prefix}[${subsStr}]`;
  });
  
  fs.writeFileSync(gamesTsPath, updatedContent, "utf-8");
  console.log(`Updated games.ts! Modified ${matches} games with subscriptions.`);
}

main().catch(console.error);
