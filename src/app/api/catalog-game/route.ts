import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";
import type { Game, Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export interface CatalogGamePayload {
  found: boolean;
  game?: Game;
}

/** Full game (catalog + live prices + subs) for a slug — for DB-only games not in GAMES. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug || !hasDb()) return NextResponse.json({ found: false } satisfies CatalogGamePayload);

  try {
    const rows = (await sql!`
      SELECT slug, appid, title, cover, genres, score, year, unreleased FROM catalog WHERE slug = ${slug}`) as {
      slug: string;
      appid: string;
      title: string;
      cover: string;
      genres: string[];
      score: number;
      year: number;
      unreleased: boolean;
    }[];
    if (rows.length === 0) return NextResponse.json({ found: false } satisfies CatalogGamePayload);
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

    const game: Game = {
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
    };
    return NextResponse.json({ found: true, game } satisfies CatalogGamePayload);
  } catch {
    return NextResponse.json({ found: false } satisfies CatalogGamePayload);
  }
}
