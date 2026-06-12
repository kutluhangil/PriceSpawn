// Live data fetchers. Keyless public endpoints; structured for later expansion
// to Epic/GOG/Xbox (see docs/LIVE_API_INTEGRATION.md).

export interface SteamPrice {
  amount: number; // USD (Steam returns USD from non-TR egress; app converts to TL)
  currency: "USD";
  originalAmount?: number;
  discountPercent?: number;
}

/** Steam store price for an appid. Returns null if free / unavailable. */
export async function fetchSteamPrice(appid: string): Promise<SteamPrice | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=tr&l=english&filters=price_overview`;
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    if (!res.ok) return null;
    const data = await res.json();
    const po = data?.[appid]?.data?.price_overview;
    if (!po || typeof po.final !== "number") return null;
    const amount = po.final / 100;
    const original = po.initial / 100;
    const disc = po.discount_percent || 0;
    return {
      amount,
      currency: "USD",
      originalAmount: disc > 0 ? original : undefined,
      discountPercent: disc > 0 ? disc : undefined,
    };
  } catch {
    return null;
  }
}

/** Live USD→TRY rate; null on failure (caller keeps the demo rate). */
export async function fetchUsdTry(): Promise<number | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.TRY;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

// ── IsThereAnyDeal: real Türkiye prices across PC stores ────────────
const ITAD = "https://api.isthereanydeal.com";

// ITAD shop id → our StoreId (PC stores ITAD covers for TR).
export const ITAD_SHOP_TO_STORE: Record<number, string> = {
  61: "steam",
  16: "epic",
  35: "gog",
  37: "humble",
  62: "ubisoft",
  48: "xbox", // Microsoft Store
};

/** Look up the ITAD game id for a Steam appid. "" when not found. */
export async function itadLookup(appid: string, key: string): Promise<string> {
  try {
    const res = await fetch(`${ITAD}/games/lookup/v1?key=${key}&appid=${appid}`);
    if (!res.ok) return "";
    const data = await res.json();
    return data?.found ? (data.game.id as string) : "";
  } catch {
    return "";
  }
}

export interface ItadDeal {
  store: string;
  amount: number; // TRY
  cut: number; // discount %
}

/** Current TR prices for a batch of ITAD ids, mapped to our stores. */
export async function itadPrices(
  ids: string[],
  key: string
): Promise<Record<string, ItadDeal[]>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(`${ITAD}/games/prices/v3?key=${key}&country=TR&capacity=8`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{
      id: string;
      deals: Array<{ shop: { id: number }; price: { amount: number }; cut: number }>;
    }>;
    const out: Record<string, ItadDeal[]> = {};
    for (const g of data) {
      const deals: ItadDeal[] = [];
      for (const d of g.deals) {
        const store = ITAD_SHOP_TO_STORE[d.shop.id];
        if (store) deals.push({ store, amount: d.price.amount, cut: d.cut || 0 });
      }
      if (deals.length) out[g.id] = deals;
    }
    return out;
  } catch {
    return {};
  }
}

/** Limit concurrency so a full refresh stays within the function timeout. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
