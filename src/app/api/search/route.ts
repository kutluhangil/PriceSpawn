import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import { normalizeTR } from "@/lib/search";

export const dynamic = "force-dynamic";

export interface SearchResult {
  slug: string;
  title: string;
  cover: string;
  year: number;
  priceTRY: number | null;
}

export interface SearchPayload {
  results: SearchResult[];
}

/** Server-side catalog search (unlimited DB catalog), with cheapest live TRY price. */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("q") ?? "";
  const limit = Math.min(12, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 8));
  const q = normalizeTR(raw);
  if (!q || !hasDb()) return NextResponse.json({ results: [] } satisfies SearchPayload);

  try {
    const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`) as { rate: number }[];
    const fx = fxRows.length ? Number(fxRows[0].rate) : 1;
    const like = `%${q}%`;
    const pre = `${q}%`;
    const word = `% ${q}%`;
    const rows = (await sql!`
      SELECT c.slug, c.title, c.cover, c.year,
        (SELECT MIN(CASE WHEN gp.currency = 'USD' THEN gp.amount * ${fx} ELSE gp.amount END)
           FROM game_prices gp WHERE gp.slug = c.slug) AS min_try
      FROM catalog c
      WHERE c.norm LIKE ${like}
      ORDER BY (CASE WHEN c.norm LIKE ${pre} THEN 3 WHEN c.norm LIKE ${word} THEN 2 ELSE 1 END) DESC,
               c.score DESC
      LIMIT ${limit}`) as { slug: string; title: string; cover: string; year: number; min_try: unknown }[];

    const results: SearchResult[] = rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      cover: r.cover,
      year: Number(r.year),
      priceTRY: r.min_try == null ? null : Math.round(Number(r.min_try) * 100) / 100,
    }));
    return NextResponse.json({ results } satisfies SearchPayload, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ results: [] } satisfies SearchPayload);
  }
}
