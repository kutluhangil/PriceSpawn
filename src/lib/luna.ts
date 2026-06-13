import type { LunaFreeGame } from "@/data/luna";

export function activeLunaGames(games: LunaFreeGame[], now: Date): LunaFreeGame[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return games.filter((g) => Date.parse(`${g.validUntil}T23:59:59Z`) >= today);
}
