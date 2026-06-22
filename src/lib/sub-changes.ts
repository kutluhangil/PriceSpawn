import { sql, hasDb } from "@/lib/db";
import type { SubscriptionId } from "@/lib/subscriptions";

export interface SubChangeItem {
  slug: string;
  title: string;
  cover: string;
  subId: SubscriptionId;
  change: "added" | "removed";
  day: string; // YYYY-MM-DD
}

export interface SubChangeSummaryEntry {
  subId: SubscriptionId;
  added: number;
  removed: number;
  sampleCovers: string[]; // up to 4 recently-added covers
}

/** Per-service added/removed counts (+ a few added covers) over the last N days. */
export async function recentChangeSummary(days = 30): Promise<SubChangeSummaryEntry[]> {
  if (!hasDb()) return [];
  try {
    const counts = (await sql!`
      SELECT sub_id, change, COUNT(*)::int AS n
      FROM sub_changes
      WHERE day >= CURRENT_DATE - ${days}::int
      GROUP BY sub_id, change`) as { sub_id: string; change: string; n: number }[];
    const covers = (await sql!`
      SELECT sc.sub_id, cat.cover
      FROM sub_changes sc
      JOIN catalog cat ON cat.slug = sc.slug
      WHERE sc.change = 'added' AND sc.day >= CURRENT_DATE - ${days}::int AND cat.cover <> ''
      ORDER BY sc.day DESC`) as { sub_id: string; cover: string }[];

    const byId = new Map<string, SubChangeSummaryEntry>();
    const ensure = (id: string) => {
      let e = byId.get(id);
      if (!e) {
        e = { subId: id as SubscriptionId, added: 0, removed: 0, sampleCovers: [] };
        byId.set(id, e);
      }
      return e;
    };
    for (const r of counts) {
      const e = ensure(r.sub_id);
      if (r.change === "added") e.added = r.n;
      else if (r.change === "removed") e.removed = r.n;
    }
    for (const r of covers) {
      const e = ensure(r.sub_id);
      if (e.sampleCovers.length < 4) e.sampleCovers.push(r.cover);
    }
    return [...byId.values()].sort((a, b) => b.added + b.removed - (a.added + a.removed));
  } catch {
    return [];
  }
}

/** Recent changes (newest first), joined to catalog for title/cover. */
export async function recentChanges(limit = 500): Promise<SubChangeItem[]> {
  if (!hasDb()) return [];
  try {
    const rows = (await sql!`
      SELECT sc.slug, cat.title, cat.cover, sc.sub_id, sc.change, sc.day::text AS day
      FROM sub_changes sc
      JOIN catalog cat ON cat.slug = sc.slug
      ORDER BY sc.day DESC, cat.title ASC
      LIMIT ${limit}`) as {
      slug: string; title: string; cover: string; sub_id: string; change: string; day: string;
    }[];
    return rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      cover: r.cover,
      subId: r.sub_id as SubscriptionId,
      change: r.change === "removed" ? "removed" : "added",
      day: r.day,
    }));
  } catch {
    return [];
  }
}
