import { describe, expect, it } from "vitest";
import { serializeOpts, parseOpts } from "@/lib/filter-url";
import type { FilterOpts } from "@/lib/filters";

const base: FilterOpts = {
  query: "", genres: [], stores: [], subscriptions: [],
  onlyDiscounted: false, atLow: false, minTRY: null, maxTRY: null, sort: "discount",
};

describe("filter-url", () => {
  it("empty opts serialize to empty string", () => {
    expect(serializeOpts(base)).toBe("");
  });

  it("round-trips a populated filter", () => {
    const o: FilterOpts = {
      query: "need for speed",
      genres: ["RPG", "Aksiyon"], stores: ["steam", "epic"], subscriptions: ["gamepass"],
      onlyDiscounted: true, atLow: true, minTRY: 100, maxTRY: 900, sort: "priceAsc",
    };
    const parsed = parseOpts(new URLSearchParams(serializeOpts(o)));
    expect({ ...base, ...parsed }).toEqual(o);
  });

  it("round-trips the atLow flag", () => {
    expect(serializeOpts({ ...base, atLow: true })).toContain("atl=1");
    expect(parseOpts(new URLSearchParams("atl=1")).atLow).toBe(true);
  });

  it("accepts legacy ?store= alias", () => {
    const parsed = parseOpts(new URLSearchParams("store=epic"));
    expect(parsed.stores).toEqual(["epic"]);
  });

  it("ignores an invalid sort", () => {
    const parsed = parseOpts(new URLSearchParams("sort=bogus"));
    expect(parsed.sort).toBeUndefined();
  });
});
