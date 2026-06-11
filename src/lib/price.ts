import type { Game, Price } from "@/data/games";
import { toTRY } from "@/lib/exchange";

export interface ResolvedPrice {
  price: Price;
  tryAmount: number;
  tryOriginal?: number;
}

export function priceInTRY(price: Price): number {
  return price.currency === "USD" ? toTRY(price.amount) : price.amount;
}

export function resolvePrice(price: Price): ResolvedPrice {
  return {
    price,
    tryAmount: priceInTRY(price),
    tryOriginal:
      price.originalAmount !== undefined
        ? priceInTRY({ ...price, amount: price.originalAmount })
        : undefined,
  };
}

export function sortedPrices(game: Game): ResolvedPrice[] {
  return game.prices.map(resolvePrice).sort((a, b) => a.tryAmount - b.tryAmount);
}

export function bestPrice(game: Game): ResolvedPrice | null {
  return sortedPrices(game)[0] ?? null;
}
