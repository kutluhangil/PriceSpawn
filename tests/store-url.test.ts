import { describe, expect, it } from "vitest";
import { storeUrl } from "@/lib/store-url";
import type { Game, Price } from "@/data/games";

const game = (id: string): Game => ({
  id,
  slug: "x",
  title: "X",
  coverUrl: "",
  genres: [],
  score: 80,
  releaseYear: 2024,
  prices: [],
  subscriptions: [],
});
const price = (store: string, url?: string): Price =>
  ({ store, amount: 100, currency: "TRY", url } as Price);

describe("storeUrl", () => {
  it("uses the live url when present", () => {
    expect(storeUrl(game("1091500"), price("steam", "https://itad.link/abc"))).toBe(
      "https://itad.link/abc"
    );
  });
  it("falls back to the Steam app page for steam when no live url and numeric id", () => {
    expect(storeUrl(game("1091500"), price("steam"))).toBe(
      "https://store.steampowered.com/app/1091500"
    );
  });
  it("returns null for steam fallback when id is not numeric", () => {
    expect(storeUrl(game("ghost-of-yotei"), price("steam"))).toBeNull();
  });
  it("returns null when no url and not steam", () => {
    expect(storeUrl(game("1091500"), price("epic"))).toBeNull();
  });
});
