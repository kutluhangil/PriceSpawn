import { GAMES, type Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import { setRate } from "@/lib/exchange";
import type { LivePayload } from "@/app/api/prices/route";

const bySlug = new Map(GAMES.map((g) => [g.slug, g]));

/**
 * Apply live data over the demo catalog in place:
 *  - update the USD→TRY rate
 *  - replace each game's store price with the live one (keeping demo as fallback
 *    for stores/games we don't fetch yet)
 * Returns true if anything changed (so the provider can trigger a re-render).
 */
export function applyLive(payload: LivePayload): boolean {
  let changed = false;
  if (payload.fx) {
    setRate(payload.fx);
    changed = true;
  }
  for (const [slug, stores] of Object.entries(payload.prices)) {
    const game = bySlug.get(slug);
    if (!game) continue;
    for (const [store, p] of Object.entries(stores)) {
      const next: Price = {
        store: store as StoreId,
        amount: p.amount,
        currency: p.currency === "USD" ? "USD" : "TRY",
        ...(p.originalAmount != null ? { originalAmount: p.originalAmount } : {}),
        ...(p.discountPercent != null ? { discountPercent: p.discountPercent } : {}),
      };
      const idx = game.prices.findIndex((x) => x.store === store);
      if (idx >= 0) game.prices[idx] = next;
      else game.prices.push(next);
      changed = true;
    }
  }
  return changed;
}
