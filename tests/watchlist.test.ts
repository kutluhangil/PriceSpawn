import { describe, expect, it } from "vitest";
import {
  addWatch,
  removeWatch,
  isWatched,
  setTarget,
  targetMet,
  type WatchItem,
} from "@/lib/watchlist";
import { sampleGames } from "./fixtures";
import { bestPrice } from "@/lib/price";

const g = sampleGames()[0];

describe("watchlist ops", () => {
  it("adds and detects membership", () => {
    const list = addWatch([], g.slug);
    expect(isWatched(list, g.slug)).toBe(true);
    expect(list).toHaveLength(1);
  });

  it("does not duplicate", () => {
    const list = addWatch(addWatch([], g.slug), g.slug);
    expect(list).toHaveLength(1);
  });

  it("removes", () => {
    const list = removeWatch(addWatch([], g.slug), g.slug);
    expect(isWatched(list, g.slug)).toBe(false);
  });

  it("sets a target price", () => {
    const list = setTarget(addWatch([], g.slug), g.slug, 500);
    expect(list[0].targetTRY).toBe(500);
  });

  it("targetMet true when best <= target", () => {
    const best = bestPrice(g)!.tryAmount;
    const item: WatchItem = { slug: g.slug, targetTRY: best + 100 };
    expect(targetMet(item, g)).toBe(true);
    const item2: WatchItem = { slug: g.slug, targetTRY: best - 100 };
    expect(targetMet(item2, g)).toBe(false);
  });

  it("targetMet false when no target set", () => {
    expect(targetMet({ slug: g.slug, targetTRY: null }, g)).toBe(false);
  });
});
