import { NextResponse } from "next/server";
import { itadMostWaitlisted, type ItadRankItem } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export interface AnticipatedPayload {
  items: ItadRankItem[];
}

/** Most-waitlisted games (anticipated) from ITAD. */
export async function GET() {
  const key = process.env.ITAD_API_KEY;
  if (!key) return NextResponse.json({ items: [] } satisfies AnticipatedPayload);
  const items = await itadMostWaitlisted(key);
  return NextResponse.json(
    { items } satisfies AnticipatedPayload,
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}
