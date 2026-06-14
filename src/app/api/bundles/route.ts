import { NextResponse } from "next/server";
import { sql, hasDb, ensureSchema } from "@/lib/db";
import { itadLookup, itadBundles } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const appid = new URL(req.url).searchParams.get("appid");
  const key = process.env.ITAD_API_KEY;
  if (!appid || !/^\d+$/.test(appid) || !key) return NextResponse.json({ bundles: [] });

  try {
    // Reuse the cached appid → ITAD id map; look up + cache on first sight.
    let id = "";
    if (hasDb()) {
      await ensureSchema();
      const rows = (await sql!`SELECT itad_id FROM itad_map WHERE appid = ${appid}`) as {
        itad_id: string;
      }[];
      if (rows.length) {
        id = rows[0].itad_id;
      } else {
        id = await itadLookup(appid, key);
        await sql!`
          INSERT INTO itad_map (appid, itad_id) VALUES (${appid}, ${id})
          ON CONFLICT (appid) DO UPDATE SET itad_id = ${id}`;
      }
    } else {
      id = await itadLookup(appid, key);
    }
    if (!id) return NextResponse.json({ bundles: [] });

    const bundles = await itadBundles(id, key);
    return NextResponse.json(
      { bundles },
      { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json({ bundles: [] });
  }
}
