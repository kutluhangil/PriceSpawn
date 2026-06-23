import { NextResponse } from "next/server";
import { resolveSteamId, fetchWishlistAppids } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export interface WishlistResolvePayload {
  ok: boolean;
  steamid?: string;
  total?: number;
  reason?: "bad_input" | "not_found" | "empty_or_private";
}

/** Resolve a pasted Steam reference and confirm the wishlist is reachable.
 *  The heavy DB price join runs server-side on /liste, not here. */
export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("input");
  if (!input) {
    return NextResponse.json({ ok: false, reason: "bad_input" } satisfies WishlistResolvePayload, { status: 400 });
  }
  const steamid = await resolveSteamId(input);
  if (!steamid) {
    return NextResponse.json({ ok: false, reason: "not_found" } satisfies WishlistResolvePayload);
  }
  const appids = await fetchWishlistAppids(steamid);
  if (!appids || appids.length === 0) {
    return NextResponse.json({ ok: false, reason: "empty_or_private" } satisfies WishlistResolvePayload);
  }
  return NextResponse.json({ ok: true, steamid, total: appids.length } satisfies WishlistResolvePayload);
}
