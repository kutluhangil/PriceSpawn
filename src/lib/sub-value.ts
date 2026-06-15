import type { Game } from "@/data/games";
import type { SubscriptionId } from "@/lib/subscriptions";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";

export interface SubValue {
  id: SubscriptionId;
  count: number;
  totalTRY: number;
  monthlyTRY: number;
  ratio: number; // totalTRY / monthlyTRY
  games: Game[];
}

/** Value across one or more subscription ids (union of games, deduped). */
export function subscriptionValueMerged(ids: SubscriptionId[], games: Game[]): SubValue {
  const idSet = new Set(ids);
  const included = games.filter((g) => g.subscriptions.some((s) => idSet.has(s)));
  const totalTRY = included.reduce((s, g) => s + (bestPrice(g)?.tryAmount ?? 0), 0);
  const monthlyTRY = SUBSCRIPTIONS[ids[0]].monthlyTRY;
  return {
    id: ids[0],
    count: included.length,
    totalTRY: Math.round(totalTRY * 100) / 100,
    monthlyTRY,
    ratio: monthlyTRY ? totalTRY / monthlyTRY : 0,
    games: included,
  };
}

export function subscriptionValue(id: SubscriptionId, games: Game[]): SubValue {
  return subscriptionValueMerged([id], games);
}
