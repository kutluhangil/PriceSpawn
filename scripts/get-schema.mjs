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
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  
  for (const t of tables) {
    console.log(`\nTable: ${t.table_name}`);
    const cols = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${t.table_name}
    `;
    cols.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
  }
}

main().catch(console.error);
