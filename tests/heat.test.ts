import { describe, expect, it } from "vitest";
import { tallyVotes, sortByHeat } from "@/lib/heat";

describe("tallyVotes", () => {
  it("counts rows per slug", () => {
    const rows = [{ slug: "a" }, { slug: "b" }, { slug: "a" }, { slug: "a" }];
    expect(tallyVotes(rows)).toEqual({ a: 3, b: 1 });
  });

  it("returns an empty map for no rows", () => {
    expect(tallyVotes([])).toEqual({});
  });
});

describe("sortByHeat", () => {
  const items = [{ slug: "a" }, { slug: "b" }, { slug: "c" }];

  it("orders by heat count descending", () => {
    const r = sortByHeat(items, { a: 1, b: 5, c: 3 });
    expect(r.map((x) => x.slug)).toEqual(["b", "c", "a"]);
  });

  it("keeps original order for ties (stable)", () => {
    const r = sortByHeat(items, { a: 2, b: 2, c: 2 });
    expect(r.map((x) => x.slug)).toEqual(["a", "b", "c"]);
  });

  it("treats missing slugs as zero heat and sinks them in original order", () => {
    const r = sortByHeat(items, { b: 4 });
    expect(r.map((x) => x.slug)).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the input array", () => {
    const input = [...items];
    sortByHeat(input, { c: 9 });
    expect(input.map((x) => x.slug)).toEqual(["a", "b", "c"]);
  });
});
