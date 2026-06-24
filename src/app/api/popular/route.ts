import { NextResponse } from "next/server";
import { itadMostWaitlisted, itadMostPopular, type ItadRankItem } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export interface PopularPayload {
  waitlisted: ItadRankItem[];
  popular: ItadRankItem[];
}

/** Popularity leaderboards from ITAD: most-waitlisted + most-popular. */
export async function GET() {
  const key = process.env.ITAD_API_KEY;
  if (!key) return NextResponse.json({ waitlisted: [], popular: [] } satisfies PopularPayload);
  const [waitlisted, popular] = await Promise.all([
    itadMostWaitlisted(key, 40),
    itadMostPopular(key, 40),
  ]);
  return NextResponse.json(
    { waitlisted, popular } satisfies PopularPayload,
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}
