import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface BrowseItem {
  slug: string;
  title: string;
  cover: string;
  year: number;
  priceTRY: number | null;
  discount: number | null;
  isFree?: boolean;
}

export interface BrowsePayload {
  items: BrowseItem[];
  total: number;
  page: number;
  pageCount: number;
}

const SORTS: Record<string, string> = {
  discount: "pr.max_disc DESC NULLS LAST, c.score DESC",
  priceAsc: "pr.min_try ASC NULLS LAST",
  priceDesc: "pr.min_try DESC NULLS LAST",
  score: "c.score DESC, c.year DESC",
  year: "c.year DESC, c.score DESC",
  name: "c.title ASC",
};

/**
 * Server-side paginated browse over the FULL DB catalog (so /oyunlar reflects the
 * whole catalog, not just the bundled GAMES, and never renders thousands of
 * cards at once). Supports genre/store/sub/discount/price filters + sort.
 */
export async function GET(req: Request) {
  if (!hasDb()) return NextResponse.json({ items: [], total: 0, page: 1, pageCount: 0 } satisfies BrowsePayload);
  const u = new URL(req.url);
  const page = Math.max(1, Number(u.searchParams.get("page")) || 1);
  const limit = Math.min(48, Math.max(1, Number(u.searchParams.get("limit")) || 16));
  const off = (page - 1) * limit;
  const genres = (u.searchParams.get("g") ?? "").split(",").filter(Boolean);
  const stores = (u.searchParams.get("s") ?? "").split(",").filter(Boolean);
  const subs = (u.searchParams.get("sub") ?? "").split(",").filter(Boolean);
  const disc = u.searchParams.get("disc") === "1";
  const atLow = u.searchParams.get("atl") === "1";
  const min = u.searchParams.get("min");
  const max = u.searchParams.get("max");
  const sort = SORTS[u.searchParams.get("sort") ?? "discount"] ?? SORTS.discount;

  try {
    const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base='USD_TRY' LIMIT 1`) as { rate: number }[];
    const fx = fxRows.length ? Number(fxRows[0].rate) : 1;

    const where: string[] = ["1=1"];
    const p: unknown[] = [fx]; // $1 = fx
    let i = 2;
    if (genres.length) { where.push(`c.genres ?| $${i}::text[]`); p.push(genres); i++; }
    if (stores.length) { where.push(`EXISTS(SELECT 1 FROM game_prices gp WHERE gp.slug=c.slug AND gp.store = ANY($${i}))`); p.push(stores); i++; }
    if (subs.length) { where.push(`EXISTS(SELECT 1 FROM game_subs gs WHERE gs.slug=c.slug AND gs.sub_id = ANY($${i}))`); p.push(subs); i++; }
    if (disc) where.push(`pr.max_disc > 0`);
    // Only games currently at (or within 5% of) their all-time-low.
    if (atLow) where.push(`pr.min_try IS NOT NULL AND atl.amount IS NOT NULL AND pr.min_try <= atl.amount * 1.05`);
    if (min !== null && min !== "" && !Number.isNaN(Number(min))) { where.push(`pr.min_try >= $${i}`); p.push(Number(min)); i++; }
    if (max !== null && max !== "" && !Number.isNaN(Number(max))) { where.push(`pr.min_try <= $${i}`); p.push(Number(max)); i++; }

    const limIdx = i; const offIdx = i + 1;
    p.push(limit, off);

    const text = `
      WITH pr AS (
        SELECT slug,
          MIN(CASE WHEN currency='USD' THEN amount*$1 ELSE amount END) AS min_try,
          MAX(COALESCE(discount_percent,0)) AS max_disc
        FROM game_prices GROUP BY slug
      )
      SELECT c.slug, c.title, c.cover, c.year, c.free,
             pr.min_try, pr.max_disc, COUNT(*) OVER()::int AS total
      FROM catalog c
      LEFT JOIN pr ON pr.slug = c.slug
      LEFT JOIN all_time_low atl ON atl.slug = c.slug
      WHERE ${where.join(" AND ")}
      ORDER BY ${sort}
      LIMIT $${limIdx} OFFSET $${offIdx}`;

    const rows = (await sql!.query(text, p)) as Array<{
      slug: string; title: string; cover: string; year: number; free: boolean;
      min_try: string | number | null; max_disc: string | number | null; total: number;
    }>;

    const total = rows.length ? Number(rows[0].total) : 0;
    const items: BrowseItem[] = rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      cover: r.cover,
      year: Number(r.year),
      priceTRY: r.min_try == null ? null : Math.round(Number(r.min_try) * 100) / 100,
      discount: r.max_disc == null || Number(r.max_disc) === 0 ? null : Number(r.max_disc),
      ...(r.free ? { isFree: true } : {}),
    }));

    return NextResponse.json(
      { items, total, page, pageCount: Math.ceil(total / limit) } satisfies BrowsePayload,
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } },
    );
  } catch {
    return NextResponse.json({ items: [], total: 0, page: 1, pageCount: 0 } satisfies BrowsePayload);
  }
}
