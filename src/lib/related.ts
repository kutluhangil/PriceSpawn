import type { Game } from "@/data/games";

/**
 * Games similar to `target`, ranked by shared genres, then closeness in score,
 * then overall score. Pure so it can be unit-tested and reused anywhere.
 */
export function relatedGames(target: Game, all: Game[], limit = 4): Game[] {
  const targetGenres = new Set(target.genres);

  return all
    .filter((g) => g.slug !== target.slug)
    .map((g) => ({
      g,
      shared: g.genres.reduce((n, genre) => n + (targetGenres.has(genre) ? 1 : 0), 0),
    }))
    .filter((x) => x.shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        Math.abs(a.g.score - target.score) - Math.abs(b.g.score - target.score) ||
        b.g.score - a.g.score,
    )
    .slice(0, limit)
    .map((x) => x.g);
}
