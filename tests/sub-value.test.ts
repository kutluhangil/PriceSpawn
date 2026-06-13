import { describe, expect, it } from "vitest";
import { subscriptionValue } from "@/lib/sub-value";
import { sampleGames } from "./fixtures";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";

const GAMES = sampleGames();

describe("subscriptionValue", () => {
  it("counts games included in the subscription", () => {
    const v = subscriptionValue("gamepass", GAMES);
    const expected = GAMES.filter((g) => g.subscriptions.includes("gamepass"));
    expect(v.count).toBe(expected.length);
    expect(v.games).toHaveLength(expected.length);
  });

  it("totals best prices of included games", () => {
    const v = subscriptionValue("eaplay", GAMES);
    const expected = GAMES.filter((g) => g.subscriptions.includes("eaplay")).reduce(
      (s, g) => s + bestPrice(g)!.tryAmount,
      0
    );
    expect(v.totalTRY).toBeCloseTo(expected, 1);
  });

  it("exposes monthly price and value ratio", () => {
    const v = subscriptionValue("gamepass", GAMES);
    expect(v.monthlyTRY).toBe(SUBSCRIPTIONS.gamepass.monthlyTRY);
    expect(v.ratio).toBeCloseTo(v.totalTRY / v.monthlyTRY, 2);
  });

  it("supports the eaplaypro tier", () => {
    const v = subscriptionValue("eaplaypro", GAMES);
    expect(v.monthlyTRY).toBe(SUBSCRIPTIONS.eaplaypro.monthlyTRY);
    expect(v.count).toBeGreaterThanOrEqual(0);
  });
});
