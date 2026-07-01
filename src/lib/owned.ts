import { sql } from "@/lib/db";

/**
 * Steam library appids via GetOwnedGames (needs STEAM_API_KEY + the user's
 * profile "game details" set to public). null = key missing or request failed;
 * empty array = reachable but private/empty.
 */
export async function fetchOwnedAppids(steamid: string): Promise<string[] | null> {
  const key = process.env.STEAM_API_KEY;
  if (!key) return null;
  try {
    const url =
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}` +
      `&steamid=${steamid}&include_appinfo=false&include_played_free_games=true&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = (await res.json()) as { response?: { games?: { appid: number }[] } };
    const games = d.response?.games;
    if (!games) return []; // private profile → no games array
    return games.map((g) => String(g.appid));
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
