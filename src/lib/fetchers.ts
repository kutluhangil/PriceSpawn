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
