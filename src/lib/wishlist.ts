import { sql } from "@/lib/db";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

export type ParsedSteamInput =
  | { kind: "id"; id: string }
  | { kind: "vanity"; vanity: string }
  | { kind: "invalid" };

/** Pure parse of a user-pasted Steam reference. No network. */
export function parseSteamInput(input: string): ParsedSteamInput {
  const s = (input ?? "").trim();
  if (!s) return { kind: "invalid" };
  if (/^\d{17}$/.test(s)) return { kind: "id", id: s };
  const prof = s.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (prof) return { kind: "id", id: prof[1] };
  const vanityUrl = s.match(/steamcommunity\.com\/id\/([^/?#]+)/);
  if (vanityUrl) return { kind: "vanity", vanity: vanityUrl[1] };
  if (/^[\w.-]{2,64}$/.test(s)) return { kind: "vanity", vanity: s };
  return { kind: "invalid" };
}

/** Resolve any pasted reference to a SteamID64 (keyless). null = unresolvable. */
export async function resolveSteamId(input: string): Promise<string | null> {
  const p = parseSteamInput(input);
  if (p.kind === "id") return p.id;
  if (p.kind === "invalid") return null;
  try {
    const res = await fetch(`https://steamcommunity.com/id/${encodeURIComponent(p.vanity)}/?xml=1`, {
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

export async function fetchWishlistAppids(steamid: string): Promise<string[] | null> {
  try {
    const res = await fetch(
      `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?steamid=${steamid}`,
      { headers: { "User-Agent": UA, Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const d = (await res.json()) as { response?: { items?: { appid: number }[] } };
    const items = d.response?.items ?? [];
    return items.map((i) => String(i.appid));
  } catch {
    return null;
  }
}

export interface WishlistItem {
  slug: string;
  title: string;
  cover: string;
  year: number;
  appid: string;
  priceTRY: number | null;
  discount: number | null;
  store: string | null;
  isFree?: boolean;
}

export interface WishlistSummary {
  matched: number;
  onSale: number;
  untracked: number;
  cheapestCartTRY: number;
}

export function summarize(items: WishlistItem[], totalWishlist: number): WishlistSummary {
  const onSale = items.filter((i) => (i.discount ?? 0) > 0).length;
  const cart = items.reduce((sum, i) => sum + (i.priceTRY ?? 0), 0);
  return {
    matched: items.length,
    onSale,
    untracked: Math.max(0, totalWishlist - items.length),
    cheapestCartTRY: Math.round(cart * 100) / 100,
  };
}

/** One kuruş below today's best price → the alert fires on the NEXT real drop, not now. */
export function bulkAlarmTarget(bestTRY: number): number {
  return Math.round((bestTRY - 0.01) * 100) / 100;
}

export type WishlistSort = "discount" | "priceAsc" | "priceDesc" | "name" | "savings";

export function sortItems(sort: WishlistSort) {
  return (a: WishlistItem, b: WishlistItem): number => {
    switch (sort) {
      case "priceAsc":
        return (a.priceTRY ?? Infinity) - (b.priceTRY ?? Infinity);
      case "priceDesc":
        return (b.priceTRY ?? -Infinity) - (a.priceTRY ?? -Infinity);
      case "name":
        return a.title.localeCompare(b.title);
      case "savings": {
        const saved = (i: WishlistItem) =>
          i.priceTRY && i.discount ? i.priceTRY / (1 - i.discount / 100) - i.priceTRY : 0;
        return saved(b) - saved(a);
      }
      case "discount":
      default:
        return (b.discount ?? 0) - (a.discount ?? 0);
    }
  };
}

export function filterItems(
  items: WishlistItem[],
  opts: { onlyDiscount?: boolean; store?: string | null },
): WishlistItem[] {
  return items.filter((i) => {
    if (opts.onlyDiscount && !(i.discount && i.discount > 0)) return false;
    if (opts.store && i.store !== opts.store) return false;
    return true;
  });
}

interface DealRow {
  slug: string;
  title: string;
  cover: string;
  year: number;
  appid: string;
  free: boolean;
  try_amount: string | number | null;
  store: string | null;
  discount_percent: number | null;
}

export function rowToItem(r: DealRow): WishlistItem {
  const price = r.try_amount == null ? null : Math.round(Number(r.try_amount) * 100) / 100;
  const disc =
    r.discount_percent == null || Number(r.discount_percent) === 0 ? null : Number(r.discount_percent);
  return {
    slug: r.slug,
    title: r.title,
    cover: r.cover,
    year: Number(r.year),
    appid: r.appid,
    priceTRY: price,
    discount: disc,
    store: r.store,
    ...(r.free ? { isFree: true } : {}),
  };
}

/** One SQL: catalog rows whose appid is in the wishlist + cheapest live TR price/store/discount. */
export async function wishlistDeals(appids: string[]): Promise<WishlistItem[]> {
  if (!sql || appids.length === 0) return [];
  const fxRows = (await sql`SELECT rate FROM fx_rate WHERE base='USD_TRY' LIMIT 1`) as { rate: number }[];
  const fx = fxRows.length ? Number(fxRows[0].rate) : 1;
  const text = `
    SELECT c.slug, c.title, c.cover, c.year, c.appid, c.free,
           best.try_amount, best.store, best.discount_percent
    FROM catalog c
    LEFT JOIN LATERAL (
      SELECT store,
        (CASE WHEN currency='USD' THEN amount*$1 ELSE amount END) AS try_amount,
        discount_percent
      FROM game_prices gp WHERE gp.slug = c.slug
      ORDER BY (CASE WHEN currency='USD' THEN amount*$1 ELSE amount END) ASC NULLS LAST
      LIMIT 1
    ) best ON true
    WHERE c.appid = ANY($2::text[])`;
  const rows = (await sql.query(text, [fx, appids])) as DealRow[];
  return rows.map(rowToItem).sort(sortItems("discount"));
}
