import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { itadDeals, type ItadDealItem } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export interface DealsPayload {
  deals: ItadDealItem[];
}

/** Live deals feed across all stores (ITAD), TR, biggest discounts first. */
export async function GET() {
  const key = process.env.ITAD_API_KEY;
  if (!key) return NextResponse.json({ deals: [] } satisfies DealsPayload);

  let fx = 1;
  if (hasDb()) {
    try {
      const rows = (await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`) as { rate: number }[];
      if (rows.length) fx = Number(rows[0].rate);
    } catch {
      /* default fx */
    }
  }

  const deals = await itadDeals(key, fx);
  return NextResponse.json(
    { deals } satisfies DealsPayload,
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=7200" } },
  );
}
