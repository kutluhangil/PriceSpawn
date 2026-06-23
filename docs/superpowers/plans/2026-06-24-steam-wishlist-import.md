# Steam Wishlist Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcı Steam wishlist/profil URL'i yapıştırır; public wishlist'in bizde takip edilen oyunlarını canlı en iyi TR fiyat + indirimle compact fırsat grid'inde gösterir (`/liste?id=<steamid64>`), toplu fiyat alarmı + sıralama/filtre ile.

**Architecture:** Saf çekirdek `src/lib/wishlist.ts` (parse/resolve/fetch/DB-deal/sort/filter/summary). `/liste` server component veriyi çeker; tüm metin client island'larda (`WishlistGrid`, `WishlistImport`) `useApp` ile render edilir. Ana sayfa hero'sundaki giriş `/api/steam-wishlist` ile steamid64'e çözüp `/liste`'ye yönlendirir. Fiyatlar tek SQL'de `catalog.appid = ANY` + `game_prices` LATERAL en-ucuz-mağaza join'i ile gelir.

**Tech Stack:** Next.js 16 (App Router, server + client components), TypeScript, Neon Postgres (`@/lib/db` `sql`), Vitest (`@/` alias), Tailwind v4, mevcut `ResultCard` / `useWatchlist` / i18n (`tr`/`en`).

## Global Constraints

