import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface HistoryPayload {
  byStore: Record<string, { date: string; amount: number }[]>;
  days: number;
}

/** Real recorded price snapshots for one game, grouped by store. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !hasDb()) return NextResponse.json({ byStore: {}, days: 0 } satisfies HistoryPayload);
  try {
    const rows = (await sql!`
      SELECT store, day, try_amount
      FROM price_history
      WHERE slug = ${slug}
      ORDER BY day ASC`) as { store: string; day: string; try_amount: unknown }[];
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
    return NextResponse.json({ byStore: {}, days: 0 } satisfies HistoryPayload);
  }
}
