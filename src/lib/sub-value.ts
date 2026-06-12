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

export function subscriptionValue(id: SubscriptionId, games: Game[]): SubValue {
  const included = games.filter((g) => g.subscriptions.includes(id));
  const totalTRY = included.reduce((s, g) => s + (bestPrice(g)?.tryAmount ?? 0), 0);
  const monthlyTRY = SUBSCRIPTIONS[id].monthlyTRY;
  return {
    id,
    count: included.length,
    totalTRY: Math.round(totalTRY * 100) / 100,
    monthlyTRY,
    ratio: monthlyTRY ? totalTRY / monthlyTRY : 0,
    games: included,
  };
}
