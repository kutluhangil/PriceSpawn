import { describe, expect, it } from "vitest";
import { GAMES } from "@/data/games";

describe("demo catalog", () => {
  it("has at least 40 games", () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(40);
  });

  it("has unique slugs", () => {
    const slugs = GAMES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every game has at least one price, all positive", () => {
    for (const g of GAMES) {
      expect(g.prices.length, g.slug).toBeGreaterThan(0);
      for (const p of g.prices) {
        expect(p.amount, `${g.slug}/${p.store}`).toBeGreaterThan(0);
        if (p.originalAmount !== undefined) {
          expect(p.originalAmount, `${g.slug}/${p.store}`).toBeGreaterThan(p.amount);
        }
        if (p.discountPercent !== undefined) {
          expect(p.discountPercent, `${g.slug}/${p.store}`).toBeGreaterThan(0);
          expect(p.discountPercent, `${g.slug}/${p.store}`).toBeLessThan(100);
        }
      }
    }
  });

  it("has no duplicate store within a game", () => {
    for (const g of GAMES) {
      const ids = g.prices.map((p) => p.store);
      expect(new Set(ids).size, g.slug).toBe(ids.length);
    }
  });

  it("uses USD only for steam, gog and humble", () => {
    for (const g of GAMES) {
      for (const p of g.prices) {
        if (p.currency === "USD") {
          expect(["steam", "gog", "humble"], `${g.slug}/${p.store}`).toContain(p.store);
        }
      }
    }
  });
});
