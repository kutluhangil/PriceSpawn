import { describe, expect, it } from "vitest";
import { genreHub } from "@/lib/genres";

const rows = [
  { genre: "Aksiyon", count: 1200 },
  { genre: "RPG", count: 800 },
  { genre: "Nişþ", count: 3 },
];

describe("genreHub", () => {
  it("sorts by count descending", () => {
    expect(genreHub(rows).map((g) => g.label)).toEqual(["Aksiyon", "RPG", "Nişþ"]);
  });

  it("drops genres below minCount", () => {
    expect(genreHub(rows, 10).map((g) => g.label)).toEqual(["Aksiyon", "RPG"]);
  });

  it("attaches curated slug + blurb when the label is a landing genre", () => {
    const a = genreHub(rows).find((g) => g.label === "Aksiyon")!;
    expect(a.slug).toBe("aksiyon");
    expect(a.blurb).toBeTruthy();
  });

  it("leaves slug/blurb undefined for non-curated genres", () => {
    const n = genreHub(rows).find((g) => g.label === "Nişþ")!;
    expect(n.slug).toBeUndefined();
    expect(n.blurb).toBeUndefined();
  });

  it("builds an encoded /oyunlar filter href", () => {
    const a = genreHub(rows).find((g) => g.label === "Aksiyon")!;
    expect(a.href).toBe("/oyunlar?g=Aksiyon");
  });

  it("carries the count through", () => {
    expect(genreHub(rows).find((g) => g.label === "RPG")!.count).toBe(800);
  });
});
