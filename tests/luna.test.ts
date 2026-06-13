import { describe, expect, it } from "vitest";
import { activeLunaGames } from "@/lib/luna";
import type { LunaFreeGame } from "@/data/luna";

const g = (validUntil: string): LunaFreeGame => ({
  title: "X", claimStore: "gog", coverUrl: "", claimUrl: "u", validUntil,
});

describe("activeLunaGames", () => {
  it("keeps games whose validUntil is today or later", () => {
    const r = activeLunaGames([g("2026-06-30")], new Date("2026-06-14T12:00:00Z"));
    expect(r).toHaveLength(1);
  });
  it("drops games past validUntil", () => {
    const r = activeLunaGames([g("2026-06-13")], new Date("2026-06-14T12:00:00Z"));
    expect(r).toHaveLength(0);
  });
});
