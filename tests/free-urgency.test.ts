import { describe, expect, it } from "vitest";
import { hoursUntil, endingSoon, sortBySoonest } from "@/lib/free-urgency";

const now = new Date("2026-07-01T12:00:00Z");

describe("hoursUntil", () => {
  it("returns positive hours for a future end", () => {
    expect(hoursUntil("2026-07-02T12:00:00Z", now)).toBe(24);
  });
  it("returns negative for a past end", () => {
    expect(hoursUntil("2026-07-01T06:00:00Z", now)).toBe(-6);
  });
});

describe("endingSoon", () => {
  it("is true within the window", () => {
    expect(endingSoon({ freeUntil: "2026-07-02T12:00:00Z" }, now)).toBe(true); // 24h
  });
  it("is false beyond the window", () => {
    expect(endingSoon({ freeUntil: "2026-07-05T12:00:00Z" }, now)).toBe(false); // 96h
  });
  it("is false once already ended", () => {
    expect(endingSoon({ freeUntil: "2026-07-01T06:00:00Z" }, now)).toBe(false);
  });
  it("respects a custom threshold", () => {
    expect(endingSoon({ freeUntil: "2026-07-02T12:00:00Z" }, now, 12)).toBe(false); // 24h > 12
  });
});

describe("sortBySoonest", () => {
  it("orders by soonest end first", () => {
    const offers = [
      { freeUntil: "2026-07-05T00:00:00Z" },
      { freeUntil: "2026-07-02T00:00:00Z" },
      { freeUntil: "2026-07-03T00:00:00Z" },
    ];
    expect(sortBySoonest(offers).map((o) => o.freeUntil)).toEqual([
      "2026-07-02T00:00:00Z",
      "2026-07-03T00:00:00Z",
      "2026-07-05T00:00:00Z",
    ]);
  });
  it("pushes invalid dates to the end", () => {
    const offers = [{ freeUntil: "bogus" }, { freeUntil: "2026-07-02T00:00:00Z" }];
    expect(sortBySoonest(offers).map((o) => o.freeUntil)).toEqual([
      "2026-07-02T00:00:00Z",
      "bogus",
    ]);
  });
  it("does not mutate the input", () => {
    const offers = [{ freeUntil: "2026-07-05T00:00:00Z" }, { freeUntil: "2026-07-02T00:00:00Z" }];
    const copy = [...offers];
    sortBySoonest(offers);
    expect(offers).toEqual(copy);
  });
});
