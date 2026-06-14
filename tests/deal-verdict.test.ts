import { describe, it, expect } from "vitest";
import { dealVerdict } from "@/lib/deal-verdict";

describe("dealVerdict", () => {
  it("returns null without a usable price", () => {
    expect(dealVerdict({ bestTRY: null })).toBeNull();
    expect(dealVerdict({ bestTRY: 0 })).toBeNull();
  });

  describe("with all-time low", () => {
    it("buy-low at/within 2% of ATL", () => {
      expect(dealVerdict({ bestTRY: 100, atlTRY: 100 })).toEqual({ level: "buy-low", abovePct: 0 });
      expect(dealVerdict({ bestTRY: 101, atlTRY: 100 })).toEqual({ level: "buy-low", abovePct: 0 });
    });

    it("buy within 15% of ATL", () => {
      expect(dealVerdict({ bestTRY: 110, atlTRY: 100 })).toEqual({ level: "buy", abovePct: 10 });
    });

    it("buy when discount is huge even if above ATL", () => {
      expect(dealVerdict({ bestTRY: 200, atlTRY: 100, discountPercent: 60 })).toEqual({
        level: "buy",
        abovePct: 100,
      });
    });

    it("ok within 40% of ATL", () => {
      expect(dealVerdict({ bestTRY: 130, atlTRY: 100 })).toEqual({ level: "ok", abovePct: 30 });
    });

    it("wait when far above ATL with weak discount", () => {
      expect(dealVerdict({ bestTRY: 200, atlTRY: 100, discountPercent: 10 })).toEqual({
        level: "wait",
        abovePct: 100,
      });
    });
  });

  describe("without all-time low", () => {
    it("buy on a 50%+ discount", () => {
      expect(dealVerdict({ bestTRY: 100, discountPercent: 50 })).toEqual({ level: "buy" });
    });
    it("ok on a 20–49% discount", () => {
      expect(dealVerdict({ bestTRY: 100, discountPercent: 25 })).toEqual({ level: "ok" });
    });
    it("null on weak/no discount (don't nag full-price)", () => {
      expect(dealVerdict({ bestTRY: 100, discountPercent: 10 })).toBeNull();
      expect(dealVerdict({ bestTRY: 100 })).toBeNull();
    });
  });
});
