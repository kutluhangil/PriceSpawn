// DB'deki mevcut game_subs sayısını kontrol et
// Çalıştır: node scripts/check-subs.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local'dan DATABASE_URL oku
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const dbMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!dbMatch) throw new Error("DATABASE_URL not found in .env.local");
// Strip surrounding quotes if present
const dbUrl = dbMatch[1].trim().replace(/^["']|["']$/g, "");
const sql = neon(dbUrl);


const tally = await sql`SELECT sub_id, COUNT(*)::int n FROM game_subs GROUP BY sub_id ORDER BY n DESC`;
console.log("\n=== game_subs tablosu ===");
if (tally.length === 0) {
  console.log("BOŞ — hiç veri yok. refresh-subs çalıştırılmalı.");
} else {
  for (const r of tally) {
    console.log(`  ${r.sub_id.padEnd(16)} → ${r.n} oyun`);
  }
}

const total = await sql`SELECT COUNT(*)::int n FROM game_subs`;
console.log(`Toplam: ${total[0].n} kayıt`);

const itadMap = await sql`SELECT COUNT(*)::int n FROM itad_map WHERE itad_id <> ''`;
console.log(`itad_map (dolu): ${itadMap[0].n} mapping`);

const catalog = await sql`SELECT COUNT(*)::int n FROM catalog`;
console.log(`catalog: ${catalog[0].n} oyun`);
