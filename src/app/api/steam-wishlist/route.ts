import { NextResponse } from "next/server";
import { GAMES } from "@/data/games";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export interface SteamWishlistPayload {
  ok: boolean;
  total: number; // wishlist size
  matched: { slug: string; title: string }[]; // games we track
  reason?: "bad_input" | "not_found" | "empty_or_private";
}

function fail(reason: SteamWishlistPayload["reason"], status = 200) {
  return NextResponse.json({ ok: false, total: 0, matched: [], reason } satisfies SteamWishlistPayload, { status });
}

/** Resolve a profile URL / SteamID64 / vanity to a SteamID64 (keyless). */
async function resolveSteamId(input: string): Promise<string | null> {
  const s = input.trim();
  if (/^\d{17}$/.test(s)) return s;
  const prof = s.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (prof) return prof[1];
  const vanityUrl = s.match(/steamcommunity\.com\/id\/([^/?#]+)/);
  const vanity = vanityUrl ? vanityUrl[1] : /^[\w.-]{2,64}$/.test(s) ? s : null;
  if (!vanity) return null;
  try {
    const res = await fetch(`https://steamcommunity.com/id/${encodeURIComponent(vanity)}/?xml=1`, {
      headers: { "User-Agent": UA },
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const m = xml.match(/<steamID64>(\d{17})<\/steamID64>/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("input");
  if (!input) return fail("bad_input", 400);

  const steamid = await resolveSteamId(input);
  if (!steamid) return fail("not_found");

  let appids: string[] = [];
  try {
    const res = await fetch(`https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${steamid}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) return fail("empty_or_private");
    const d = (await res.json()) as { response?: { items?: { appid: number }[] } };
    appids = (d.response?.items ?? []).map((i) => String(i.appid));
  } catch {
    return fail("empty_or_private");
  }

  if (appids.length === 0) return fail("empty_or_private");

  const appSet = new Set(appids);
  const matched = GAMES.filter((g) => appSet.has(g.id)).map((g) => ({ slug: g.slug, title: g.title }));

  return NextResponse.json({ ok: true, total: appids.length, matched } satisfies SteamWishlistPayload);
}
