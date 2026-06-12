import type { Game } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";

export type SortKey = "discount" | "priceAsc" | "priceDesc" | "score" | "year" | "name";

export interface FilterOpts {
  genres: string[];
  stores: StoreId[];
  subscriptions: SubscriptionId[];
  onlyDiscounted: boolean;
  minTRY: number | null;
  maxTRY: number | null;
  sort: SortKey;
}

export function filterSortGames(games: Game[], o: FilterOpts): Game[] {
  const filtered = games.filter((g) => {
    if (o.genres.length && !o.genres.some((x) => g.genres.includes(x))) return false;
    if (o.stores.length && !o.stores.some((s) => g.prices.some((p) => p.store === s)))
      return false;
    if (o.subscriptions.length && !o.subscriptions.some((s) => g.subscriptions.includes(s)))
      return false;
    const best = bestPrice(g);
    if (!best) return false;
    if (o.onlyDiscounted && best.price.discountPercent === undefined) return false;
    if (o.minTRY !== null && best.tryAmount < o.minTRY) return false;
    if (o.maxTRY !== null && best.tryAmount > o.maxTRY) return false;
    return true;
  });

  const t = (g: Game) => bestPrice(g)!.tryAmount;
  const d = (g: Game) => bestPrice(g)!.price.discountPercent ?? 0;
  const sorters: Record<SortKey, (a: Game, b: Game) => number> = {
    discount: (a, b) => d(b) - d(a),
    priceAsc: (a, b) => t(a) - t(b),
    priceDesc: (a, b) => t(b) - t(a),
    score: (a, b) => b.score - a.score,
    year: (a, b) => b.releaseYear - a.releaseYear,
    name: (a, b) => a.title.localeCompare(b.title, "tr"),
  };
  return [...filtered].sort(sorters[o.sort]);
}

export function allGenres(games: Game[]): string[] {
  return [...new Set(games.flatMap((g) => g.genres))].sort((a, b) => a.localeCompare(b, "tr"));
}
