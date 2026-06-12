import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface LivePayload {
  fx: number | null;
  prices: Record<string, Record<string, {
    amount: number;
    currency: string;
    originalAmount: number | null;
    discountPercent: number | null;
  }>>;
  updatedAt: string | null;
}

export async function GET() {
  if (!hasDb()) {
    return NextResponse.json({ fx: null, prices: {}, updatedAt: null } satisfies LivePayload);
  }
  try {
    const fxRows = await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`;
    const rows = await sql!`
      SELECT slug, store, amount, currency, original_amount, discount_percent, updated_at
      FROM game_prices`;

    const prices: LivePayload["prices"] = {};
    let latest: string | null = null;
    for (const r of rows as Record<string, unknown>[]) {
      const slug = r.slug as string;
      const store = r.store as string;
      (prices[slug] ??= {})[store] = {
        amount: Number(r.amount),
        currency: r.currency as string,
        originalAmount: r.original_amount === null ? null : Number(r.original_amount),
        discountPercent: r.discount_percent === null ? null : Number(r.discount_percent),
      };
      const u = String(r.updated_at);
      if (!latest || u > latest) latest = u;
    }

    const fx = fxRows.length ? Number((fxRows[0] as { rate: unknown }).rate) : null;
    const payload: LivePayload = { fx, prices, updatedAt: latest };
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ fx: null, prices: {}, updatedAt: null } satisfies LivePayload);
  }
}
