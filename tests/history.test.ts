import { describe, expect, it } from "vitest";
import { priceHistory, allTimeLow, isAllTimeLow, sparklinePath } from "@/lib/history";
import { sampleGames } from "./fixtures";
import { priceInTRY } from "@/lib/price";

const GAMES = sampleGames();
const game = GAMES[0];
const store = game.prices[0].store;

describe("priceHistory", () => {
  it("is deterministic for same slug+store", () => {
    const a = priceHistory(game, store, 90);
    const b = priceHistory(game, store, 90);
    expect(a).toEqual(b);
  });

  it("returns the requested number of days", () => {
    expect(priceHistory(game, store, 90)).toHaveLength(90);
    expect(priceHistory(game, store, 30)).toHaveLength(30);
  });

  it("ends at the current store price", () => {
    const h = priceHistory(game, store, 90);
    const current = priceInTRY(game.prices.find((p) => p.store === store)!);
    expect(h[h.length - 1].tryAmount).toBe(current);
  });

  it("has all positive amounts and incrementing days", () => {
    const h = priceHistory(game, store, 90);
    h.forEach((pt, i) => {
      expect(pt.tryAmount).toBeGreaterThan(0);
      expect(pt.day).toBe(i);
    });
  });

  it("differs across stores", () => {
    const g = GAMES.find((x) => x.prices.length > 1)!;
    const a = priceHistory(g, g.prices[0].store, 90);
    const b = priceHistory(g, g.prices[1].store, 90);
    expect(a).not.toEqual(b);
  });
});

describe("allTimeLow / isAllTimeLow", () => {
  it("all-time-low is <= every history point of every store", () => {
    const atl = allTimeLow(game);
    for (const p of game.prices) {
      for (const pt of priceHistory(game, p.store, 90)) {
        expect(atl.tryAmount).toBeLessThanOrEqual(pt.tryAmount + 0.001);
      }
    }
  });

  it("isAllTimeLow agrees with the data", () => {
    const atl = allTimeLow(game);
    const best = Math.min(...game.prices.map(priceInTRY));
    expect(isAllTimeLow(game)).toBe(best <= atl.tryAmount * 1.02);
  });
});

describe("sparklinePath", () => {
  it("produces an SVG path string spanning the box", () => {
    const pts = priceHistory(game, store, 30);
    const d = sparklinePath(pts, 100, 28);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain("L");
  });

  it("returns empty string for no points", () => {
    expect(sparklinePath([], 100, 28)).toBe("");
  });
});
