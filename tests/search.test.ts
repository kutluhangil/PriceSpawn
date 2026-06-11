import { describe, expect, it } from "vitest";
import { normalizeTR, searchGames } from "@/lib/search";
import { GAMES } from "@/data/games";

describe("normalizeTR", () => {
  it("maps Turkish characters", () => {
    expect(normalizeTR("WIıİşŞçÇğĞöÖüÜ")).toBe("wiiissccggoouu");
  });

  it("strips punctuation and collapses spaces", () => {
    expect(normalizeTR("Assassin's   Creed:  Mirage")).toBe("assassins creed mirage");
  });
});

describe("searchGames", () => {
  it("finds by partial title case-insensitively", () => {
    const r = searchGames("forza", GAMES);
    expect(r.length).toBeGreaterThanOrEqual(2);
    expect(r[0].title.toLowerCase()).toContain("forza");
  });

  it("tolerates Turkish keyboard input", () => {
    const r = searchGames("wıtcher", GAMES);
    expect(r[0].slug).toBe("the-witcher-3-wild-hunt");
  });

  it("returns empty for gibberish", () => {
    expect(searchGames("zzzxqqy", GAMES)).toEqual([]);
  });

  it("returns empty for blank query", () => {
    expect(searchGames("   ", GAMES)).toEqual([]);
  });

  it("respects limit", () => {
    expect(searchGames("a", GAMES, 5).length).toBeLessThanOrEqual(5);
  });
});
