import { describe, expect, it } from "vitest";
import { FREE_OFFERS } from "@/data/free";
import { GAMES } from "@/data/games";

describe("free offers", () => {
  it("has at least 6 offers", () => {
    expect(FREE_OFFERS.length).toBeGreaterThanOrEqual(6);
  });

  it("each has a valid freeUntil date string", () => {
    for (const o of FREE_OFFERS) {
      expect(Number.isNaN(Date.parse(o.freeUntil)), o.title).toBe(false);
    }
  });

  it("slug, when present, exists in the catalog", () => {
    const slugs = new Set(GAMES.map((g) => g.slug));
    for (const o of FREE_OFFERS) {
      if (o.slug) expect(slugs.has(o.slug), o.slug).toBe(true);
    }
  });

  it("normalTRY is positive", () => {
    for (const o of FREE_OFFERS) expect(o.normalTRY, o.title).toBeGreaterThan(0);
  });
});
