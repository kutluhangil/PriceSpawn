import { describe, expect, it } from "vitest";
import { GAMES } from "@/data/games";

describe("catalog metadata", () => {
  it("has many games", () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(2000);
  });

  it("has unique slugs", () => {
    const slugs = GAMES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("scores in range and genres present", () => {
    for (const g of GAMES) {
      expect(g.score, g.slug).toBeGreaterThanOrEqual(0);
      expect(g.score, g.slug).toBeLessThanOrEqual(100);
      expect(g.genres.length, g.slug).toBeGreaterThan(0);
    }
  });

  it("ships no hardcoded prices (prices come from the live API)", () => {
    const leaked = GAMES.filter((g) => g.prices.length > 0 && !g.unreleased);
    expect(leaked.map((g) => g.slug)).toEqual([]);
  });
});
