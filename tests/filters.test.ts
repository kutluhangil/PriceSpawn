import { describe, expect, it } from "vitest";
import { filterSortGames, type FilterOpts } from "@/lib/filters";
import { sampleGames } from "./fixtures";
import { bestPrice } from "@/lib/price";

const GAMES = sampleGames();
const base: FilterOpts = {
  genres: [],
  stores: [],
  subscriptions: [],
  onlyDiscounted: false,
  minTRY: null,
  maxTRY: null,
  sort: "discount",
};

describe("filterSortGames", () => {
  it("returns all games with empty filters", () => {
    expect(filterSortGames(GAMES, base)).toHaveLength(GAMES.length);
  });

  it("filters by store", () => {
    const r = filterSortGames(GAMES, { ...base, stores: ["ea"] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((g) => g.prices.some((p) => p.store === "ea"))).toBe(true);
  });

  it("filters by subscription", () => {
    const r = filterSortGames(GAMES, { ...base, subscriptions: ["gamepass"] });
    expect(r.every((g) => g.subscriptions.includes("gamepass"))).toBe(true);
  });

  it("filters by genre", () => {
    const r = filterSortGames(GAMES, { ...base, genres: ["RPG"] });
    expect(r.every((g) => g.genres.includes("RPG"))).toBe(true);
  });

  it("onlyDiscounted keeps only discounted best prices", () => {
    const r = filterSortGames(GAMES, { ...base, onlyDiscounted: true });
    expect(r.every((g) => bestPrice(g)!.price.discountPercent !== undefined)).toBe(true);
  });

  it("respects price range", () => {
    const r = filterSortGames(GAMES, { ...base, minTRY: 1000, maxTRY: 2000 });
    expect(
      r.every((g) => {
        const t = bestPrice(g)!.tryAmount;
        return t >= 1000 && t <= 2000;
      })
    ).toBe(true);
  });

  it("sorts by price ascending", () => {
    const r = filterSortGames(GAMES, { ...base, sort: "priceAsc" });
    const prices = r.map((g) => bestPrice(g)!.tryAmount);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("sorts by name", () => {
    const r = filterSortGames(GAMES, { ...base, sort: "name" });
    const names = r.map((g) => g.title);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "tr")));
  });
});
