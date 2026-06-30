import { describe, expect, it } from "vitest";
import { activeSeason } from "@/lib/season";
import type { SaleEvent } from "@/data/sales";

const summer: SaleEvent = {
  id: "steam-summer-2026",
  name: "Steam Yaz İndirimi",
  store: "steam",
  start: "2026-06-25",
  end: "2026-07-09",
  season: "summer",
};
const nextFest: SaleEvent = {
  id: "steam-nextfest-jun-2026",
  name: "Steam Next Fest (Haziran)",
  store: "steam",
  start: "2026-06-15",
  end: "2026-06-22",
};

describe("activeSeason", () => {
  it("returns the season of a tagged event that is active now", () => {
    const r = activeSeason([summer], new Date("2026-06-30T12:00:00Z"));
    expect(r?.theme).toBe("summer");
    expect(r?.id).toBe("steam-summer-2026");
    expect(r?.name).toBe("Steam Yaz İndirimi");
  });

  it("returns null when the only active event has no season tag", () => {
    expect(activeSeason([nextFest], new Date("2026-06-18T12:00:00Z"))).toBeNull();
  });

  it("returns null when the seasonal event is not active (upcoming)", () => {
    expect(activeSeason([summer], new Date("2026-06-13T12:00:00Z"))).toBeNull();
  });

  it("returns null when the seasonal event is past", () => {
    expect(activeSeason([summer], new Date("2026-07-20T12:00:00Z"))).toBeNull();
  });

  it("picks the seasonal event even when a non-seasonal event is also active", () => {
    const overlap: SaleEvent = { ...nextFest, end: "2026-07-01" };
    const r = activeSeason([overlap, summer], new Date("2026-06-30T12:00:00Z"));
    expect(r?.theme).toBe("summer");
  });

  it("carries the event url through when present", () => {
    const withUrl: SaleEvent = { ...summer, url: "https://store.steampowered.com" };
    expect(activeSeason([withUrl], new Date("2026-06-30T12:00:00Z"))?.url).toBe(
      "https://store.steampowered.com",
    );
  });
});
