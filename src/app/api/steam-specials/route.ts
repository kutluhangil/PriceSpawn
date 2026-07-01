import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export interface SteamSpecial {
  appid: string;
  name: string;
  discountPercent: number;
  finalTRY: number; // final price in ₺
  originalTRY: number;
  image: string; // capsule/header art
}

export interface SpecialsPayload {
  items: SteamSpecial[];
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Steam's own front-page "Specials" list (free, keyless). Prices are TR kuruş. */
export async function GET(): Promise<NextResponse<SpecialsPayload>> {
  try {
    const res = await fetch(
      "https://store.steampowered.com/api/featuredcategories?cc=tr&l=turkish",
      { headers: { "User-Agent": UA, Accept: "application/json" } }
    );
    if (!res.ok) return NextResponse.json({ items: [] });
    const d = await res.json();
    const raw = (d?.specials?.items ?? []) as any[];
    const items: SteamSpecial[] = raw
      .filter((it) => it?.discounted && it?.discount_percent > 0)
      .slice(0, 14)
      .map((it) => ({
        appid: String(it.id),
        name: String(it.name ?? ""),
        discountPercent: Number(it.discount_percent) || 0,
        finalTRY: (Number(it.final_price) || 0) / 100,
        originalTRY: (Number(it.original_price) || 0) / 100,
        image: String(it.large_capsule_image ?? it.header_image ?? it.small_capsule_image ?? ""),
      }))
      .filter((it) => it.appid && it.name && it.finalTRY > 0);

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" } }
    );
  } catch {
    return NextResponse.json({ items: [] });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
