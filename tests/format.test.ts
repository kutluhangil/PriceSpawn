import { describe, expect, it } from "vitest";
import { formatTRY } from "@/lib/format";

describe("formatTRY", () => {
  it("formats Turkish style", () => {
    expect(formatTRY(1234.5, "tr")).toBe("₺1.234,50");
  });

  it("formats English style", () => {
    expect(formatTRY(1234.5, "en")).toBe("₺1,234.50");
  });

  it("drops decimals for whole amounts", () => {
    expect(formatTRY(999, "tr")).toBe("₺999");
  });
});
