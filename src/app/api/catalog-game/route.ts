import { NextResponse } from "next/server";
import type { Game } from "@/data/games";
import { catalogGameBySlug } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export interface CatalogGamePayload {
  found: boolean;
  game?: Game;
}

/** Full game (catalog + live prices + subs) for a slug — for DB-only games not in GAMES. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ found: false } satisfies CatalogGamePayload);
  const game = await catalogGameBySlug(slug);
  return NextResponse.json(
    (game ? { found: true, game } : { found: false }) satisfies CatalogGamePayload,
  );
}
