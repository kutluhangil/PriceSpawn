// Live data fetchers. Keyless public endpoints; structured for later expansion
// to Epic/GOG/Xbox (see docs/LIVE_API_INTEGRATION.md).

/**
 * ITAD bundle/deal links are affiliate redirects (awin1.com, *.sjv.io, etc).
 * Ad-blockers and tracking-protection kill those tabs the instant they open
 * ("opens then closes"). The true store URL is carried in a query param
 * (u / ued / url / murl / p), so unwrap it and link straight to the store.
 */
export function unwrapAffiliate(raw: string): string {
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    for (const k of ["u", "ued", "url", "murl", "p", "r"]) {
      const v = u.searchParams.get(k);
      if (v && /^https?:\/\//i.test(v)) return v;
    }
  } catch {
    /* not a URL — leave as is */
  }
  return raw;
}

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

// ── Epic free games (Türkiye) — keyless public promotions endpoint ──
export interface EpicFree {
  title: string;
  image: string;
  originalTRY: number;
  freeUntil: string; // ISO end date
  url: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function fetchEpicFree(): Promise<EpicFree[]> {
  try {
    const res = await fetch(
      "https://store-site-backend-static-ipv4.ak.epicgames.com/freeGamesPromotions?locale=tr-TR&country=TR&allowCountries=TR"
    );
    if (!res.ok) return [];
    const data = await res.json();
    const els: any[] = data?.data?.Catalog?.searchStore?.elements ?? [];
    const out: EpicFree[] = [];
    for (const e of els) {
      const total = e?.price?.totalPrice ?? {};
      if (total.discountPrice !== 0) continue; // not free right now
      const promos = e?.promotions?.promotionalOffers ?? [];
      let endDate = "";
      for (const p of promos) {
        for (const o of p?.promotionalOffers ?? []) {
          if (o?.discountSetting?.discountPercentage === 0) endDate = o.endDate ?? endDate;
        }
      }
      if (!endDate) continue;
      const imgs: any[] = e?.keyImages ?? [];
      const img =
        imgs.find((i) => i.type === "OfferImageWide")?.url ||
        imgs.find((i) => i.type === "DieselStoreFrontWide")?.url ||
        imgs.find((i) => i.type === "Thumbnail")?.url ||
        "";
      const slug =
        e?.catalogNs?.mappings?.[0]?.pageSlug ||
        e?.offerMappings?.[0]?.pageSlug ||
        e?.productSlug ||
        e?.urlSlug ||
        "";
      out.push({
        title: e.title,
        image: img,
        originalTRY: Math.round(((total.originalPrice ?? 0) / 100) * 100) / 100,
        freeUntil: endDate,
        url: slug ? `https://store.epicgames.com/tr/p/${slug}` : "https://store.epicgames.com/tr/free-games",
      });
    }
    return out;
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

export interface ItadHistoryPoint {
  day: string; // YYYY-MM-DD
  store: string; // our StoreId
  amount: number; // TRY
}

/**
 * Real recorded price history for one ITAD id (TR), mapped to our stores.
 * Some shops (Steam, GOG) report Turkey prices in USD — convert those to TRY
 * with `fx` so every point shares one currency.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function itadHistory(
  id: string,
  key: string,
  sinceISO: string,
  fx: number,
): Promise<ItadHistoryPoint[]> {
  try {
    const res = await fetch(
      `${ITAD}/games/history/v2?key=${key}&id=${id}&country=TR&since=${encodeURIComponent(sinceISO)}`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    const out: ItadHistoryPoint[] = [];
    for (const p of Array.isArray(data) ? data : []) {
      const store = ITAD_SHOP_TO_STORE[p?.shop?.id];
      const raw = p?.deal?.price?.amount;
      if (!store || typeof raw !== "number") continue;
      const tryAmount = p?.deal?.price?.currency === "USD" ? Math.round(raw * fx * 100) / 100 : raw;
      out.push({ day: String(p.timestamp).slice(0, 10), store, amount: tryAmount });
    }
    return out;
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

// ITAD subscription service id → our SubscriptionId. (PlayStation Plus is console-
// only and not tracked by ITAD; handled via a PS-specific source.)
export const ITAD_SUB_TO_ID: Record<number, string> = {
  1: "luna", // Prime Gaming (our Luna/Prime bucket)
  2: "eaplay",
  3: "eaplaypro",
  4: "ubisoftplus", // Ubisoft+ Premium
  5: "ubisoftplus", // Ubisoft+ Classics
  6: "gamepass",
};

/**
 * Real subscription membership for a batch of ITAD ids. Queries country=US so
 * all PC services surface (EA/Ubisoft/Prime only appear there); the catalogs
 * are global. Returns itad id → set of our SubscriptionIds.
 */
export async function itadSubs(ids: string[], key: string): Promise<Record<string, string[]>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(`${ITAD}/games/subs/v1?key=${key}&country=US`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{ id: string; subs: Array<{ id: number }> }>;
    const out: Record<string, string[]> = {};
    for (const g of data) {
      const set = new Set<string>();
      for (const s of g.subs ?? []) {
        const mapped = ITAD_SUB_TO_ID[s.id];
        if (mapped) set.add(mapped);
      }
      if (set.size) out[g.id] = [...set];
    }
    return out;
  } catch {
    return {};
  }
}

export interface ItadRankItem {
  id: string;
  slug: string;
  title: string;
  count: number;
}

/** Most-waitlisted games (anticipated), ranked. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function itadMostWaitlisted(key: string, limit = 16): Promise<ItadRankItem[]> {
  try {
    const res = await fetch(`${ITAD}/stats/most-waitlisted/v1?key=${key}&limit=${limit}&offset=0`);
    if (!res.ok) return [];
    const d = (await res.json()) as any;
    const list: any[] = Array.isArray(d) ? d : (d?.list ?? []);
    return list
      .filter((x) => x.type === "game" && x.slug && x.title)
      .map((x) => ({ id: String(x.id), slug: String(x.slug), title: String(x.title), count: Number(x.count ?? 0) }));
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ItadDealItem {
  id: string;
  title: string;
  cover: string; // landscape banner
  store: string | null; // our StoreId when mapped
  shopName: string;
  priceTRY: number;
  regularTRY: number;
  cut: number;
  url: string;
}

/** Live deals feed (TR), sorted by biggest cut. USD shop prices → TRY via fx. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function itadDeals(key: string, fx: number, limit = 48): Promise<ItadDealItem[]> {
  try {
    const res = await fetch(
      `${ITAD}/deals/v2?key=${key}&country=TR&limit=${limit}&sort=-cut&nondeals=false&mature=false`,
    );
    if (!res.ok) return [];
    const d = (await res.json()) as any;
    const list: any[] = d?.list ?? [];
    const toTRY = (p: any) => (p?.currency === "USD" ? Math.round((p.amount ?? 0) * fx * 100) / 100 : (p?.amount ?? 0));
    const out: ItadDealItem[] = [];
    for (const it of list) {
      const deal = it.deal;
      if (it.type !== "game" || !deal || !(deal.cut > 0)) continue;
      out.push({
        id: String(it.id),
        title: String(it.title ?? ""),
        cover: it.assets?.banner400 || it.assets?.banner300 || it.assets?.boxart || "",
        store: ITAD_SHOP_TO_STORE[deal.shop?.id] ?? null,
        shopName: String(deal.shop?.name ?? ""),
        priceTRY: toTRY(deal.price),
        regularTRY: toTRY(deal.regular),
        cut: Number(deal.cut),
        url: String(deal.url || `https://isthereanydeal.com/game/${it.slug}/info/`),
      });
    }
    return out;
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ItadActiveBundle {
  id: number;
  title: string;
  page: string; // provider, e.g. "Humble Bundle", "Fanatical"
  url: string;
  expiry: string | null;
  games: number;
}

/** All currently-active bundles (TR), newest first. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function itadBundleList(key: string, limit = 50): Promise<ItadActiveBundle[]> {
  try {
    const res = await fetch(`${ITAD}/bundles/v1?key=${key}&country=TR&limit=${limit}&sort=-publish`);
    if (!res.ok) return [];
    const d = (await res.json()) as any;
    const list: any[] = Array.isArray(d) ? d : (d?.list ?? []);
    const now = Date.now();
    return list
      .filter((b) => !b.expiry || Date.parse(b.expiry) > now)
      .map((b) => ({
        id: Number(b.id),
        title: String(b.title ?? ""),
        page: String(b.page?.name ?? ""),
        url: unwrapAffiliate(String(b.url ?? "")) || String(b.details ?? ""),
        expiry: b.expiry ?? null,
        games: Number(b.counts?.games ?? 0),
      }))
      .filter((b) => b.title && b.url);
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ItadBundle {
  title: string;
  page: string; // bundle provider, e.g. "Humble Bundle", "Fanatical"
  url: string;
  expiry: string | null; // ISO; null = ongoing
}

/** Currently-active bundles that include this ITAD game id (TR region). */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function itadBundles(id: string, key: string): Promise<ItadBundle[]> {
  try {
    const res = await fetch(`${ITAD}/games/bundles/v2?key=${key}&id=${id}&country=TR`);
    if (!res.ok) return [];
    const data = (await res.json()) as any[];
    const now = Date.now();
    return (Array.isArray(data) ? data : [])
      .filter((b) => !b.expiry || Date.parse(b.expiry) > now)
      .map((b) => ({
        title: String(b.title ?? ""),
        page: String(b.page?.name ?? ""),
        url: unwrapAffiliate(String(b.url ?? "")) || String(b.page?.url ?? ""),
        expiry: b.expiry ?? null,
      }))
      .filter((b) => b.title && b.url)
      .slice(0, 5);
  } catch {
    return [];
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface ItadDeal {
  store: string;
  amount: number; // TRY
  cut: number; // discount %
  url: string; // store product link (itad.link redirect)
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
      deals: Array<{ shop: { id: number }; price: { amount: number }; cut: number; url?: string }>;
    }>;
    const out: Record<string, ItadDeal[]> = {};
    for (const g of data) {
      const deals: ItadDeal[] = [];
      for (const d of g.deals) {
        const store = ITAD_SHOP_TO_STORE[d.shop.id];
        if (store) deals.push({ store, amount: d.price.amount, cut: d.cut || 0, url: d.url ?? "" });
      }
      if (deals.length) out[g.id] = deals;
    }
    return out;
  } catch {
    return {};
  }
}

// ── PlayStation Store (Türkiye) — scraped from the store's embedded JSON ──
const PS_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
const PS_BAD = [
  "dlc", "bundle", "season", "upgrade", "deluxe", "ultimate", "gold", "premium",
  "pack", "expansion", "edition", "soundtrack", "artbook", "points", "currency",
  "credits", "coins", "virtual", "wallet", "membership", "subscription", "trial",
  "demo", "companion", "theme", "avatar", "beta", "voucher", "cosmetic", "skin",
];

function psNorm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ıİ]/g, "i").replace(/[şŞ]/g, "s").replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g").replace(/[öÖ]/g, "o").replace(/[üÜ]/g, "u")
    .replace(/[®™’':]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function psPriceTL(s: string | undefined): number | null {
  if (!s || !/\d/.test(s)) return null;
  const cleaned = s.replace("TL", "").replace("₺", "").trim().replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function psNextData(html: string): Record<string, unknown> | null {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]) as { props?: { apolloState?: Record<string, unknown> } };
    return data?.props?.apolloState ?? null;
  } catch {
    return null;
  }
}

