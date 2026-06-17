import { sql, hasDb } from "@/lib/db";
import type { Game, Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

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
