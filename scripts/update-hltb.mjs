import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { HowLongToBeatService } from "howlongtobeat";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const dbMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!dbMatch) throw new Error("DATABASE_URL not found");
const dbUrl = dbMatch[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(dbUrl);

const hltbService = new HowLongToBeatService();

async function main() {
  console.log("Fetching games without HLTB data...");
  const games = await sql`
    SELECT appid, title, slug 
    FROM catalog 
    WHERE hltb_main IS NULL 
    LIMIT 200
  `;
  
  console.log(`Found ${games.length} games to process.`);
  
  let successCount = 0;
  for (const game of games) {
    try {
      const results = await hltbService.search(game.title);
      // Try to find an exact or very close match
      const match = results.find(
        (r) => r.name.toLowerCase() === game.title.toLowerCase() || 
        r.name.toLowerCase().includes(game.title.toLowerCase()) ||
        game.title.toLowerCase().includes(r.name.toLowerCase())
      );
      
      if (match && match.gameplayMain > 0) {
        await sql`
          UPDATE catalog 
          SET hltb_main = ${match.gameplayMain} 
          WHERE appid = ${game.appid}
        `;
        console.log(`[OK] ${game.title} -> ${match.gameplayMain} hours`);
        successCount++;
      } else {
        // Mark as 0 so we don't keep searching it over and over
        await sql`UPDATE catalog SET hltb_main = 0 WHERE appid = ${game.appid}`;
        console.log(`[NO MATCH] ${game.title}`);
      }
    } catch (e) {
      console.log(`[ERR] ${game.title}:`, e.message);
    }
    await sleep(300); // polite rate limiting
  }
  
  console.log(`Done! Synced ${successCount} games successfully out of ${games.length}.`);
}

main().catch(console.error);
