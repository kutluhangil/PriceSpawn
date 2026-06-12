import { NextResponse } from "next/server";
import { fetchEpicFree } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export async function GET() {
  const offers = await fetchEpicFree();
  return NextResponse.json(
    { offers, at: new Date().toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" } }
  );
}
