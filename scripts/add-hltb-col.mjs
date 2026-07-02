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
  console.log("Adding hltb_main to catalog...");
  await sql`ALTER TABLE catalog ADD COLUMN IF NOT EXISTS hltb_main NUMERIC`;
  console.log("Column hltb_main added successfully!");
}

main().catch(console.error);
