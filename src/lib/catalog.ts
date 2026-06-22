import { sql, hasDb } from "@/lib/db";
import type { Game, Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";
import type { BrowseItem } from "@/app/api/catalog-browse/route";

/** A single game from the DB catalog (catalog + live prices + subs), or null. */
export async function catalogGameBySlug(slug: string): Promise<Game | null> {
  if (!hasDb()) return null;
  try {
    const rows = (await sql!`
      SELECT slug, appid, title, cover, genres, score, year, unreleased, free FROM catalog WHERE slug = ${slug}`) as {
      slug: string;
      appid: string;
      title: string;
      cover: string;
      genres: string[];
      score: number;
      year: number;
      unreleased: boolean;
      free: boolean;
    }[];
    if (rows.length === 0) return null;
    const c = rows[0];

    const priceRows = (await sql!`
      SELECT store, amount, currency, original_amount, discount_percent, url
      FROM game_prices WHERE slug = ${slug}`) as {
      store: string;
      amount: number;
      currency: string;
      original_amount: number | null;
      discount_percent: number | null;
      url: string | null;
    }[];
    const prices: Price[] = priceRows.map((r) => ({
      store: r.store as StoreId,
      amount: Number(r.amount),
      currency: r.currency === "USD" ? "USD" : "TRY",
      ...(r.original_amount != null ? { originalAmount: Number(r.original_amount) } : {}),
      ...(r.discount_percent != null ? { discountPercent: Number(r.discount_percent) } : {}),
      ...(r.url ? { url: r.url } : {}),
    }));

    const subRows = (await sql!`SELECT sub_id FROM game_subs WHERE slug = ${slug}`) as { sub_id: string }[];

    return {
      id: c.appid || c.slug,
      slug: c.slug,
      title: c.title,
      coverUrl: c.cover,
      genres: Array.isArray(c.genres) ? c.genres : [],
      score: Number(c.score),
      releaseYear: Number(c.year),
      prices,
      subscriptions: subRows.map((s) => s.sub_id as SubscriptionId),
      ...(c.unreleased ? { unreleased: true } : {}),
      ...(c.free ? { isFree: true } : {}),
    };
  } catch {
    return null;
  }
}

/** Lightweight catalog metadata for a slug (no prices) — for sitemap/metadata/OG. */
export async function catalogMetaBySlug(
  slug: string,
): Promise<{ slug: string; title: string; cover: string; genres: string[]; year: number } | null> {
  if (!hasDb()) return null;
  try {
    const rows = (await sql!`SELECT slug, title, cover, genres, year FROM catalog WHERE slug = ${slug}`) as {
      slug: string;
      title: string;
      cover: string;
      genres: string[];
      year: number;
    }[];
    if (rows.length === 0) return null;
    const r = rows[0];
    return { slug: r.slug, title: r.title, cover: r.cover, genres: Array.isArray(r.genres) ? r.genres : [], year: Number(r.year) };
  } catch {
    return null;
  }
}

/** Distinct catalog games priced per store (for the Platformlar tiles). */
export async function catalogStoreCounts(): Promise<Record<string, number>> {
  if (!hasDb()) return {};
  try {
    const rows = (await sql!`
      SELECT store, COUNT(DISTINCT slug)::int AS n
      FROM game_prices WHERE slug IN (SELECT slug FROM catalog)
      GROUP BY store`) as { store: string; n: number }[];
    const out: Record<string, number> = {};
    for (const r of rows) out[r.store] = Number(r.n);
    return out;
  } catch {
    return {};
  }
}

/** Total games in the catalog (for the home stat bar). 0 if DB unavailable. */
export async function catalogCount(): Promise<number> {
  if (!hasDb()) return 0;
  try {
    const rows = (await sql!`SELECT COUNT(*)::int AS c FROM catalog`) as { c: number }[];
    return rows[0]?.c ?? 0;
  } catch {
    return 0;
  }
}

/** All catalog slugs (for the sitemap). */
export async function catalogSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  if (!hasDb()) return [];
  try {
    const rows = (await sql!`SELECT slug, updated_at FROM catalog`) as { slug: string; updated_at: string }[];
    return rows.map((r) => ({ slug: r.slug, updatedAt: new Date(r.updated_at) }));
  } catch {
    return [];
  }
}

/** Games in a genre (by exact stored label), best discounts first, + total count. */
export async function catalogByGenre(label: string, limit = 36): Promise<{ items: BrowseItem[]; total: number }> {
  if (!hasDb()) return { items: [], total: 0 };
  try {
    const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base='USD_TRY' LIMIT 1`) as { rate: number }[];
    const fx = fxRows.length ? Number(fxRows[0].rate) : 1;
    const rows = (await sql!`
      WITH pr AS (
        SELECT slug,
          MIN(CASE WHEN currency='USD' THEN amount*${fx} ELSE amount END) AS min_try,
          MAX(COALESCE(discount_percent,0)) AS max_disc
        FROM game_prices GROUP BY slug
      )
      SELECT c.slug, c.title, c.cover, c.year, c.free,
             pr.min_try, pr.max_disc, COUNT(*) OVER()::int AS total
      FROM catalog c
      LEFT JOIN pr ON pr.slug = c.slug
      WHERE EXISTS (SELECT 1 FROM jsonb_array_elements_text(c.genres) g WHERE g = ${label})
      ORDER BY pr.max_disc DESC NULLS LAST, c.score DESC
      LIMIT ${limit}`) as Array<{
        slug: string; title: string; cover: string; year: number; free: boolean;
        min_try: string | number | null; max_disc: string | number | null; total: number;
      }>;
    const total = rows.length ? Number(rows[0].total) : 0;
    const items: BrowseItem[] = rows.map((r) => ({
      slug: r.slug, title: r.title, cover: r.cover, year: Number(r.year),
      priceTRY: r.min_try == null ? null : Math.round(Number(r.min_try) * 100) / 100,
      discount: r.max_disc == null || Number(r.max_disc) === 0 ? null : Number(r.max_disc),
      ...(r.free ? { isFree: true } : {}),
    }));
    return { items, total };
  } catch {
    return { items: [], total: 0 };
  }
}
