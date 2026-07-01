import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface PlayersPayload {
  players: number | null; // concurrent players right now, null = unknown
}

/**
 * Live concurrent player count via Steam's ISteamUserStats/GetNumberOfCurrentPlayers.
 * Keyless-capable; we pass STEAM_API_KEY when present (some regions rate-limit
 * anonymous calls). Cached at the edge for 5 min — this number moves slowly.
 */
export async function GET(req: Request): Promise<NextResponse<PlayersPayload>> {
  const appid = new URL(req.url).searchParams.get("appid");
  if (!appid || !/^\d+$/.test(appid)) return NextResponse.json({ players: null });

  const key = process.env.STEAM_API_KEY;
  const url =
    `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}` +
    (key ? `&key=${key}` : "");
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return NextResponse.json({ players: null });
    const d = (await res.json()) as { response?: { result?: number; player_count?: number } };
    // result === 1 means the appid reports player counts; 42 = unknown app.
    if (d.response?.result !== 1 || typeof d.response.player_count !== "number") {
      return NextResponse.json({ players: null });
    }
    return NextResponse.json(
      { players: d.response.player_count },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" } }
    );
  } catch {
    return NextResponse.json({ players: null });
  }
}
