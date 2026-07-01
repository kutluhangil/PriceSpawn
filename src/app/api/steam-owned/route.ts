import { NextResponse } from "next/server";
import { resolveSteamId } from "@/lib/wishlist";
import { fetchOwned, ownedSlugs, fetchPlayerSummary, type SteamProfile } from "@/lib/owned";

export const dynamic = "force-dynamic";

export interface OwnedImportPayload {
  ok: boolean;
  steamid?: string;
  total?: number; // owned games on Steam
  slugs?: string[]; // matched to our catalog
  totalMinutes?: number; // summed playtime across the library
  profile?: SteamProfile; // persona name + avatar
  reason?: "bad_input" | "not_found" | "no_key" | "empty_or_private";
}

/** Resolve a Steam reference and return catalog slugs the user owns. */
export async function GET(req: Request): Promise<NextResponse<OwnedImportPayload>> {
  const input = new URL(req.url).searchParams.get("input");
  if (!input) return NextResponse.json({ ok: false, reason: "bad_input" }, { status: 400 });

  const steamid = await resolveSteamId(input);
  if (!steamid) return NextResponse.json({ ok: false, reason: "not_found" });

  const [owned, profile] = await Promise.all([fetchOwned(steamid), fetchPlayerSummary(steamid)]);
  if (owned === null) return NextResponse.json({ ok: false, steamid, reason: "no_key" });
  if (owned.appids.length === 0) {
    return NextResponse.json({ ok: false, steamid, reason: "empty_or_private" });
  }

  const slugs = await ownedSlugs(owned.appids);
  return NextResponse.json({
    ok: true,
    steamid,
    total: owned.appids.length,
    slugs,
    totalMinutes: owned.totalMinutes,
    ...(profile ? { profile } : {}),
  });
}
