/** Normalize a game title for cross-source matching (editions/punctuation/case folded). */
export function normTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[™®©]/g, "")
    .replace(/&/g, "and")
    .replace(
      /\b(the\s+)?(definitive|deluxe|standard|ultimate|complete|gold|game of the year|goty|remastered|remaster|directors cut|enhanced|anniversary)\b/g,
      "",
    )
    .replace(/\bedition\b/g, "")
    .replace(/[:\-–—'’!.,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
