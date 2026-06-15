import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { GAMES } from "@/data/games";
import { itadHistory, type ItadHistoryPoint } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export interface HistoryPayload {
  byStore: Record<string, { date: string; amount: number }[]>;
  days: number;
}

const EMPTY: HistoryPayload = { byStore: {}, days: 0 };

/** Collapse raw ITAD points to one price per store per day (latest that day). */
function toPayload(points: ItadHistoryPoint[]): HistoryPayload {
  points.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
  const last = new Map<string, ItadHistoryPoint>();
  for (const p of points) last.set(`${p.store}|${p.day}`, p);
  const byStore: HistoryPayload["byStore"] = {};
  for (const p of last.values()) (byStore[p.store] ??= []).push({ date: p.day, amount: p.amount });
  for (const s of Object.keys(byStore)) byStore[s].sort((a, b) => (a.date < b.date ? -1 : 1));
  return { byStore, days: new Set([...last.values()].map((p) => p.day)).size };
}

/** Real price history for one game: ITAD recorded history, DB snapshots as fallback. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json(EMPTY satisfies HistoryPayload);

  const game = GAMES.find((g) => g.slug === slug);
  const appid = game && /^\d+$/.test(game.id) ? game.id : null;
  const key = process.env.ITAD_API_KEY;

  // 1) Prefer ITAD's full recorded history.
  if (appid && key && hasDb()) {
    try {
      const rows = (await sql!`SELECT itad_id FROM itad_map WHERE appid = ${appid}`) as { itad_id: string }[];
      const itadId = rows[0]?.itad_id;
      if (itadId) {
        // ITAD rejects millisecond precision — use whole-second ISO (…00Z).
        const since = new Date(Date.now() - 730 * 86_400_000).toISOString().replace(/\.\d{3}Z$/, "Z");
        const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`) as { rate: number }[];
        const fx = fxRows.length ? Number(fxRows[0].rate) : 1;
        const points = await itadHistory(itadId, key, since, fx);
        if (points.length >= 2) {
          return NextResponse.json(toPayload(points), {
            headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
          });
        }
      }
    } catch {
      /* fall through to DB */
    }
  }

  // 2) Fallback: our recorded daily snapshots.
  if (!hasDb()) return NextResponse.json(EMPTY satisfies HistoryPayload);
  try {
    const rows = (await sql!`
      SELECT store, day, try_amount FROM price_history WHERE slug = ${slug} ORDER BY day ASC`) as {
      store: string;
      day: string;
      try_amount: unknown;
    }[];
    const byStore: HistoryPayload["byStore"] = {};
    const days = new Set<string>();
    for (const r of rows) {
      const date = String(r.day).slice(0, 10);
      days.add(date);
      (byStore[r.store] ??= []).push({ date, amount: Number(r.try_amount) });
    }
    return NextResponse.json({ byStore, days: days.size } satisfies HistoryPayload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" },
    });
  } catch {
    return NextResponse.json(EMPTY satisfies HistoryPayload);
  }
}