- **SAHTE VERİ YASAK:** Fiyat/veri uydurma. Katalogda yok = sayı olarak göster, fiyat uydurma. Katalogda ama fiyatsız = mevcut "Fiyat bulunamadı"/"Ücretsiz" mantığı; sepet toplamına girmez.
- **Login yok**, hesap yok. Kalıcılık sadece localStorage.
- **Tüm cevaplar TR** (kullanıcı tercihi); UI metinleri i18n `tr`/`en` ikilisinde, `en.ts` `Record<keyof typeof tr, string>` olduğu için her yeni `tr` anahtarı `en`'de de tanımlanmalı.
- **Commit mesajlarına `Co-Authored-By: Claude` trailer EKLEME** (kullanıcı Contributors'ta claude istemiyor).
- `/liste` `noindex` + sitemap'e eklenmez (steamid64 public ama rastgele wishlist'ler indekslenmesin).
- Next.js bu repoda breaking değişiklikler içerir — kod yazmadan önce gerekirse `node_modules/next/dist/docs/` ilgili rehbere bak (özellikle `searchParams`'ın `Promise` olması, `redirect`, `metadata`).

---

### Task 1: `parseSteamInput` + `resolveSteamId`

**Files:**
- Create: `src/lib/wishlist.ts`
- Test: `tests/wishlist.test.ts`

**Interfaces:**
- Produces: `parseSteamInput(input: string): ParsedSteamInput`, `resolveSteamId(input: string): Promise<string | null>`, type `ParsedSteamInput = { kind: "id"; id: string } | { kind: "vanity"; vanity: string } | { kind: "invalid" }`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/wishlist.test.ts
import { describe, it, expect } from "vitest";
import { parseSteamInput } from "@/lib/wishlist";

describe("parseSteamInput", () => {
  it("recognizes a bare SteamID64", () => {
    expect(parseSteamInput("76561198000000000")).toEqual({ kind: "id", id: "76561198000000000" });
  });
  it("extracts id from a /profiles/ URL", () => {
    expect(parseSteamInput("https://steamcommunity.com/profiles/76561198000000000/")).toEqual({
      kind: "id",
      id: "76561198000000000",
    });
  });
  it("extracts vanity from an /id/ URL", () => {
    expect(parseSteamInput("https://steamcommunity.com/id/gabelogan/")).toEqual({ kind: "vanity", vanity: "gabelogan" });
  });
  it("treats a bare handle as a vanity", () => {
    expect(parseSteamInput("gabelogan")).toEqual({ kind: "vanity", vanity: "gabelogan" });
  });
  it("rejects empty / nonsense input", () => {
    expect(parseSteamInput("")).toEqual({ kind: "invalid" });
    expect(parseSteamInput("   ")).toEqual({ kind: "invalid" });
    expect(parseSteamInput("a b c!")).toEqual({ kind: "invalid" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: FAIL — `parseSteamInput` is not exported / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/wishlist.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/wishlist.ts tests/wishlist.test.ts
git commit -m "feat(wishlist): parse + resolve Steam references to SteamID64"
```

---

### Task 2: Wishlist types + `summarize` + `bulkAlarmTarget`

**Files:**
- Modify: `src/lib/wishlist.ts`
- Test: `tests/wishlist.test.ts`

**Interfaces:**
- Produces:
  - `interface WishlistItem { slug: string; title: string; cover: string; year: number; appid: string; priceTRY: number | null; discount: number | null; store: string | null; isFree?: boolean }`
  - `interface WishlistSummary { matched: number; onSale: number; untracked: number; cheapestCartTRY: number }`
  - `summarize(items: WishlistItem[], totalWishlist: number): WishlistSummary`
  - `bulkAlarmTarget(bestTRY: number): number`

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/wishlist.test.ts
import { summarize, bulkAlarmTarget, type WishlistItem } from "@/lib/wishlist";

const mk = (over: Partial<WishlistItem>): WishlistItem => ({
  slug: "g", title: "G", cover: "", year: 2020, appid: "1", priceTRY: null, discount: null, store: null, ...over,
});

describe("summarize", () => {
  it("counts matched / on-sale / untracked and sums the cheapest cart", () => {
    const items = [
      mk({ priceTRY: 100, discount: 50, store: "steam" }),
      mk({ priceTRY: 200, discount: null, store: "gog" }),
      mk({ priceTRY: null, discount: null, store: null }), // tracked, no price
    ];
    expect(summarize(items, 10)).toEqual({ matched: 3, onSale: 1, untracked: 7, cheapestCartTRY: 300 });
  });
  it("never reports negative untracked", () => {
    expect(summarize([mk({})], 0).untracked).toBe(0);
  });
});

describe("bulkAlarmTarget", () => {
  it("sets target one kuruş below today's best so it fires on the next drop", () => {
    expect(bulkAlarmTarget(100)).toBe(99.99);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: FAIL — `summarize` / `bulkAlarmTarget` not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
// append to src/lib/wishlist.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/wishlist.ts tests/wishlist.test.ts
git commit -m "feat(wishlist): WishlistItem type, summarize, bulkAlarmTarget"
```

---

### Task 3: `sortItems` + `filterItems`

**Files:**
- Modify: `src/lib/wishlist.ts`
- Test: `tests/wishlist.test.ts`

**Interfaces:**
- Produces:
  - `type WishlistSort = "discount" | "priceAsc" | "priceDesc" | "name" | "savings"`
  - `sortItems(sort: WishlistSort): (a: WishlistItem, b: WishlistItem) => number`
  - `filterItems(items: WishlistItem[], opts: { onlyDiscount?: boolean; store?: string | null }): WishlistItem[]`

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/wishlist.test.ts
import { sortItems, filterItems } from "@/lib/wishlist";

describe("sortItems", () => {
  const a = mk({ slug: "a", title: "Zelda", priceTRY: 300, discount: 10 });
  const b = mk({ slug: "b", title: "Alpha", priceTRY: 100, discount: 75 });
  const c = mk({ slug: "c", title: "Mid", priceTRY: 200, discount: null });
  it("discount: biggest first", () => {
    expect([a, b, c].sort(sortItems("discount")).map((x) => x.slug)).toEqual(["b", "a", "c"]);
  });
  it("priceAsc: cheapest first, priceless last", () => {
    const d = mk({ slug: "d", priceTRY: null });
    expect([a, b, d].sort(sortItems("priceAsc")).map((x) => x.slug)).toEqual(["b", "a", "d"]);
  });
  it("name: alphabetical by title", () => {
    expect([a, b, c].sort(sortItems("name")).map((x) => x.slug)).toEqual(["b", "c", "a"]);
  });
});

describe("filterItems", () => {
  const items = [
    mk({ slug: "s", discount: 50, store: "steam" }),
    mk({ slug: "g", discount: null, store: "gog" }),
  ];
  it("onlyDiscount keeps discounted items", () => {
    expect(filterItems(items, { onlyDiscount: true }).map((x) => x.slug)).toEqual(["s"]);
  });
  it("store filters by best-price store", () => {
    expect(filterItems(items, { store: "gog" }).map((x) => x.slug)).toEqual(["g"]);
  });
  it("no opts returns all", () => {
    expect(filterItems(items, {}).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: FAIL — `sortItems` / `filterItems` not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
// append to src/lib/wishlist.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/wishlist.ts tests/wishlist.test.ts
git commit -m "feat(wishlist): sort + filter helpers"
```

---

### Task 4: `addManyWithTargets` (watchlist lib + hook)

**Files:**
- Modify: `src/lib/watchlist.ts`
- Modify: `src/hooks/use-watchlist.ts`
- Test: `tests/watchlist.test.ts`

**Interfaces:**
- Produces (lib): `addManyWithTargets(list: WatchItem[], entries: { slug: string; targetTRY: number | null }[]): WatchItem[]`
- Produces (hook): `useWatchlist()` return object gains `addManyWithTargets(entries: { slug: string; targetTRY: number | null }[]): number` (count added/updated).
- Consumes: existing `WatchItem`, `isWatched`, `setTarget` from `@/lib/watchlist`.

- [ ] **Step 1: Write the failing test**

```ts
// append to tests/watchlist.test.ts
import { addManyWithTargets } from "@/lib/watchlist";

describe("addManyWithTargets", () => {
  it("adds new items with their target and updates existing ones", () => {
    const start = [{ slug: "a", targetTRY: null }];
    const next = addManyWithTargets(start, [
      { slug: "a", targetTRY: 50 }, // existing → target updated
      { slug: "b", targetTRY: 99.99 }, // new
    ]);
    expect(next).toEqual([
      { slug: "a", targetTRY: 50 },
      { slug: "b", targetTRY: 99.99 },
    ]);
  });
  it("does not mutate the input list", () => {
    const start = [{ slug: "a", targetTRY: null }];
    addManyWithTargets(start, [{ slug: "b", targetTRY: 10 }]);
    expect(start).toEqual([{ slug: "a", targetTRY: null }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/watchlist.test.ts`
Expected: FAIL — `addManyWithTargets` not exported.

- [ ] **Step 3: Write minimal implementation (lib)**

```ts
// append to src/lib/watchlist.ts
export function addManyWithTargets(
  list: WatchItem[],
  entries: { slug: string; targetTRY: number | null }[],
): WatchItem[] {
  let next = list;
  for (const e of entries) {
    next = isWatched(next, e.slug)
      ? setTarget(next, e.slug, e.targetTRY)
      : [...next, { slug: e.slug, targetTRY: e.targetTRY }];
  }
  return next;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/watchlist.test.ts`
Expected: PASS.

- [ ] **Step 5: Expose it from the hook**

In `src/hooks/use-watchlist.ts`: add `addManyWithTargets` to the import from `@/lib/watchlist`, then add this callback (after `addMany`) and include it in the returned object.

```ts
// import line becomes:
//   addManyWithTargets as addManyWithTargetsPure,
// (alias avoids clashing with the hook method name)

const addManyWithTargets = useCallback(
  (entries: { slug: string; targetTRY: number | null }[]) => {
    persist(addManyWithTargetsPure(list, entries));
    return entries.length;
  },
  [list, persist]
);

// return { ...existing, addManyWithTargets };
```

- [ ] **Step 6: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/lib/watchlist.ts src/hooks/use-watchlist.ts tests/watchlist.test.ts
git commit -m "feat(watchlist): addManyWithTargets for bulk wishlist alarms"
```

---

### Task 5: `rowToItem` + `fetchWishlistAppids` + `wishlistDeals`

**Files:**
- Modify: `src/lib/wishlist.ts`
- Test: `tests/wishlist.test.ts`

**Interfaces:**
- Produces:
  - `fetchWishlistAppids(steamid: string): Promise<string[] | null>` (null = private/empty/error)
  - `wishlistDeals(appids: string[]): Promise<WishlistItem[]>`
  - `rowToItem(r: DealRow): WishlistItem` (exported for testing) where `DealRow = { slug; title; cover; year; appid; free: boolean; try_amount: string | number | null; store: string | null; discount_percent: number | null }`
- Consumes: `sql` from `@/lib/db`; `sortItems` (Task 3).

- [ ] **Step 1: Write the failing test (pure mapper only)**

```ts
// append to tests/wishlist.test.ts
import { rowToItem } from "@/lib/wishlist";

describe("rowToItem", () => {
  it("maps a priced, discounted row", () => {
    expect(
      rowToItem({
        slug: "g", title: "G", cover: "c.jpg", year: 2021, appid: "42", free: false,
        try_amount: "199.995", store: "steam", discount_percent: 60,
      })
    ).toEqual({ slug: "g", title: "G", cover: "c.jpg", year: 2021, appid: "42", priceTRY: 200, discount: 60, store: "steam" });
  });
  it("maps a priceless, free row (no discount → null, isFree set)", () => {
    expect(
      rowToItem({
        slug: "f", title: "F", cover: "", year: 0, appid: "7", free: true,
        try_amount: null, store: null, discount_percent: 0,
      })
    ).toEqual({ slug: "f", title: "F", cover: "", year: 0, appid: "7", priceTRY: null, discount: null, store: null, isFree: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: FAIL — `rowToItem` not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
// add near the top of src/lib/wishlist.ts (after the UA const)
import { sql } from "@/lib/db";

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
```

NOTE: move the `import { sql } from "@/lib/db";` line to the very top of the file with any other imports. The pure functions (`parseSteamInput`, `summarize`, etc.) must not call `sql`, so this import stays tree-shake-safe for tests (vitest can import the module; `sql` is `null` without `DATABASE_URL` and is only touched inside `wishlistDeals`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/wishlist.test.ts`
Expected: PASS (all wishlist tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/wishlist.ts tests/wishlist.test.ts
git commit -m "feat(wishlist): fetch wishlist appids + DB deal query"
```

---

### Task 6: i18n keys (tr + en)

**Files:**
- Modify: `src/i18n/tr.ts`
- Modify: `src/i18n/en.ts`

**Interfaces:**
- Produces these `t.*` keys (consumed by Tasks 8–10): `wlTitle`, `wlImportPlaceholder`, `wlImportButton`, `wlImportHint`, `wlBackToLast`, `wlErrBadInput`, `wlErrNotFound`, `wlErrEmptyPrivate`, `wlMatched`, `wlOnSale`, `wlUntracked`, `wlCart`, `wlSortLabel`, `wlSortDiscount`, `wlSortPriceAsc`, `wlSortPriceDesc`, `wlSortName`, `wlSortSavings`, `wlOnlyDiscount`, `wlStoreAll`, `wlStoreLabel`, `wlBulkAlarm`, `wlBulkAlarmDone`, `wlEmptyTitle`.

- [ ] **Step 1: Add the keys to `src/i18n/tr.ts`**

Add before the closing `};` of the `tr` object:

```ts
  // Steam wishlist import
  wlTitle: "Steam Wishlist Fırsatların",
  wlImportPlaceholder: "Steam profil/wishlist linki ya da kullanıcı adı",
  wlImportButton: "Wishlist'i getir",
  wlImportHint: "Profilin herkese açık olmalı.",
  wlBackToLast: "Son listeme dön",
  wlErrBadInput: "Geçerli bir Steam linki ya da kullanıcı adı gir.",
  wlErrNotFound: "Bu Steam kullanıcısı bulunamadı.",
  wlErrEmptyPrivate: "Wishlist boş ya da gizli. Profil gizlilik ayarını 'Herkese Açık' yap.",
  wlMatched: "oyun",
  wlOnSale: "indirimde",
  wlUntracked: "oyunu henüz takip etmiyoruz",
  wlCart: "Tümünü en ucuz almak",
  wlSortLabel: "Sırala",
  wlSortDiscount: "En çok indirim",
  wlSortPriceAsc: "Fiyat: artan",
  wlSortPriceDesc: "Fiyat: azalan",
  wlSortName: "İsim",
  wlSortSavings: "En çok tasarruf (₺)",
  wlOnlyDiscount: "Sadece indirimdekiler",
  wlStoreAll: "Tüm mağazalar",
  wlStoreLabel: "Mağaza",
  wlBulkAlarm: "Tümünü fiyat alarmına ekle",
  wlBulkAlarmDone: "alarm eklendi · /takip'ten e-posta/bildirim aç",
  wlEmptyTitle: "Steam wishlist'ini içe aktar",
```

- [ ] **Step 2: Add the matching keys to `src/i18n/en.ts`**

Add before the closing `};` of the `en` object (same keys, English copy):

```ts
  wlTitle: "Your Steam Wishlist Deals",
  wlImportPlaceholder: "Steam profile/wishlist link or username",
  wlImportButton: "Fetch wishlist",
  wlImportHint: "Your profile must be public.",
  wlBackToLast: "Back to my last list",
  wlErrBadInput: "Enter a valid Steam link or username.",
  wlErrNotFound: "That Steam user could not be found.",
  wlErrEmptyPrivate: "Wishlist is empty or private. Set your profile privacy to 'Public'.",
  wlMatched: "games",
  wlOnSale: "on sale",
  wlUntracked: "games we don't track yet",
  wlCart: "Buy them all cheapest",
  wlSortLabel: "Sort",
  wlSortDiscount: "Biggest discount",
  wlSortPriceAsc: "Price: low to high",
  wlSortPriceDesc: "Price: high to low",
  wlSortName: "Name",
  wlSortSavings: "Most saved (₺)",
  wlOnlyDiscount: "On sale only",
  wlStoreAll: "All stores",
  wlStoreLabel: "Store",
  wlBulkAlarm: "Add all to price alerts",
  wlBulkAlarmDone: "alerts added · enable email/push in /takip",
  wlEmptyTitle: "Import your Steam wishlist",
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors (proves `tr`/`en` key sets match — `en` is `Record<keyof typeof tr, string>`).

- [ ] **Step 4: Commit**

```bash
git add src/i18n/tr.ts src/i18n/en.ts
git commit -m "i18n: keys for Steam wishlist import"
```

---

### Task 7: Slim the `/api/steam-wishlist` route to resolve + total

**Files:**
- Modify: `src/app/api/steam-wishlist/route.ts` (full rewrite)

**Interfaces:**
- Consumes: `resolveSteamId`, `fetchWishlistAppids` from `@/lib/wishlist` (Tasks 1, 5).
- Produces: `interface WishlistResolvePayload { ok: boolean; steamid?: string; total?: number; reason?: "bad_input" | "not_found" | "empty_or_private" }` (consumed by `WishlistImport`, Task 10).

- [ ] **Step 1: Rewrite the route**

```ts
// src/app/api/steam-wishlist/route.ts
import { NextResponse } from "next/server";
import { resolveSteamId, fetchWishlistAppids } from "@/lib/wishlist";

export const dynamic = "force-dynamic";

export interface WishlistResolvePayload {
  ok: boolean;
  steamid?: string;
  total?: number;
  reason?: "bad_input" | "not_found" | "empty_or_private";
}

/** Resolve a pasted Steam reference and confirm the wishlist is reachable.
 *  The heavy DB price join runs server-side on /liste, not here. */
export async function GET(req: Request) {
  const input = new URL(req.url).searchParams.get("input");
  if (!input) {
    return NextResponse.json({ ok: false, reason: "bad_input" } satisfies WishlistResolvePayload, { status: 400 });
  }
  const steamid = await resolveSteamId(input);
  if (!steamid) {
    return NextResponse.json({ ok: false, reason: "not_found" } satisfies WishlistResolvePayload);
  }
  const appids = await fetchWishlistAppids(steamid);
  if (!appids || appids.length === 0) {
    return NextResponse.json({ ok: false, reason: "empty_or_private" } satisfies WishlistResolvePayload);
  }
  return NextResponse.json({ ok: true, steamid, total: appids.length } satisfies WishlistResolvePayload);
}
```

- [ ] **Step 2: Verify nothing else imports the old payload shape**

Run: `grep -rn "SteamWishlistPayload" src`
Expected: no matches (the old interface name is gone; if any appear, update them to `WishlistResolvePayload`).

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/steam-wishlist/route.ts
git commit -m "refactor(api): slim steam-wishlist route to resolve + total"
```

---

### Task 8: `/liste` server page

**Files:**
- Create: `src/app/liste/page.tsx`

**Interfaces:**
- Consumes: `resolveSteamId`, `fetchWishlistAppids`, `wishlistDeals`, `summarize` from `@/lib/wishlist`; `WishlistGrid` and `WishlistImport`/`WishlistNotice` (Tasks 9, 10 — created next; this page imports them by name).
- Produces: route `/liste` (dynamic, noindex). Reads `searchParams` `{ id?: string; q?: string }`.

NOTE: This task depends on `WishlistGrid` (Task 9) and `WishlistImport` + `WishlistNotice` (Task 10) existing. When running tasks in order, do Tasks 9 and 10 first OR stub the imports. The recommended order is 9 → 10 → 8; this plan lists 8 here for narrative flow but **implement 9 and 10 before compiling 8**. (Subagent-driven execution: dispatch 9, 10, then 8.)

- [ ] **Step 1: Create the page**

```tsx
// src/app/liste/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveSteamId, fetchWishlistAppids, wishlistDeals, summarize } from "@/lib/wishlist";
import { WishlistGrid } from "@/components/wishlist-grid";
import { WishlistImport, WishlistNotice } from "@/components/wishlist-import";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wishlist Fırsatları", robots: { index: false, follow: false } };

export default async function ListePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; q?: string }>;
}) {
  const { id, q } = await searchParams;
  const shell = (children: React.ReactNode) => (
    <div className="mx-auto w-[min(100%-2rem,74rem)] py-10">{children}</div>
  );

  // Canonicalize a raw paste (?q=) into a shareable ?id=<steamid64>.
  if (!id && q) {
    const sid = await resolveSteamId(q);
    if (sid) redirect(`/liste?id=${sid}`);
    return shell(<WishlistNotice reason="not_found" />);
  }

  // No usable id → landing prompt (someone hit /liste directly).
  if (!id || !/^\d{17}$/.test(id)) {
    return shell(
      <div className="mx-auto max-w-xl py-16 text-center">
        <WishlistImport heading />
      </div>,
    );
  }

  const appids = await fetchWishlistAppids(id);
  if (!appids || appids.length === 0) return shell(<WishlistNotice reason="empty_or_private" />);

  const items = await wishlistDeals(appids);
  const summary = summarize(items, appids.length);
  return shell(<WishlistGrid items={items} summary={summary} steamid={id} />);
}
```

- [ ] **Step 2: Verify types compile (after Tasks 9 & 10 exist)**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/liste/page.tsx
git commit -m "feat(liste): server page for Steam wishlist deals"
```

---

### Task 9: `WishlistGrid` client island

**Files:**
- Create: `src/components/wishlist-grid.tsx`

**Interfaces:**
- Consumes: `WishlistItem`, `WishlistSummary`, `WishlistSort`, `sortItems`, `filterItems`, `bulkAlarmTarget` from `@/lib/wishlist`; `useWatchlist` (Task 4, `addManyWithTargets`); `useApp` from `@/components/providers` (`locale`, `t`); `ResultCard` from `@/components/result-card`; `formatTRY` from `@/lib/format`.
- Produces: `export function WishlistGrid({ items, summary, steamid }: { items: WishlistItem[]; summary: WishlistSummary; steamid: string })`.

- [ ] **Step 1: Create the component**

```tsx
// src/components/wishlist-grid.tsx
"use client";

import { useMemo, useState } from "react";
import {
  filterItems,
  sortItems,
  bulkAlarmTarget,
  type WishlistItem,
  type WishlistSummary,
  type WishlistSort,
} from "@/lib/wishlist";
import { useApp } from "@/components/providers";
import { useWatchlist } from "@/hooks/use-watchlist";
import { ResultCard } from "@/components/result-card";
import { formatTRY } from "@/lib/format";

export function WishlistGrid({
  items,
  summary,
  steamid,
}: {
  items: WishlistItem[];
  summary: WishlistSummary;
  steamid: string;
}) {
  const { t, locale } = useApp();
  const { addManyWithTargets } = useWatchlist();
  const [sort, setSort] = useState<WishlistSort>("discount");
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [store, setStore] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  // Stable list of stores present among best prices, for the store filter.
  const stores = useMemo(
    () => Array.from(new Set(items.map((i) => i.store).filter((s): s is string => !!s))).sort(),
    [items],
  );

  const shown = useMemo(
    () => filterItems(items, { onlyDiscount, store }).slice().sort(sortItems(sort)),
    [items, onlyDiscount, store, sort],
  );

  function bulkAdd() {
    const entries = shown
      .filter((i) => i.priceTRY != null)
      .map((i) => ({ slug: i.slug, targetTRY: bulkAlarmTarget(i.priceTRY as number) }));
    setAdded(addManyWithTargets(entries));
  }

  return (
    <div>
      {/* Summary band */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-bold text-bright">
          {summary.matched} {t.wlMatched}
        </span>
        <span className="text-muted">· {summary.onSale} {t.wlOnSale}</span>
        {summary.cheapestCartTRY > 0 && (
          <span className="text-muted">
            · {t.wlCart}: <span className="font-bold text-best">{formatTRY(summary.cheapestCartTRY, locale)}</span>
          </span>
        )}
        {summary.untracked > 0 && (
          <span className="text-muted">· {summary.untracked} {t.wlUntracked}</span>
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5 text-muted">
          {t.wlSortLabel}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as WishlistSort)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-bright"
          >
            <option value="discount">{t.wlSortDiscount}</option>
            <option value="priceAsc">{t.wlSortPriceAsc}</option>
            <option value="priceDesc">{t.wlSortPriceDesc}</option>
            <option value="savings">{t.wlSortSavings}</option>
            <option value="name">{t.wlSortName}</option>
          </select>
        </label>

        {stores.length > 1 && (
          <label className="flex items-center gap-1.5 text-muted">
            {t.wlStoreLabel}
            <select
              value={store ?? ""}
              onChange={(e) => setStore(e.target.value || null)}
              className="rounded-md border border-border bg-transparent px-2 py-1 text-bright"
            >
              <option value="">{t.wlStoreAll}</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-1.5 text-muted">
          <input type="checkbox" checked={onlyDiscount} onChange={(e) => setOnlyDiscount(e.target.checked)} />
          {t.wlOnlyDiscount}
        </label>

        <button
          onClick={bulkAdd}
          className="ml-auto rounded-full border border-accent px-3 py-1 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {t.wlBulkAlarm}
        </button>
      </div>

      {added !== null && (
        <p className="mb-4 text-sm text-best">
          {added} {t.wlBulkAlarmDone}
        </p>
      )}

      {/* Grid — reuse the lightweight catalog card */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((i) => (
          <ResultCard key={i.slug} r={i} locale={locale} freeLabel={t.freeLabel} />
        ))}
      </div>

      {/* steamid kept for a future "refresh"/share affordance */}
      <input type="hidden" value={steamid} readOnly />
    </div>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors. (`WishlistItem` is structurally assignable to `ResultCard`'s `BrowseItem` param — it has every `BrowseItem` field plus extras.)

- [ ] **Step 3: Commit**

```bash
git add src/components/wishlist-grid.tsx
git commit -m "feat(wishlist): results grid with sort/filter/bulk alarm"
```

---

### Task 10: `WishlistImport` + `WishlistNotice` + hero wiring

**Files:**
- Create: `src/components/wishlist-import.tsx`
- Modify: `src/components/home-content.tsx`

**Interfaces:**
- Consumes: `WishlistResolvePayload` from `@/app/api/steam-wishlist/route` (Task 7); `useApp`; `useRouter` from `next/navigation`.
- Produces:
  - `export function WishlistImport({ heading }: { heading?: boolean })`
  - `export function WishlistNotice({ reason }: { reason: "not_found" | "empty_or_private" | "bad_input" })`

- [ ] **Step 1: Create the import + notice components**

```tsx
// src/components/wishlist-import.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import type { WishlistResolvePayload } from "@/app/api/steam-wishlist/route";

const LAST_KEY = "pricespawn-wishlist";

export function WishlistImport({ heading = false }: { heading?: boolean }) {
  const { t } = useApp();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLast(localStorage.getItem(LAST_KEY));
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/steam-wishlist?input=${encodeURIComponent(value.trim())}`);
      const data = (await res.json()) as WishlistResolvePayload;
      if (!data.ok || !data.steamid) {
        setError(errorText(t, data.reason));
        return;
      }
      try {
        localStorage.setItem(LAST_KEY, data.steamid);
      } catch {
        /* ignore */
      }
      router.push(`/liste?id=${data.steamid}`);
    } catch {
      setError(errorText(t, "empty_or_private"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      {heading && <h1 className="mb-4 font-display text-2xl font-black text-bright">{t.wlEmptyTitle}</h1>}
      <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.wlImportPlaceholder}
          className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-4 py-2 text-sm text-bright placeholder:text-muted focus:border-accent focus:outline-none"
          aria-label={t.wlImportPlaceholder}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        >
          {busy ? "…" : t.wlImportButton}
        </button>
      </form>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{t.wlImportHint}</span>
        {last && (
          <Link href={`/liste?id=${last}`} className="font-semibold text-accent hover:text-bright">
            {t.wlBackToLast}
          </Link>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-[#dc2626]">{error}</p>}
    </div>
  );
}

function errorText(t: ReturnType<typeof useApp>["t"], reason?: WishlistResolvePayload["reason"]): string {
  switch (reason) {
    case "not_found":
      return t.wlErrNotFound;
    case "empty_or_private":
      return t.wlErrEmptyPrivate;
    default:
      return t.wlErrBadInput;
  }
}

export function WishlistNotice({ reason }: { reason: NonNullable<WishlistResolvePayload["reason"]> }) {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="mb-6 text-sm text-muted">{errorText(t, reason)}</p>
      <WishlistImport heading />
    </div>
  );
}
```

- [ ] **Step 2: Wire `WishlistImport` into the hero**

In `src/components/home-content.tsx`: add the import at the top with the other component imports:

```tsx
import { WishlistImport } from "@/components/wishlist-import";
```

Then in the hero `<section>`, immediately AFTER the SearchBar wrapper `<div className="w-full pt-4"><SearchBar variant="hero" /></div>`, add:

```tsx
        <div className="w-full max-w-xl">
          <WishlistImport />
        </div>
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/wishlist-import.tsx src/components/home-content.tsx
git commit -m "feat(wishlist): homepage import box + notice, hero wiring"
```

---

### Task 11: Full verification + deploy

**Files:** none (verification only).

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS (all existing tests + new wishlist/watchlist tests).

- [ ] **Step 2: Typecheck + production build**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed; build output lists the new `/liste` route.

- [ ] **Step 3: Manual smoke test against the dev server**

Start dev (background) if not running, then:

```bash
# resolve endpoint — bad input
curl -s "http://localhost:3000/api/steam-wishlist?input=" -o /dev/null -w "%{http_code}\n"   # expect 400
# resolve a known public profile (Gabe Newell vanity "gabelogan" → SteamID64)
curl -s "http://localhost:3000/api/steam-wishlist?input=gabelogan" | head -c 200
# /liste landing (no params) returns 200 with the import prompt
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/liste"                       # expect 200
```

Expected: bad input → 400; `gabelogan` → `{"ok":...}` (ok:true with steamid if wishlist public, or a reason); `/liste` → 200. Confirm `/liste?id=<steamid64>` renders the grid for a public wishlist and that an empty/private profile shows the notice (no fake prices).

- [ ] **Step 4: Confirm noindex + sitemap exclusion**

Run: `curl -s "http://localhost:3000/liste?id=76561197960287930" | grep -i "noindex"` (expect a robots noindex meta) and `grep -rn "liste" src/app/sitemap.ts` (expect NO match — `/liste` must not be in the sitemap).

- [ ] **Step 5: Commit any fixes, then push (auto-deploys to Vercel)**

```bash
git push origin main
```

Then verify the production deployment reaches READY (Vercel list_deployments / get_deployment) and that `https://pricespawn.vercel.app/liste` returns 200.

---

## Self-Review

**1. Spec coverage:**
- Homepage entry next to search → Task 10 (hero wiring). ✓
- `/liste` compact deal grid + summary → Tasks 8, 9. ✓
- Untracked as a count, no fake prices → `summarize` (Task 2) + grid summary band (Task 9). ✓
- Shareable `?id=steamid64`, dynamic, localStorage last list → Task 8 (redirect q→id, dynamic) + Task 10 (`pricespawn-wishlist` + "back to last"). ✓
- Sort + only-discount + store filter → Task 3 (helpers) + Task 9 (UI). ✓
- Bulk price alarm reusing email/push infra → Task 4 (`addManyWithTargets`) + Task 9 (`bulkAdd`); existing `useEmailAlerts`/`use-push` already sync the watchlist. ✓ (Spec's separate `/api/email/watch-bulk` dropped — YAGNI; `/api/email/subscribe` already syncs the full watch set from localStorage.)
- Bulk target = today's best, "next drop" semantics → `bulkAlarmTarget = best − 0.01` (Task 2) so `best <= target` does NOT fire today (notify route filters `target_try IS NOT NULL` and fires on `best <= target`). ✓
- No fake data on resolve/empty/private/down → reason states in Task 7 + `WishlistNotice` (Task 10). ✓
- noindex + not in sitemap → Task 8 metadata + Task 11 step 4 check. ✓
- i18n tr/en → Task 6. ✓
- Tests for resolve-parse/summarize/sort/filter/rowToItem/addManyWithTargets → Tasks 1–5. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. ✓

**3. Type consistency:** `WishlistItem`/`WishlistSummary`/`WishlistSort` defined in Tasks 2–3 and used identically in Tasks 5, 8, 9. `WishlistResolvePayload` defined in Task 7, consumed in Task 10. `addManyWithTargets(entries: {slug; targetTRY}[])` signature identical in lib (Task 4 lib) and hook (Task 4 hook) and call site (Task 9). `DealRow` defined and used only within Task 5. ✓

**Ordering note:** Task 8 (`/liste`) imports components built in Tasks 9 and 10 — compile/build 9 and 10 before 8 (subagent-driven: dispatch 9 → 10 → 8). All earlier tasks (1–7) are independently testable.