export interface PsPrice {
  productId: string;
  amount: number; // TRY
  cut: number; // discount %
}

/** Search PS Store TR by title; returns the best base-game match with TR price. */
export async function psSearch(title: string): Promise<PsPrice | null> {
  try {
    const url = `https://store.playstation.com/tr-tr/search/${encodeURIComponent(title)}`;
    const res = await fetch(url, { headers: { "User-Agent": PS_UA } });
    if (!res.ok) return null;
    const apollo = psNextData(await res.text());
    if (!apollo) return null;
    const nt = psNorm(title);
    let best: { score: number; price: PsPrice } | null = null;
    for (const v of Object.values(apollo)) {
      const node = v as { __typename?: string; name?: string; id?: string; price?: { basePrice?: string; discountedPrice?: string } };
      if (node.__typename !== "Product" || !node.name || !node.id) continue;
      const base = psPriceTL(node.price?.basePrice);
      if (base === null) continue;
      const disc = psPriceTL(node.price?.discountedPrice) ?? base;
      const nn = psNorm(node.name);
      // Strict: exact, or starts with the title and isn't much longer (base game,
      // not an add-on). Reject loose substring matches → avoids wrong products.
      let score = -1;
      if (nn === nt) score = 100;
      else if (nn.startsWith(nt) && nn.length <= nt.length + 14) score = 75;
      if (score < 0) continue;
      if (PS_BAD.some((b) => nn.includes(b))) continue; // drop add-ons entirely
      if (/0+$/.test(node.id)) score += 10;
      const cut = disc < base ? Math.round((1 - disc / base) * 100) : 0;
      if (!best || score > best.score) best = { score, price: { productId: node.id, amount: disc, cut } };
    }
    return best && best.score >= 75 ? best.price : null;
  } catch {
    return null;
  }
}

