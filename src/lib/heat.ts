/** Community "heat" — anonymous votes that a game's current deal is hot. */

export type HeatCounts = Record<string, number>;

/** Build a slug→count map from raw vote rows (one row per vote). */
export function tallyVotes(rows: { slug: string }[]): HeatCounts {
  const out: HeatCounts = {};
  for (const r of rows) out[r.slug] = (out[r.slug] ?? 0) + 1;
  return out;
}

/**
 * Sort items by heat (desc). Ties keep their original order and unknown slugs
 * count as zero heat, so the sort is stable and lists degrade gracefully when
 * no votes exist yet. Does not mutate the input.
 */
export function sortByHeat<T extends { slug: string }>(items: T[], counts: HeatCounts): T[] {
  return items
    .map((item, i) => ({ item, i, c: counts[item.slug] ?? 0 }))
    .sort((a, b) => b.c - a.c || a.i - b.i)
    .map((x) => x.item);
}
