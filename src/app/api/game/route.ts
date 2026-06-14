import { NextResponse } from "next/server";
import { sql, hasDb, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export interface GameReviews {
  steamPercent: number; // 0–100 positive, -1 if unknown
  steamTotal: number;
  steamDesc: string; // Steam's localized summary, e.g. "Çok Olumlu"
  metacritic?: number; // 0–100
  metacriticUrl?: string;
}

export interface GameExtra {
  description: string;
  screenshots: string[];
  tags: string[];
  reviews?: GameReviews;
}

const EMPTY: GameExtra = { description: "", screenshots: [], tags: [] };

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Steam's user-review summary (free, keyless). */
async function steamReviews(appid: string): Promise<GameReviews | undefined> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0&l=turkish`,
      { headers: { "User-Agent": UA, Accept: "application/json" } }
    );
    if (!res.ok) return undefined;
    const d = await res.json();
    const q = d?.query_summary;
    if (!q || !q.total_reviews) return undefined;
    const total = Number(q.total_reviews) || 0;
    const pos = Number(q.total_positive) || 0;
    return {
      steamPercent: total > 0 ? Math.round((pos / total) * 100) : -1,
      steamTotal: total,
      steamDesc: String(q.review_score_desc ?? ""),
    };
  } catch {
    return undefined;
  }
}

async function fromSteam(appid: string): Promise<GameExtra> {
  try {
    const [res, reviews] = await Promise.all([
      fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=tr&l=turkish&filters=basic,screenshots,genres,metacritic`,
        { headers: { "User-Agent": UA, Accept: "application/json" } }
      ),
      steamReviews(appid),
    ]);
    if (!res.ok) return { ...EMPTY, ...(reviews ? { reviews } : {}) };
    const d = await res.json();
    const data = d?.[appid]?.data ?? {};
    const description = String(data.short_description ?? "").replace(/<[^>]+>/g, "").trim();
    const screenshots = ((data.screenshots ?? []) as any[]).slice(0, 8).map((s) => s.path_full as string);
    const tags = ((data.genres ?? []) as any[]).map((g) => String(g.description)).slice(0, 6);

    const merged: GameReviews = reviews ?? { steamPercent: -1, steamTotal: 0, steamDesc: "" };
    if (data.metacritic?.score != null) {
      merged.metacritic = Number(data.metacritic.score);
      if (data.metacritic.url) merged.metacriticUrl = String(data.metacritic.url);
    }
    // Always set the key (even when empty) so cached rows aren't refetched forever.
    return { description, screenshots, tags, reviews: merged };
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
    // Refetch when missing OR when cached before the reviews field existed (backfill).
    if (rows.length && rows[0].data && "reviews" in rows[0].data) {
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
