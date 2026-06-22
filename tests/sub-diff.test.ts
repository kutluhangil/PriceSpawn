import { describe, expect, it } from "vitest";
import { diffMembership, type Membership } from "@/lib/sub-diff";

const m = (obj: Record<string, string[]>): Membership =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, new Set(v)]));

describe("diffMembership", () => {
  it("cold service: skips 'added' when old has no rows for that service", () => {
    const out = diffMembership(m({}), m({ a: ["gamepass"], b: ["gamepass"] }), ["gamepass"], new Set(["gamepass"]));
    expect(out).toEqual([]);
  });

  it("detects added and removed for a warm service", () => {
    const old = m({ a: ["gamepass"], b: ["gamepass"] });
    const next = m({ a: ["gamepass"], c: ["gamepass"] });
    const out = diffMembership(old, next, ["gamepass"], new Set());
    expect(out).toContainEqual({ slug: "c", subId: "gamepass", change: "added" });
    expect(out).toContainEqual({ slug: "b", subId: "gamepass", change: "removed" });
    expect(out).toHaveLength(2);
  });

  it("ignores services not owned by this job", () => {
    const out = diffMembership(m({ a: ["psplus"] }), m({ a: [] }), ["gamepass"], new Set());
    expect(out).toEqual([]);
  });

  it("re-entry: removal in one call, add in a later call (pure contract)", () => {
    const leave = diffMembership(m({ a: ["gamepass"] }), m({}), ["gamepass"], new Set());
    expect(leave).toEqual([{ slug: "a", subId: "gamepass", change: "removed" }]);
    const back = diffMembership(m({}), m({ a: ["gamepass"] }), ["gamepass"], new Set());
    expect(back).toEqual([{ slug: "a", subId: "gamepass", change: "added" }]);
  });

  it("no change when membership is identical", () => {
    const same = m({ a: ["gamepass", "eaplay"] });
    expect(diffMembership(same, m({ a: ["gamepass", "eaplay"] }), ["gamepass", "eaplay"], new Set())).toEqual([]);
  });
});
