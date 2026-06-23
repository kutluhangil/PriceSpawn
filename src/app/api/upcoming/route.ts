import { NextResponse } from "next/server";
import { steamUpcoming, type SteamUpcoming } from "@/lib/fetchers";

export const dynamic = "force-dynamic";

export interface UpcomingPayload {
  items: SteamUpcoming[];
}

/** Steam'in popüler yaklaşan çıkışları (gerçek tarih + ön sipariş fiyatı). */
export async function GET() {
  const items = await steamUpcoming(24);
  return NextResponse.json(
    { items } satisfies UpcomingPayload,
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } },
  );
}
