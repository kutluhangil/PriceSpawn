import type { Game } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";
import { normalizeTR } from "@/lib/search";

export type SortKey = "discount" | "priceAsc" | "priceDesc" | "score" | "year" | "name";

export interface FilterOpts {
  query: string;
  genres: string[];
  stores: StoreId[];
  subscriptions: SubscriptionId[];
  onlyDiscounted: boolean;
  /** Only games currently at (or within 5% of) their all-time-low. DB-backed only. */
  atLow: boolean;
  minTRY: number | null;
  maxTRY: number | null;
  sort: SortKey;
}

function matchesQuery(game: Game, query: string): boolean {
  const q = normalizeTR(query);
  if (!q) return true;
  const haystack = normalizeTR(
    `${game.title} ${game.slug} ${game.genres.join(" ")} ${game.releaseYear}`
  );
  return q.split(" ").every((token) => haystack.includes(token));
}

function compareNullable(
  a: number | null,
  b: number | null,
  compare: (x: number, y: number) => number
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return compare(a, b);
}

export function filterSortGames(games: Game[], o: FilterOpts): Game[] {
  const filtered = games.filter((g) => {
    if (!matchesQuery(g, o.query)) return false;
    if (o.genres.length && !o.genres.some((x) => g.genres.includes(x))) return false;
    if (o.stores.length && !o.stores.some((s) => g.prices.some((p) => p.store === s)))
      return false;
    if (o.subscriptions.length && !o.subscriptions.some((s) => g.subscriptions.includes(s)))
      return false;
    const best = bestPrice(g);
    if (!best) return !(o.onlyDiscounted || o.minTRY !== null || o.maxTRY !== null);
    if (o.onlyDiscounted && best.price.discountPercent === undefined) return false;
    if (o.minTRY !== null && best.tryAmount < o.minTRY) return false;
    if (o.maxTRY !== null && best.tryAmount > o.maxTRY) return false;
    return true;
  });

  const t = (g: Game) => bestPrice(g)?.tryAmount ?? null;
  const d = (g: Game) => bestPrice(g)?.price.discountPercent ?? 0;
  const sorters: Record<SortKey, (a: Game, b: Game) => number> = {
    discount: (a, b) => d(b) - d(a) || b.score - a.score,
    priceAsc: (a, b) => compareNullable(t(a), t(b), (x, y) => x - y),
    priceDesc: (a, b) => compareNullable(t(a), t(b), (x, y) => y - x),
    score: (a, b) => b.score - a.score,
    year: (a, b) => b.releaseYear - a.releaseYear,
    name: (a, b) => a.title.localeCompare(b.title, "tr"),
  };
  return [...filtered].sort(sorters[o.sort]);
}

export function allGenres(games: Game[]): string[] {
  return [...new Set(games.flatMap((g) => g.genres))].sort((a, b) => a.localeCompare(b, "tr"));
}
