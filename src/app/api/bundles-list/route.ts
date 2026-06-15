import { NextResponse } from "next/server";
import { itadBundleList, type ItadActiveBundle } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export interface BundleListPayload {
  bundles: ItadActiveBundle[];
}

/** All currently-active store bundles (ITAD), TR. */
export async function GET() {
  const key = process.env.ITAD_API_KEY;
  if (!key) return NextResponse.json({ bundles: [] } satisfies BundleListPayload);
  const bundles = await itadBundleList(key);
  return NextResponse.json(
    { bundles } satisfies BundleListPayload,
    { headers: { "Cache-Control": "public, s-maxage=10800, stale-while-revalidate=43200" } },
  );
}
