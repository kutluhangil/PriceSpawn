import { describe, expect, it } from "vitest";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";

const ev = { start: "2026-06-25", end: "2026-07-09" };

describe("saleStatus", () => {
  it("is upcoming before the start", () => {
    expect(saleStatus(ev, new Date("2026-06-13T12:00:00Z"))).toBe("upcoming");
  });
  it("is active within the window (inclusive ends)", () => {
    expect(saleStatus(ev, new Date("2026-06-25T00:00:00Z"))).toBe("active");
    expect(saleStatus(ev, new Date("2026-07-09T23:00:00Z"))).toBe("active");
  });
  it("is past after the end", () => {
    expect(saleStatus(ev, new Date("2026-07-10T12:00:00Z"))).toBe("past");
  });
});

describe("daysUntil", () => {
  it("counts whole days to a future date", () => {
    expect(daysUntil("2026-06-25", new Date("2026-06-13T20:00:00Z"))).toBe(12);
  });
  it("is zero on the day itself", () => {
    expect(daysUntil("2026-06-13", new Date("2026-06-13T20:00:00Z"))).toBe(0);
  });
});

describe("upcomingAndActive", () => {
  it("drops past events and sorts by start", () => {
    const events = [
      { id: "b", name: "B", store: "steam" as const, start: "2026-08-01", end: "2026-08-05" },
      { id: "a", name: "A", store: "steam" as const, start: "2026-07-01", end: "2026-07-05" },
      { id: "old", name: "Old", store: "steam" as const, start: "2026-01-01", end: "2026-01-05" },
    ];
    const r = upcomingAndActive(events, new Date("2026-06-13T00:00:00Z"));
    expect(r.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
