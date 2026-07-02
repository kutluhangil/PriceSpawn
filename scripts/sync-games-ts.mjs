import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const dbMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!dbMatch) throw new Error("DATABASE_URL not found");
const dbUrl = dbMatch[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(dbUrl);

async function main() {
  const gamesTsPath = path.resolve(process.cwd(), "src/data/games.ts");
  const gamesContent = fs.readFileSync(gamesTsPath, "utf-8");
  
  // Get all subs from DB
  console.log("Fetching subscriptions from DB...");
  const subRows = await sql`SELECT slug, sub_id FROM game_subs`;
  const dbSubs = new Map();
  for (const r of subRows) {
    if (!dbSubs.has(r.slug)) dbSubs.set(r.slug, new Set());
    dbSubs.get(r.slug).add(r.sub_id);
  }
  
  // Also get the scraped PS Plus titles from gamescriptions
  console.log("Fetching PS Plus titles from gamescriptions (for extra coverage)...");
  const res = await fetch("https://gamescriptions.com/subscription/service/ps_extra", {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" },
  });
  if (res.ok) {
    const html = await res.text();
    const NOISE = new Set(["PlayStation", "PC", "Xbox", "PlayStation 4", "PlayStation 5", "PlayStation Plus", "PS Plus Extra", "PS Plus Premium", "Compare this service with others", "Copy link to this section"]);
    for (const m of html.matchAll(/title="([^"]+)"/g)) {
      const t = m[1].replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').trim();
      const tClean = t.replace(/\(\d{4}\)$/, '').trim();
      if (tClean.length < 2 || NOISE.has(tClean) || tClean.startsWith("Compare") || tClean.startsWith("Copy link")) continue;
      const slug = tClean.toLowerCase().replace(/[^a-z0-9]/g, ""); // simple norm
      if (!dbSubs.has(slug)) dbSubs.set(slug, new Set());
      dbSubs.get(slug).add("psplus");
    }
  }

  console.log(`Loaded subscriptions for ${dbSubs.size} games.`);

  console.log("Updating games.ts...");
  let matches = 0;
  const updatedContent = gamesContent.replace(/(slug:\s*"([^"]+)"(?:(?!slug:)[\s\S])*?(?:subscriptions|subs):\s*)\[([^\]]*)\]/g, (match, prefix, slug, existingSubsStr) => {
    const set = dbSubs.get(slug);
    // Include existing ones just in case
    const existingSubs = existingSubsStr.split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean);
    const finalSet = new Set(existingSubs);
    if (set) {
      for (const s of set) finalSet.add(s);
    }
    
    if (finalSet.size === 0) {
      return `${prefix}[]`;
    }
    matches++;
    const subsStr = Array.from(finalSet).map(s => `"${s}"`).join(", ");
    return `${prefix}[${subsStr}]`;
  });
  
  fs.writeFileSync(gamesTsPath, updatedContent, "utf-8");
  console.log(`Updated games.ts! Modified ${matches} games with subscriptions.`);
}

main().catch(console.error);
