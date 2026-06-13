import { NextResponse } from "next/server";
import { sql, hasDb, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

async function steamMovieId(appid: string): Promise<string> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=movies`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return "";
    const data = await res.json();
    const movies = data?.[appid]?.data?.movies;
    return movies?.[0]?.id ? String(movies[0].id) : "";
  } catch {
    return "";
  }
}

/** Resolve (and cache) the Steam microtrailer movie id for an appid. */
export async function GET(req: Request) {
  const appid = new URL(req.url).searchParams.get("appid");
  if (!appid || !/^\d+$/.test(appid)) return NextResponse.json({ id: "" });

  if (!hasDb()) {
    return NextResponse.json(
      { id: await steamMovieId(appid) },
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
  }

  try {
    await ensureSchema();
    const rows = (await sql!`SELECT movie_id FROM trailer_map WHERE appid = ${appid}`) as { movie_id: string }[];
    let id: string;
    if (rows.length) {
      id = rows[0].movie_id;
    } else {
      id = await steamMovieId(appid);
      await sql!`
        INSERT INTO trailer_map (appid, movie_id) VALUES (${appid}, ${id})
        ON CONFLICT (appid) DO UPDATE SET movie_id = ${id}`;
    }
    return NextResponse.json(
      { id },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" } }
    );
  } catch {
    return NextResponse.json({ id: "" });
  }
}
