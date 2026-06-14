import { describe, it, expect } from "vitest";
import type { Game } from "@/data/games";
import { relatedGames } from "@/lib/related";

function g(slug: string, genres: string[], score: number): Game {
  return {
    id: slug,
    slug,
    title: slug,
    coverUrl: "",
    genres,
    score,
    releaseYear: 2024,
    prices: [],
    subscriptions: [],
  };
}

const target = g("target", ["RPG", "Açık Dünya"], 90);
const catalog = [
  target,
  g("two-shared-close", ["RPG", "Açık Dünya"], 88),
  g("two-shared-far", ["RPG", "Açık Dünya"], 60),
  g("one-shared", ["RPG", "Strateji"], 95),
  g("no-shared", ["FPS"], 99),
];

describe("relatedGames", () => {
  it("excludes the target itself", () => {
    expect(relatedGames(target, catalog).some((x) => x.slug === "target")).toBe(false);
  });

  it("drops games with no shared genre", () => {
    expect(relatedGames(target, catalog).some((x) => x.slug === "no-shared")).toBe(false);
  });

  it("ranks more shared genres first, then closeness in score", () => {
    const out = relatedGames(target, catalog).map((x) => x.slug);
    expect(out).toEqual(["two-shared-close", "two-shared-far", "one-shared"]);
  });

  it("respects the limit", () => {
    expect(relatedGames(target, catalog, 1)).toHaveLength(1);
  });

  it("returns empty when nothing shares a genre", () => {
    expect(relatedGames(g("lonely", ["Yarış"], 50), catalog)).toEqual([]);
  });
});
