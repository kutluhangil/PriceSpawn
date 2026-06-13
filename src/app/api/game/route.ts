import { NextResponse } from "next/server";
import { sql, hasDb, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export interface GameExtra {
  description: string;
  screenshots: string[];
  tags: string[];
}

const EMPTY: GameExtra = { description: "", screenshots: [], tags: [] };

/* eslint-disable @typescript-eslint/no-explicit-any */
async function fromSteam(appid: string): Promise<GameExtra> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=tr&l=turkish&filters=basic,screenshots,genres`,
      { headers: { "User-Agent": UA, Accept: "application/json" } }
    );
    if (!res.ok) return EMPTY;
    const d = await res.json();
    const data = d?.[appid]?.data ?? {};
    const description = String(data.short_description ?? "").replace(/<[^>]+>/g, "").trim();
    const screenshots = ((data.screenshots ?? []) as any[]).slice(0, 8).map((s) => s.path_full as string);
    const tags = ((data.genres ?? []) as any[]).map((g) => String(g.description)).slice(0, 6);
    return { description, screenshots, tags };
  } catch {
    return EMPTY;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(req: Request) {
  const appid = new URL(req.url).searchParams.get("appid");
  if (!appid || !/^\d+$/.test(appid)) return NextResponse.json(EMPTY satisfies GameExtra);

  if (!hasDb()) {
    return NextResponse.json(await fromSteam(appid), {
      headers: { "Cache-Control": "public, s-maxage=604800" },
    });
  }
  try {
    await ensureSchema();
    const rows = (await sql!`SELECT data FROM game_meta WHERE appid = ${appid}`) as { data: GameExtra }[];
    let extra: GameExtra;
    if (rows.length) {
      extra = rows[0].data;
    } else {
      extra = await fromSteam(appid);
      await sql!`
        INSERT INTO game_meta (appid, data, updated_at) VALUES (${appid}, ${JSON.stringify(extra)}, now())
        ON CONFLICT (appid) DO UPDATE SET data = ${JSON.stringify(extra)}, updated_at = now()`;
    }
    return NextResponse.json(extra, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" },
    });
  } catch {
    return NextResponse.json(EMPTY satisfies GameExtra);
  }
}
