import type { Game } from "@/data/games";

const TR_MAP: Record<string, string> = {
  ı: "i",
  İ: "i",
  ş: "s",
  Ş: "s",
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
};

export function normalizeTR(s: string): string {
  return s
    .replace(/[ıİşŞçÇğĞöÖüÜ]/g, (ch) => TR_MAP[ch])
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchGames(query: string, games: Game[], limit = 8): Game[] {
  const q = normalizeTR(query);
  if (!q) return [];
  return games
    .map((game) => {
      const t = normalizeTR(game.title);
      let score = 0;
      if (t.startsWith(q)) score = 3;
      else if (t.split(" ").some((w) => w.startsWith(q))) score = 2;
      else if (t.includes(q)) score = 1;
      return { game, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.game.score - a.game.score)
    .slice(0, limit)
    .map((x) => x.game);
}
