import { describe, expect, it } from "vitest";
import { USD_TRY, toTRY } from "@/lib/exchange";

describe("toTRY", () => {
  it("converts USD using the demo rate", () => {
    expect(toTRY(1)).toBe(USD_TRY);
  });

  it("rounds to 2 decimals", () => {
    expect(toTRY(29.99)).toBeCloseTo(Math.round(29.99 * USD_TRY * 100) / 100, 2);
  });

  it("returns 0 for 0", () => {
    expect(toTRY(0)).toBe(0);
  });
});