/** Fresh TR price for a known PS product id (from its product page). */
export async function psProductPrice(productId: string): Promise<PsPrice | null> {
  try {
    const res = await fetch(`https://store.playstation.com/tr-tr/product/${productId}`, {
      headers: { "User-Agent": PS_UA },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const baseM = html.match(/"basePrice":"([^"]+)"/);
    const discM = html.match(/"discountedPrice":"([^"]+)"/);
    const base = psPriceTL(baseM?.[1]);
    if (base === null) return null;
    const disc = psPriceTL(discM?.[1]) ?? base;
    const cut = disc < base ? Math.round((1 - disc / base) * 100) : 0;
    return { productId, amount: disc, cut };
  } catch {
    return null;
  }
}

export interface ItadLow {
  amount: number; // TRY
  shop: string;
  day: string; // ISO date
}

/** Real all-time-low TR price per ITAD id (min across all shops ITAD tracks). */
export async function itadStoreLow(ids: string[], key: string): Promise<Record<string, ItadLow>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(`https://api.isthereanydeal.com/games/storelow/v2?key=${key}&country=TR`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ids),
    });
    if (!res.ok) return {};
    const data = (await res.json()) as Array<{
      id: string;
      lows: Array<{ shop: { name: string }; price: { amount: number }; timestamp: string }>;
    }>;
    const out: Record<string, ItadLow> = {};
    for (const g of data) {
      let best: ItadLow | null = null;
      for (const l of g.lows ?? []) {
        if (!best || l.price.amount < best.amount) {
          best = { amount: l.price.amount, shop: l.shop.name, day: (l.timestamp || "").slice(0, 10) };
        }
      }
      if (best) out[g.id] = best;
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
  fn: (item: T) => Promise<R>,
  delayMs = 0
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
