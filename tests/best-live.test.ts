import { describe, expect, it } from "vitest";
import { bestLiveTRY } from "@/lib/best-live";

describe("bestLiveTRY", () => {
  it("returns the minimum TRY across stores", () => {
    expect(bestLiveTRY([{ amount: 100, currency: "TRY" }, { amount: 80, currency: "TRY" }], 40)).toBe(80);
  });
  it("converts USD rows with the fx rate", () => {
    expect(bestLiveTRY([{ amount: 3, currency: "USD" }], 40)).toBe(120);
  });
  it("returns null for no rows", () => {
    expect(bestLiveTRY([], 40)).toBeNull();
  });
});
