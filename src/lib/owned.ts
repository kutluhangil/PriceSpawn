import { sql } from "@/lib/db";

/**
 * Steam library appids via GetOwnedGames (needs STEAM_API_KEY + the user's
 * profile "game details" set to public). null = key missing or request failed;
 * empty array = reachable but private/empty.
 */
export async function fetchOwnedAppids(steamid: string): Promise<string[] | null> {
  const owned = await fetchOwned(steamid);
  return owned === null ? null : owned.appids;
}

export interface OwnedGames {
  appids: string[];
  totalMinutes: number; // summed playtime across owned games
}

/** Owned appids + total playtime. null = key missing/failed; empty appids = private. */
export async function fetchOwned(steamid: string): Promise<OwnedGames | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) return null;
  try {
    const url =
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}` +
      `&steamid=${steamid}&include_appinfo=false&include_played_free_games=true&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = (await res.json()) as {
      response?: { games?: { appid: number; playtime_forever?: number }[] };
    };
    const games = d.response?.games;
    if (!games) return { appids: [], totalMinutes: 0 }; // private profile → no games array
    return {
      appids: games.map((g) => String(g.appid)),
      totalMinutes: games.reduce((sum, g) => sum + (g.playtime_forever ?? 0), 0),
    };
  } catch {
    return null;
  }
}

export interface SteamProfile {
  name: string;
  avatar: string;
}

/** Public profile name + avatar via GetPlayerSummaries (needs STEAM_API_KEY). */
export async function fetchPlayerSummary(steamid: string): Promise<SteamProfile | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamid}`
    );
    if (!res.ok) return null;
    const d = (await res.json()) as {
      response?: { players?: { personaname?: string; avatarmedium?: string }[] };
    };
    const p = d.response?.players?.[0];
    if (!p) return null;
    return { name: String(p.personaname ?? ""), avatar: String(p.avatarmedium ?? "") };
  } catch {
    return null;
  }
}

/** Map Steam appids to catalog slugs we actually track. */
export async function ownedSlugs(appids: string[]): Promise<string[]> {
  if (!sql || appids.length === 0) return [];
  const rows = (await sql`
    SELECT slug FROM catalog WHERE appid = ANY(${appids})`) as { slug: string }[];
  return rows.map((r) => r.slug);
}
