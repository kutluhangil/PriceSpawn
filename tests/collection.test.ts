import { describe, expect, it } from "vitest";
import { isOwned, addOwned, removeOwned, toggleOwned } from "@/lib/collection";

describe("collection", () => {
  it("reports membership", () => {
    expect(isOwned(["a", "b"], "b")).toBe(true);
    expect(isOwned(["a", "b"], "c")).toBe(false);
  });

  it("adds a slug without duplicating", () => {
    expect(addOwned(["a"], "b")).toEqual(["a", "b"]);
    expect(addOwned(["a", "b"], "b")).toEqual(["a", "b"]);
  });

  it("removes a slug", () => {
    expect(removeOwned(["a", "b", "c"], "b")).toEqual(["a", "c"]);
    expect(removeOwned(["a"], "x")).toEqual(["a"]);
  });

  it("toggles membership", () => {
    expect(toggleOwned(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleOwned(["a", "b"], "b")).toEqual(["a"]);
  });

  it("does not mutate the input", () => {
    const input = ["a", "b"];
    addOwned(input, "c");
    removeOwned(input, "a");
    toggleOwned(input, "a");
    expect(input).toEqual(["a", "b"]);
  });
});
