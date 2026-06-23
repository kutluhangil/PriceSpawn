import { describe, it, expect } from "vitest";
import {
  parseSteamInput,
  summarize,
  bulkAlarmTarget,
  sortItems,
  filterItems,
  rowToItem,
  type WishlistItem,
} from "@/lib/wishlist";

describe("parseSteamInput", () => {
  it("recognizes a bare SteamID64", () => {
    expect(parseSteamInput("76561198000000000")).toEqual({ kind: "id", id: "76561198000000000" });
  });
  it("extracts id from a /profiles/ URL", () => {
    expect(parseSteamInput("https://steamcommunity.com/profiles/76561198000000000/")).toEqual({
      kind: "id",
      id: "76561198000000000",
    });
  });
  it("extracts vanity from an /id/ URL", () => {
    expect(parseSteamInput("https://steamcommunity.com/id/gabelogan/")).toEqual({ kind: "vanity", vanity: "gabelogan" });
  });
  it("treats a bare handle as a vanity", () => {
    expect(parseSteamInput("gabelogan")).toEqual({ kind: "vanity", vanity: "gabelogan" });
  });
  it("rejects empty / nonsense input", () => {
    expect(parseSteamInput("")).toEqual({ kind: "invalid" });
    expect(parseSteamInput("   ")).toEqual({ kind: "invalid" });
    expect(parseSteamInput("a b c!")).toEqual({ kind: "invalid" });
  });
});

const mk = (over: Partial<WishlistItem>): WishlistItem => ({
  slug: "g",
  title: "G",
  cover: "",
  year: 2020,
  appid: "1",
  priceTRY: null,
  discount: null,
  store: null,
  ...over,
});

describe("summarize", () => {
  it("counts matched / on-sale / untracked and sums the cheapest cart", () => {
    const items = [
      mk({ priceTRY: 100, discount: 50, store: "steam" }),
      mk({ priceTRY: 200, discount: null, store: "gog" }),
      mk({ priceTRY: null, discount: null, store: null }),
    ];
    expect(summarize(items, 10)).toEqual({ matched: 3, onSale: 1, untracked: 7, cheapestCartTRY: 300 });
  });
  it("never reports negative untracked", () => {
    expect(summarize([mk({})], 0).untracked).toBe(0);
  });
});

describe("bulkAlarmTarget", () => {
  it("sets target one kuruş below today's best so it fires on the next drop", () => {
    expect(bulkAlarmTarget(100)).toBe(99.99);
  });
});

describe("sortItems", () => {
  const a = mk({ slug: "a", title: "Zelda", priceTRY: 300, discount: 10 });
  const b = mk({ slug: "b", title: "Alpha", priceTRY: 100, discount: 75 });
  const c = mk({ slug: "c", title: "Mid", priceTRY: 200, discount: null });
  it("discount: biggest first", () => {
    expect([a, b, c].sort(sortItems("discount")).map((x) => x.slug)).toEqual(["b", "a", "c"]);
  });
  it("priceAsc: cheapest first, priceless last", () => {
    const d = mk({ slug: "d", priceTRY: null });
    expect([a, b, d].sort(sortItems("priceAsc")).map((x) => x.slug)).toEqual(["b", "a", "d"]);
  });
  it("name: alphabetical by title", () => {
    expect([a, b, c].sort(sortItems("name")).map((x) => x.slug)).toEqual(["b", "c", "a"]);
  });
});

describe("filterItems", () => {
  const items = [
    mk({ slug: "s", discount: 50, store: "steam" }),
    mk({ slug: "g", discount: null, store: "gog" }),
  ];
  it("onlyDiscount keeps discounted items", () => {
    expect(filterItems(items, { onlyDiscount: true }).map((x) => x.slug)).toEqual(["s"]);
  });
  it("store filters by best-price store", () => {
    expect(filterItems(items, { store: "gog" }).map((x) => x.slug)).toEqual(["g"]);
  });
  it("no opts returns all", () => {
    expect(filterItems(items, {}).length).toBe(2);
  });
});

describe("rowToItem", () => {
  it("maps a priced, discounted row", () => {
    expect(
      rowToItem({
        slug: "g",
        title: "G",
        cover: "c.jpg",
        year: 2021,
        appid: "42",
        free: false,
        try_amount: "199.995",
        store: "steam",
        discount_percent: 60,
      }),
    ).toEqual({ slug: "g", title: "G", cover: "c.jpg", year: 2021, appid: "42", priceTRY: 200, discount: 60, store: "steam" });
  });
  it("maps a priceless, free row (no discount → null, isFree set)", () => {
    expect(
      rowToItem({
        slug: "f",
        title: "F",
        cover: "",
        year: 0,
        appid: "7",
        free: true,
        try_amount: null,
        store: null,
        discount_percent: 0,
      }),
    ).toEqual({ slug: "f", title: "F", cover: "", year: 0, appid: "7", priceTRY: null, discount: null, store: null, isFree: true });
  });
});
