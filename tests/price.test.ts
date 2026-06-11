import { describe, expect, it } from "vitest";
import { bestPrice, priceInTRY, sortedPrices } from "@/lib/price";
import { toTRY } from "@/lib/exchange";
import type { Game, Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";

const p = (store: StoreId, amount: number, currency: "TRY" | "USD"): Price => ({
  store,
  amount,
  currency,
});

const game = (prices: Price[]): Game => ({
  id: "x",
  slug: "x",
  title: "X",
  coverUrl: "",
  genres: [],
  score: 80,
  releaseYear: 2024,
  prices,
  subscriptions: [],
});

describe("priceInTRY", () => {
  it("passes TRY through", () => {
    expect(priceInTRY(p("epic", 100, "TRY"))).toBe(100);
  });

  it("converts USD", () => {
    expect(priceInTRY(p("steam", 10, "USD"))).toBe(toTRY(10));
  });
});

describe("bestPrice / sortedPrices", () => {
  it("picks cheapest across currencies", () => {
    const g = game([p("epic", 500, "TRY"), p("steam", 10, "USD")]); // 10 USD = 442 TL
    expect(bestPrice(g)!.price.store).toBe("steam");
  });

  it("sorts ascending in TL", () => {
    const g = game([p("epic", 500, "TRY"), p("steam", 10, "USD"), p("xbox", 400, "TRY")]);
    expect(sortedPrices(g).map((x) => x.price.store)).toEqual(["xbox", "steam", "epic"]);
  });

  it("resolves discounted original to TL", () => {
    const g = game([
      { store: "steam", amount: 10, currency: "USD", originalAmount: 20, discountPercent: 50 },
    ]);
    const best = bestPrice(g)!;
    expect(best.tryAmount).toBe(toTRY(10));
    expect(best.tryOriginal).toBe(toTRY(20));
  });
});
