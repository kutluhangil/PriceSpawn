# pricespawn v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 value features (price history graph, all-time-low badge, filter+sort, price alarm, free games, subscription value) and 10 design upgrades to pricespawn, all on demo data structured for later live-API swap, plus a live-integration guide doc.

**Architecture:** A deterministic seeded `history.ts` is the data foundation (sparkline, chart, all-time-low all read it). Pure libs (`filters`, `sub-value`, `watchlist`) are TDD'd. New pages are client components. Theme/locale providers extend to three-way theme. Everything synthetic lives in isolated modules so live integration swaps only those.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, Vitest. Existing: `src/lib/{exchange,format,stores,subscriptions,price,search,site}.ts`, `src/data/games.ts` (120 games, `Game`/`Price` types), `src/components/providers.tsx` (theme/locale + `useApp`), `src/i18n/{tr,en,index}.ts`.

**Spec:** `docs/superpowers/specs/2026-06-12-pricespawn-v5-design.md`

---

## File Structure

```
src/lib/
  history.ts        # seeded synthetic price history + allTimeLow + sparklinePath
  filters.ts        # filterSortGames(games, opts) pure
  sub-value.ts      # subscriptionValue(subId) pure
  watchlist.ts      # pure watchlist ops (add/remove/targetMet) — storage in hook
src/data/
  free.ts           # FreeOffer[] demo data
  games.ts          # MODIFY: add optional trailerId to ~18 curated games
src/hooks/
  use-watchlist.ts  # localStorage-backed watchlist hook
  use-game-filters.ts # filter state hook
src/components/
  store-logo.tsx    # inline SVG brand marks (stores + subs)
  sparkline.tsx     # mini history line
  count-up.tsx      # animated number
  skeleton.tsx      # shimmer placeholder
  atl-badge.tsx     # all-time-low badge
  hover-trailer.tsx # Steam microtrailer on hover, cover-zoom fallback
  price-chart.tsx   # detail full history area chart
  deal-radar.tsx    # discount heatmap
  command-palette.tsx # Cmd+K modal
  bottom-nav.tsx    # mobile bottom bar
  sticky-cta.tsx    # detail sticky cheapest bar
  filter-bar.tsx    # facets UI
  free-card.tsx     # free offer card
  sub-value-card.tsx
  watch-button.tsx  # "Takip Et" toggle
  cover-image.tsx   # MODIFY: shimmer while loading, hook trailer
  providers.tsx     # MODIFY: three-way theme + watchlist persistence key
  navbar.tsx        # MODIFY: nav links + palette trigger
  game-card.tsx     # MODIFY: store-logo, sparkline, atl-badge, watch-button, hover-trailer
  game-detail.tsx   # MODIFY: store-logo, atl-badge, count-up, price-chart, sticky-cta
  home-content.tsx  # MODIFY: deal-radar + free strip sections
src/app/
  oyunlar/page.tsx ucretsiz/page.tsx abonelikler/page.tsx takip/page.tsx
  layout.tsx        # MODIFY: theme init script (three-way), bottom-nav, palette mount
  globals.css       # MODIFY: shimmer keyframe, heat colors
tests/
  history.test.ts filters.test.ts sub-value.test.ts watchlist.test.ts free.test.ts
docs/
  LIVE_API_INTEGRATION.md
```

---

## PHASE 1 — Foundation

### Task 1: `history.ts` seeded price history (TDD)

**Files:** Create `src/lib/history.ts`, `tests/history.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/history.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { priceHistory, allTimeLow, isAllTimeLow, sparklinePath } from "@/lib/history";
import { GAMES } from "@/data/games";
import { priceInTRY } from "@/lib/price";

const game = GAMES.find((g) => g.slug === "cyberpunk-2077")!;
const store = game.prices[0].store;

describe("priceHistory", () => {
  it("is deterministic for same slug+store", () => {
    const a = priceHistory(game, store, 90);
    const b = priceHistory(game, store, 90);
    expect(a).toEqual(b);
  });
  it("returns the requested number of days", () => {
    expect(priceHistory(game, store, 90)).toHaveLength(90);
    expect(priceHistory(game, store, 30)).toHaveLength(30);
  });
  it("ends at the current store price", () => {
    const h = priceHistory(game, store, 90);
    const current = priceInTRY(game.prices.find((p) => p.store === store)!);
    expect(h[h.length - 1].tryAmount).toBe(current);
  });
  it("has all positive amounts and incrementing days", () => {
    const h = priceHistory(game, store, 90);
    h.forEach((pt, i) => {
      expect(pt.tryAmount).toBeGreaterThan(0);
      expect(pt.day).toBe(i);
    });
  });
  it("differs across stores", () => {
    const g = GAMES.find((x) => x.prices.length > 1)!;
    const a = priceHistory(g, g.prices[0].store, 90);
    const b = priceHistory(g, g.prices[1].store, 90);
    expect(a).not.toEqual(b);
  });
});

describe("allTimeLow / isAllTimeLow", () => {
  it("all-time-low is <= every history point of every store", () => {
    const atl = allTimeLow(game);
    for (const p of game.prices) {
      for (const pt of priceHistory(game, p.store, 90)) {
        expect(atl.tryAmount).toBeLessThanOrEqual(pt.tryAmount + 0.001);
      }
    }
  });
  it("isAllTimeLow true when current best <= historical min", () => {
    // synthetic anchor makes a deep-discount game land at/near its low sometimes;
    // assert the function agrees with the data rather than a fixed slug
    const atl = allTimeLow(game);
    const best = Math.min(...game.prices.map(priceInTRY));
    expect(isAllTimeLow(game)).toBe(best <= atl.tryAmount * 1.02);
  });
});

describe("sparklinePath", () => {
  it("produces an SVG path string spanning the box", () => {
    const pts = priceHistory(game, store, 30);
    const d = sparklinePath(pts, 100, 28);
    expect(d.startsWith("M")).toBe(true);
    expect(d).toContain("L");
  });
  it("returns empty string for no points", () => {
    expect(sparklinePath([], 100, 28)).toBe("");
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npm test -- history` → module not found.

- [ ] **Step 3: Implement**

`src/lib/history.ts`:

```ts
import type { Game } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import { priceInTRY } from "@/lib/price";

export interface PricePoint {
  day: number;
  date: string; // ISO yyyy-mm-dd, day index counted back from today
  tryAmount: number;
}

// xfnv1a string hash → 32-bit seed
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 deterministic PRNG
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isoDay(daysAgo: number): string {
  // deterministic relative to a fixed epoch to avoid SSR/client drift within a day
  const base = new Date("2026-06-12T00:00:00Z").getTime();
  return new Date(base - daysAgo * 86400000).toISOString().slice(0, 10);
}

/**
 * Synthetic daily price history, deterministic per (slug, store).
 * Random walk around the current price with occasional discount dips,
 * anchored so the final point equals the current store price.
 */
export function priceHistory(game: Game, store: StoreId, days = 90): PricePoint[] {
  const price = game.prices.find((p) => p.store === store);
  if (!price) return [];
  const current = priceInTRY(price);
  const rand = rng(seedFrom(`${game.slug}:${store}`));

  // build a base (full) price walk, then carve discount events
  const base = current / (1 - (price.discountPercent ?? 0) / 100); // approx undiscounted
  const pts: PricePoint[] = [];
  let level = base;
  for (let i = 0; i < days; i++) {
    // gentle drift
    level += (rand() - 0.5) * base * 0.01;
    level = Math.max(base * 0.92, Math.min(base * 1.02, level));
    // discount events: ~8% of days enter a sale window
    let value = level;
    if (rand() < 0.08) {
      const cut = 0.2 + rand() * 0.5; // 20-70% off
      value = level * (1 - cut);
    }
    pts.push({ day: i, date: isoDay(days - 1 - i), tryAmount: Math.round(value * 100) / 100 });
  }
  // anchor final point to the actual current price
  pts[pts.length - 1] = {
    day: days - 1,
    date: isoDay(0),
    tryAmount: current,
  };
  return pts;
}

export interface AllTimeLow {
  tryAmount: number;
  store: StoreId;
  day: number;
}

export function allTimeLow(game: Game, days = 90): AllTimeLow {
  let best: AllTimeLow | null = null;
  for (const p of game.prices) {
    for (const pt of priceHistory(game, p.store, days)) {
      if (!best || pt.tryAmount < best.tryAmount) {
        best = { tryAmount: pt.tryAmount, store: p.store, day: pt.day };
      }
    }
  }
  return best ?? { tryAmount: 0, store: game.prices[0].store, day: 0 };
}

export function isAllTimeLow(game: Game): boolean {
  const best = Math.min(...game.prices.map(priceInTRY));
  return best <= allTimeLow(game).tryAmount * 1.02;
}

export function sparklinePath(points: PricePoint[], w: number, h: number): string {
  if (points.length === 0) return "";
  const vals = points.map((p) => p.tryAmount);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * w;
      const y = h - ((p.tryAmount - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
```

- [ ] **Step 4: Run, verify PASS** — `npm test -- history`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: seeded synthetic price history lib"`

### Task 2: Curated `trailerId` field

**Files:** Modify `src/data/games.ts`

- [ ] **Step 1: Add field to type**

In `Game` interface add: `trailerId?: string; // Steam movie id for microtrailer`.

- [ ] **Step 2: Verify movie ids (run before editing)**

For each appid below, fetch and verify the microtrailer is HTTP 200:

```bash
for app in 1245620 292030 1091500 1086940 2358720 1551360 990080 2933620 1245620 271590 1174180 990080 1593500 2050650 1971870 1364780 1778820 1716740; do
  mid=$(curl -s "https://store.steampowered.com/api/appdetails?appids=$app&filters=movies" | python3 -c "import sys,json;d=json.load(sys.stdin);m=d['$app']['data'].get('movies',[]);print(m[0]['id'] if m else 'none')")
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://cdn.cloudflare.steamstatic.com/steam/apps/$mid/microtrailer.webm")
  echo "$app -> $mid -> $code"
done
```

Use only the (appid → movie id) pairs that return 200. Known-good from spec research: 1245620→256875595, 292030→256927226, 1091500→257081132, 1086940→256987424, 2358720→257048125, 1551360→256875134, 990080→256930504, 2933620→257065848. Re-verify and add ~10 more from popular catalog games.

- [ ] **Step 3: Add `trailerId` to verified games**

For each verified game (match by slug), add the `trailerId: "<movieid>"` line. Example for cyberpunk-2077: `trailerId: "257081132"`.

- [ ] **Step 4: Verify tests still pass** — `npm test -- data`.
- [ ] **Step 5: Commit** — `git commit -am "feat: curated Steam trailer ids for hover preview"`

---

## PHASE 2 — Pure libs (TDD)

### Task 3: `filters.ts`

**Files:** Create `src/lib/filters.ts`, `tests/filters.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { filterSortGames, type FilterOpts } from "@/lib/filters";
import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";

const base: FilterOpts = {
  genres: [], stores: [], subscriptions: [],
  onlyDiscounted: false, minTRY: null, maxTRY: null, sort: "discount",
};

describe("filterSortGames", () => {
  it("returns all games with empty filters", () => {
    expect(filterSortGames(GAMES, base)).toHaveLength(GAMES.length);
  });
  it("filters by store", () => {
    const r = filterSortGames(GAMES, { ...base, stores: ["ea"] });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((g) => g.prices.some((p) => p.store === "ea"))).toBe(true);
  });
  it("filters by subscription", () => {
    const r = filterSortGames(GAMES, { ...base, subscriptions: ["gamepass"] });
    expect(r.every((g) => g.subscriptions.includes("gamepass"))).toBe(true);
  });
  it("filters by genre", () => {
    const r = filterSortGames(GAMES, { ...base, genres: ["RPG"] });
    expect(r.every((g) => g.genres.includes("RPG"))).toBe(true);
  });
  it("onlyDiscounted keeps only discounted best prices", () => {
    const r = filterSortGames(GAMES, { ...base, onlyDiscounted: true });
    expect(r.every((g) => bestPrice(g)!.price.discountPercent !== undefined)).toBe(true);
  });
  it("respects price range", () => {
    const r = filterSortGames(GAMES, { ...base, minTRY: 1000, maxTRY: 2000 });
    expect(r.every((g) => {
      const t = bestPrice(g)!.tryAmount;
      return t >= 1000 && t <= 2000;
    })).toBe(true);
  });
  it("sorts by price ascending", () => {
    const r = filterSortGames(GAMES, { ...base, sort: "priceAsc" });
    const prices = r.map((g) => bestPrice(g)!.tryAmount);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });
  it("sorts by name", () => {
    const r = filterSortGames(GAMES, { ...base, sort: "name" });
    const names = r.map((g) => g.title);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "tr")));
  });
});
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Game } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";

export type SortKey = "discount" | "priceAsc" | "priceDesc" | "score" | "year" | "name";

export interface FilterOpts {
  genres: string[];
  stores: StoreId[];
  subscriptions: SubscriptionId[];
  onlyDiscounted: boolean;
  minTRY: number | null;
  maxTRY: number | null;
  sort: SortKey;
}

export function filterSortGames(games: Game[], o: FilterOpts): Game[] {
  const filtered = games.filter((g) => {
    if (o.genres.length && !o.genres.some((x) => g.genres.includes(x))) return false;
    if (o.stores.length && !o.stores.some((s) => g.prices.some((p) => p.store === s))) return false;
    if (o.subscriptions.length && !o.subscriptions.some((s) => g.subscriptions.includes(s)))
      return false;
    const best = bestPrice(g);
    if (!best) return false;
    if (o.onlyDiscounted && best.price.discountPercent === undefined) return false;
    if (o.minTRY !== null && best.tryAmount < o.minTRY) return false;
    if (o.maxTRY !== null && best.tryAmount > o.maxTRY) return false;
    return true;
  });

  const t = (g: Game) => bestPrice(g)!.tryAmount;
  const d = (g: Game) => bestPrice(g)!.price.discountPercent ?? 0;
  const sorters: Record<SortKey, (a: Game, b: Game) => number> = {
    discount: (a, b) => d(b) - d(a),
    priceAsc: (a, b) => t(a) - t(b),
    priceDesc: (a, b) => t(b) - t(a),
    score: (a, b) => b.score - a.score,
    year: (a, b) => b.releaseYear - a.releaseYear,
    name: (a, b) => a.title.localeCompare(b.title, "tr"),
  };
  return [...filtered].sort(sorters[o.sort]);
}

export function allGenres(games: Game[]): string[] {
  return [...new Set(games.flatMap((g) => g.genres))].sort((a, b) => a.localeCompare(b, "tr"));
}
```

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: game filter and sort lib"`

### Task 4: `sub-value.ts`

**Files:** Create `src/lib/sub-value.ts`, `tests/sub-value.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { subscriptionValue } from "@/lib/sub-value";
import { GAMES } from "@/data/games";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";

describe("subscriptionValue", () => {
  it("counts games included in the subscription", () => {
    const v = subscriptionValue("gamepass", GAMES);
    const expected = GAMES.filter((g) => g.subscriptions.includes("gamepass"));
    expect(v.count).toBe(expected.length);
    expect(v.games).toHaveLength(expected.length);
  });
  it("totals best prices of included games", () => {
    const v = subscriptionValue("eaplay", GAMES);
    const expected = GAMES.filter((g) => g.subscriptions.includes("eaplay"))
      .reduce((s, g) => s + bestPrice(g)!.tryAmount, 0);
    expect(v.totalTRY).toBeCloseTo(expected, 2);
  });
  it("exposes monthly price and value ratio", () => {
    const v = subscriptionValue("gamepass", GAMES);
    expect(v.monthlyTRY).toBe(SUBSCRIPTIONS.gamepass.monthlyTRY);
    expect(v.ratio).toBeCloseTo(v.totalTRY / v.monthlyTRY, 4);
  });
});
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Game } from "@/data/games";
import type { SubscriptionId } from "@/lib/subscriptions";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { bestPrice } from "@/lib/price";

export interface SubValue {
  id: SubscriptionId;
  count: number;
  totalTRY: number;
  monthlyTRY: number;
  ratio: number; // totalTRY / monthlyTRY
  games: Game[];
}

export function subscriptionValue(id: SubscriptionId, games: Game[]): SubValue {
  const included = games.filter((g) => g.subscriptions.includes(id));
  const totalTRY = included.reduce((s, g) => s + (bestPrice(g)?.tryAmount ?? 0), 0);
  const monthlyTRY = SUBSCRIPTIONS[id].monthlyTRY;
  return {
    id,
    count: included.length,
    totalTRY: Math.round(totalTRY * 100) / 100,
    monthlyTRY,
    ratio: monthlyTRY ? totalTRY / monthlyTRY : 0,
    games: included,
  };
}
```

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: subscription value calculator lib"`

### Task 5: `watchlist.ts` pure ops

**Files:** Create `src/lib/watchlist.ts`, `tests/watchlist.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { addWatch, removeWatch, isWatched, setTarget, targetMet, type WatchItem } from "@/lib/watchlist";
import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";

const g = GAMES[0];

describe("watchlist ops", () => {
  it("adds and detects membership", () => {
    const list = addWatch([], g.slug);
    expect(isWatched(list, g.slug)).toBe(true);
    expect(list).toHaveLength(1);
  });
  it("does not duplicate", () => {
    const list = addWatch(addWatch([], g.slug), g.slug);
    expect(list).toHaveLength(1);
  });
  it("removes", () => {
    const list = removeWatch(addWatch([], g.slug), g.slug);
    expect(isWatched(list, g.slug)).toBe(false);
  });
  it("sets a target price", () => {
    const list = setTarget(addWatch([], g.slug), g.slug, 500);
    expect(list[0].targetTRY).toBe(500);
  });
  it("targetMet true when best <= target", () => {
    const best = bestPrice(g)!.tryAmount;
    const item: WatchItem = { slug: g.slug, targetTRY: best + 100 };
    expect(targetMet(item, g)).toBe(true);
    const item2: WatchItem = { slug: g.slug, targetTRY: best - 100 };
    expect(targetMet(item2, g)).toBe(false);
  });
  it("targetMet false when no target set", () => {
    expect(targetMet({ slug: g.slug, targetTRY: null }, g)).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";

export interface WatchItem {
  slug: string;
  targetTRY: number | null;
}

export function isWatched(list: WatchItem[], slug: string): boolean {
  return list.some((w) => w.slug === slug);
}

export function addWatch(list: WatchItem[], slug: string): WatchItem[] {
  if (isWatched(list, slug)) return list;
  return [...list, { slug, targetTRY: null }];
}

export function removeWatch(list: WatchItem[], slug: string): WatchItem[] {
  return list.filter((w) => w.slug !== slug);
}

export function setTarget(list: WatchItem[], slug: string, targetTRY: number | null): WatchItem[] {
  return list.map((w) => (w.slug === slug ? { ...w, targetTRY } : w));
}

export function targetMet(item: WatchItem, game: Game): boolean {
  if (item.targetTRY === null) return false;
  const best = bestPrice(game);
  return best ? best.tryAmount <= item.targetTRY : false;
}
```

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: pure watchlist operations"`

---

## PHASE 3 — Data + i18n

### Task 6: `free.ts` demo data + test

**Files:** Create `src/data/free.ts`, `tests/free.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, expect, it } from "vitest";
import { FREE_OFFERS } from "@/data/free";
import { GAMES } from "@/data/games";

describe("free offers", () => {
  it("has at least 6 offers", () => {
    expect(FREE_OFFERS.length).toBeGreaterThanOrEqual(6);
  });
  it("each has a valid future-ish freeUntil date string", () => {
    for (const o of FREE_OFFERS) {
      expect(Number.isNaN(Date.parse(o.freeUntil))).toBe(false);
    }
  });
  it("slug, when present, exists in the catalog", () => {
    const slugs = new Set(GAMES.map((g) => g.slug));
    for (const o of FREE_OFFERS) {
      if (o.slug) expect(slugs.has(o.slug), o.slug).toBe(true);
    }
  });
  it("normalTRY is positive", () => {
    for (const o of FREE_OFFERS) expect(o.normalTRY).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

`src/data/free.ts` — `FreePlatform` type + ~8 offers. Use catalog slugs where the game exists; standalone titles otherwise. Dates within ~2 weeks of 2026-06-12.

```ts
export type FreePlatform = "epic" | "psplus" | "prime" | "gog";

export interface FreeOffer {
  title: string;
  coverUrl: string;
  platform: FreePlatform;
  freeUntil: string; // ISO date
  normalTRY: number;
  slug?: string; // catalog link when available
}

const cover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

export const FREE_OFFERS: FreeOffer[] = [
  { title: "Control Ultimate Edition", coverUrl: cover(870780), platform: "epic", freeUntil: "2026-06-19", normalTRY: 499, slug: "control-ultimate-edition" },
  { title: "Disco Elysium", coverUrl: cover(632470), platform: "epic", freeUntil: "2026-06-19", normalTRY: 499, slug: "disco-elysium" },
  { title: "Days Gone", coverUrl: cover(1259420), platform: "psplus", freeUntil: "2026-07-01", normalTRY: 949, slug: "days-gone" },
  { title: "Returnal", coverUrl: cover(1649240), platform: "psplus", freeUntil: "2026-07-01", normalTRY: 1149, slug: "returnal" },
  { title: "Dishonored 2", coverUrl: cover(403640), platform: "prime", freeUntil: "2026-06-25", normalTRY: 359, slug: "dishonored-2" },
  { title: "Fallout 4", coverUrl: cover(377160), platform: "prime", freeUntil: "2026-06-25", normalTRY: 449, slug: "fallout-4" },
  { title: "Celeste", coverUrl: cover(504230), platform: "gog", freeUntil: "2026-06-22", normalTRY: 249, slug: "celeste" },
  { title: "Cuphead", coverUrl: cover(268910), platform: "epic", freeUntil: "2026-06-19", normalTRY: 549, slug: "cuphead" },
];
```

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: free games demo data"`

### Task 7: i18n keys

**Files:** Modify `src/i18n/tr.ts`, `src/i18n/en.ts`

- [ ] **Step 1: Add keys to `tr.ts`** (inside the object, before `} as const;`)

```ts
  // v5
  allGamesPage: "Tüm Oyunlar",
  freePage: "Ücretsiz Oyunlar",
  subsPage: "Abonelik Değeri",
  watchPage: "Takip Listem",
  filters: "Filtreler",
  sortBy: "Sırala",
  sortDiscount: "İndirim", sortPriceAsc: "Fiyat (artan)", sortPriceDesc: "Fiyat (azalan)",
  sortScore: "Puan", sortYear: "Yıl", sortName: "Ad",
  genre: "Tür", store: "Mağaza", subscription: "Abonelik",
  onlyDiscounted: "Sadece indirimde", priceRange: "Fiyat aralığı",
  clearFilters: "Temizle", resultCount: "sonuç",
  watch: "Takip Et", watching: "Takipte", watchAdded: "Alarm kuruldu",
  targetPrice: "Hedef fiyat", targetReached: "Hedefe ulaştı", emptyWatch: "Henüz takip ettiğin oyun yok.",
  freeNow: "Şu An Ücretsiz", freeUntil: "Bitişe", daysLeft: "gün",
  allTimeLow: "Tarihî dip", allTimeLowFull: "Tüm zamanların en düşüğü",
  priceHistory: "Fiyat Geçmişi", days90: "90 gün",
  valueWorth: "değerinde", breakEven: "başa baş", months: "ay",
  dealRadar: "Fırsat Radarı", openIn: "mağazasında aç",
  cmdkHint: "Hızlı ara", themeSystem: "Otomatik",
  navSearch: "Ara", navDeals: "Fırsatlar", navFree: "Ücretsiz", navWatch: "Takip",
```

- [ ] **Step 2: Add matching English values to `en.ts`** (same keys, English strings: "All Games", "Free Games", "Subscription Value", "My Watchlist", "Filters", "Sort", "Discount", "Price (low→high)", "Price (high→low)", "Score", "Year", "Name", "Genre", "Store", "Subscription", "On sale only", "Price range", "Clear", "results", "Watch", "Watching", "Alarm set", "Target price", "Target reached", "You're not watching any games yet.", "Free Now", "Ends in", "days", "All-time low", "Lowest price ever", "Price History", "90 days", "worth", "break-even", "mo", "Deal Radar", "open in store", "Quick search", "Auto", "Search", "Deals", "Free", "Watch").

- [ ] **Step 3: Verify build** — `npm run build`.
- [ ] **Step 4: Commit** — `git commit -am "feat: v5 i18n keys"`

---

## PHASE 4 — Atomic components

### Task 8: `store-logo.tsx`

**Files:** Create `src/components/store-logo.tsx`

- [ ] **Step 1: Implement** — `StoreLogo({ id, size })` and `SubLogo({ id, size })`. Inline SVG simple brand glyphs (Steam gear/valve, Epic, Xbox sphere, PlayStation shapes, GOG, Ubisoft swirl, EA, Humble; Game Pass, PS Plus, EA Play, Ubisoft+, Luna). Each uses `STORES[id].accent` / `SUBSCRIPTIONS[id].accent` as fill. Fallback: colored rounded square with first letter if glyph absent. Default size 16. Pure presentational; no client hooks needed (can be a server-safe component but keep simple).
- [ ] **Step 2: Verify build** — `npm run build`.
- [ ] **Step 3: Commit** — `git commit -am "feat: store and subscription SVG logos"`

### Task 9: `sparkline.tsx`, `count-up.tsx`, `skeleton.tsx`, `atl-badge.tsx`

**Files:** Create those four components; Modify `src/app/globals.css` (shimmer keyframe)

- [ ] **Step 1: `sparkline.tsx`** — `Sparkline({ game })` client: uses cheapest store, `priceHistory(game, store, 90)`, renders `<svg viewBox="0 0 100 28">` with `sparklinePath`; stroke uses `--best` if last < first else `--muted`; `aria-hidden`.

- [ ] **Step 2: `count-up.tsx`** — `CountUp({ value, locale, className })` client: animates 0→value over 600ms with `requestAnimationFrame`, renders `formatTRY(current, locale)`. If `prefers-reduced-motion`, render final immediately. Starts when mounted.

- [ ] **Step 3: `skeleton.tsx` + shimmer** — `Skeleton({ className })` div with `animate-shimmer`. Add to globals.css:
```css
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
.animate-shimmer { background: linear-gradient(90deg, var(--row) 25%, var(--row-hover) 37%, var(--row) 63%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@media (prefers-reduced-motion: reduce) { .animate-shimmer { animation: none; } }
```

- [ ] **Step 4: `atl-badge.tsx`** — `AtlBadge({ game, size })` client: returns null unless `isAllTimeLow(game)`; renders "🔥 {t.allTimeLow}" pill (small) styled with `--best`.

- [ ] **Step 5: Verify build** — `npm run build`.
- [ ] **Step 6: Commit** — `git commit -am "feat: sparkline, count-up, skeleton, all-time-low badge"`

### Task 10: `hover-trailer.tsx` + CoverImage shimmer

**Files:** Create `src/components/hover-trailer.tsx`; Modify `src/components/cover-image.tsx`

- [ ] **Step 1: CoverImage shimmer** — add `loaded` state; show `Skeleton` (absolute, same box) until `onLoad`; keep existing gradient fallback on `onError`.

- [ ] **Step 2: `hover-trailer.tsx`** — `HoverTrailer({ game, children })` client wraps a cover; on `mouseenter` (and not reduced-motion) and if `game.trailerId`, lazily mount a muted/loop `<video src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.trailerId}/microtrailer.webm`}>` absolutely over `children`; on `mouseleave` or video error, unmount/hide video (cover-zoom remains via children's own group-hover). No trailerId → just renders children.

- [ ] **Step 3: Verify build + manual** — `npm run build`; dev: hover a card with trailerId shows video.
- [ ] **Step 4: Commit** — `git commit -am "feat: hover microtrailer with cover fallback, cover shimmer"`

---

## PHASE 5 — Pages, sections, integration

### Task 11: Three-way theme

**Files:** Modify `src/components/providers.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: providers** — change `Theme` to `"dark"|"light"|"system"`; store `themePref` in state + localStorage `pricespawn-theme`; resolve effective theme (`system` → `matchMedia("(prefers-color-scheme: dark)")`, with a `change` listener) and write `document.documentElement.dataset.theme`. `toggleTheme` cycles dark→light→system. Expose `themePref` and effective `theme`. Keep locale logic. (Migration: also read legacy `hdu-theme` once if `pricespawn-theme` absent.)

- [ ] **Step 2: layout init script** — update inline script: read `pricespawn-theme` (fallback `hdu-theme`); if `system` or absent, resolve via `matchMedia`; set `dataset.theme` to resolved dark/light.

- [ ] **Step 3: navbar toggle** — show sun/moon/auto icon by `themePref`; aria-label reflects state.

- [ ] **Step 4: Verify** — `npm run build`; toggle cycles 3 states, `system` follows OS.
- [ ] **Step 5: Commit** — `git commit -am "feat: three-way (dark/light/system) theme"`

### Task 12: `watch-button.tsx` + `use-watchlist.ts`

**Files:** Create `src/hooks/use-watchlist.ts`, `src/components/watch-button.tsx`; Modify `src/app/globals.css` if toast styles needed

- [ ] **Step 1: `use-watchlist.ts`** — `useWatchlist()` returns `{ list, toggle(slug), setTargetFor(slug, n), watched(slug) }`. State init `[]`; on mount read localStorage `pricespawn-watch` (try/catch). Every mutation writes back. Uses pure ops from `@/lib/watchlist`.

- [ ] **Step 2: `watch-button.tsx`** — `WatchButton({ slug, compact })` client: bell/heart icon, filled when watched; click toggles; on add, show a lightweight toast ("{t.watchAdded}") via a local timed state (no global toast system needed). `aria-pressed`.

- [ ] **Step 3: Verify build** — `npm run build`.
- [ ] **Step 4: Commit** — `git commit -am "feat: watchlist hook and watch button"`

### Task 13: `/takip` page

**Files:** Create `src/app/takip/page.tsx`, `src/components/watch-content.tsx`

- [ ] **Step 1: Implement** — client `WatchContent`: reads `useWatchlist`, maps slugs → GAMES; each row: cover, title, current best (`bestPrice` + `PriceTag`), target price `<input type="number">` (updates `setTargetFor`), `targetMet` → "🎯 {t.targetReached}" highlight, remove button. Empty state `t.emptyWatch` with link home. `page.tsx` renders it with metadata.
- [ ] **Step 2: Verify** — `npm run build`; add games via card buttons, see them here.
- [ ] **Step 3: Commit** — `git commit -am "feat: watchlist page"`

### Task 14: `/oyunlar` filter page

**Files:** Create `src/app/oyunlar/page.tsx`, `src/components/filter-bar.tsx`, `src/hooks/use-game-filters.ts`, `src/components/browse-content.tsx`

- [ ] **Step 1: `use-game-filters.ts`** — `useGameFilters()` holds `FilterOpts` state + setters + `reset()`. Default = empty filters, `sort: "discount"`.
- [ ] **Step 2: `filter-bar.tsx`** — facets UI: genre chips (`allGenres`), store chips (`STORES`), subscription chips (`SUBSCRIPTIONS`), onlyDiscounted toggle, min/max TRY inputs, sort `<select>` (SortKey options via i18n), clear button.
- [ ] **Step 3: `browse-content.tsx`** — client: `filterSortGames(GAMES, opts)`; header shows `{n} {t.resultCount}`; renders `GameCard` grid; empty state. `page.tsx` wraps with metadata.
- [ ] **Step 4: Verify** — `npm run build`; filters narrow results, sorts reorder.
- [ ] **Step 5: Commit** — `git commit -am "feat: browse page with filters and sort"`

### Task 15: `/ucretsiz` page + home free strip

**Files:** Create `src/app/ucretsiz/page.tsx`, `src/components/free-card.tsx`, `src/components/free-content.tsx`; Modify `src/components/home-content.tsx`

- [ ] **Step 1: `free-card.tsx`** — client: cover (CoverImage), platform badge (label per `FreePlatform`), normal price struck + "{t.freeNow}", `t.freeUntil` + days-left (computed client-side from `freeUntil` minus today, mount-safe). Links to `/oyun/{slug}` when slug present.
- [ ] **Step 2: `free-content.tsx`** — filters out expired (`freeUntil >= today`), grid of FreeCard. Used by page and (sliced) home strip.
- [ ] **Step 3: home strip** — add a "{t.freeNow}" section to `home-content.tsx` showing first ~4 offers in a row.
- [ ] **Step 4: Verify** — `npm run build`.
- [ ] **Step 5: Commit** — `git commit -am "feat: free games page and home strip"`

### Task 16: `/abonelikler` page

**Files:** Create `src/app/abonelikler/page.tsx`, `src/components/sub-value-card.tsx`, `src/components/subs-content.tsx`

- [ ] **Step 1: `sub-value-card.tsx`** — client: `subscriptionValue(id, GAMES)`; shows SubLogo + label, "{count} {gamesWord}", "{formatTRY(totalTRY)} {t.valueWorth}", "{formatTRY(monthlyTRY)}{t.perMonth}", ratio (e.g. "12× değer"), mini cover grid of included games (first ~8, link to detail).
- [ ] **Step 2: `subs-content.tsx`** — maps all `SUBSCRIPTIONS` to cards. `page.tsx` metadata.
- [ ] **Step 3: Verify** — `npm run build`.
- [ ] **Step 4: Commit** — `git commit -am "feat: subscription value page"`

### Task 17: `price-chart.tsx` + `sticky-cta.tsx` on detail

**Files:** Create `src/components/price-chart.tsx`, `src/components/sticky-cta.tsx`; Modify `src/components/game-detail.tsx`

- [ ] **Step 1: `price-chart.tsx`** — client: store tabs (game's stores, default cheapest); `priceHistory(game, store, 90)` → SVG area chart (path fill + line) using min/max scaling like `sparklinePath` but full size; mark discount dips (points below 0.9×median) with a dot; hover line shows date+price (simple: nearest-point tooltip via mouse x). Below: "{t.allTimeLowFull}: {formatTRY(allTimeLow.tryAmount)}".
- [ ] **Step 2: `sticky-cta.tsx`** — client: fixed bottom bar (above bottom-nav on mobile), "{t.cheapestAt} {formatTRY(best)} · {store}". Visible only after the price list scrolls out of view (`IntersectionObserver` on a ref passed/queried). Hidden when list visible.
- [ ] **Step 3: integrate into `game-detail.tsx`** — replace store color dots with `StoreLogo`; add `AtlBadge` to cheapest row; wrap cheapest price in `CountUp`; insert `PriceChart` section after price list; mount `StickyCta` with a ref on the price list section.
- [ ] **Step 4: Verify** — `npm run build`; visit a detail page: chart renders, sticky bar appears on scroll.
- [ ] **Step 5: Commit** — `git commit -am "feat: detail price chart and sticky cheapest CTA"`

### Task 18: `deal-radar.tsx` + GameCard upgrade

**Files:** Create `src/components/deal-radar.tsx`; Modify `src/components/game-card.tsx`, `src/components/home-content.tsx`, `src/app/globals.css`

- [ ] **Step 1: GameCard upgrade** — wrap cover in `HoverTrailer`; add `Sparkline` below cover; add `AtlBadge` (top-left) when applicable; add `WatchButton` (top-right, compact); replace store dot with `StoreLogo`.
- [ ] **Step 2: `deal-radar.tsx`** — client: discounted games, each a heat block colored by discount% (CSS var ramp: 20%→cool, 85%→hot green-yellow). Block shows title + best price on hover. Grid, links to detail. Add heat ramp helper inline.
- [ ] **Step 3: home** — add "{t.dealRadar}" section to `home-content.tsx`.
- [ ] **Step 4: Verify** — `npm run build`.
- [ ] **Step 5: Commit** — `git commit -am "feat: deal radar heatmap and upgraded game cards"`

### Task 19: `command-palette.tsx` + `bottom-nav.tsx` + navbar links

**Files:** Create `src/components/command-palette.tsx`, `src/components/bottom-nav.tsx`; Modify `src/components/navbar.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: `command-palette.tsx`** — client: global `keydown` (⌘/Ctrl+K) toggles; modal overlay (backdrop blur), input + `searchGames` results (reuse row style), plus nav shortcuts (Tüm Oyunlar/Ücretsiz/Abonelikler/Takip). Arrow keys + Enter navigate; Esc closes. Mounted once in layout.
- [ ] **Step 2: `bottom-nav.tsx`** — client: fixed bottom bar, `sm:hidden`; tabs Ara (opens palette via a window event or shared context), Fırsatlar (`/#deals`), Ücretsiz (`/ucretsiz`), Takip (`/takip`); active state by `usePathname`. To open palette from here, dispatch a `window` CustomEvent `"open-palette"` that the palette listens for.
- [ ] **Step 3: navbar** — add desktop links: Tüm Oyunlar, Ücretsiz, Abonelikler, Takip (hidden on small). Add a "⌘K" search affordance that dispatches `"open-palette"`.
- [ ] **Step 4: layout** — mount `<CommandPalette/>` and `<BottomNav/>` inside Providers; add bottom padding on mobile so content clears the nav.
- [ ] **Step 5: Verify** — `npm run build`; ⌘K opens palette; mobile shows bottom nav.
- [ ] **Step 6: Commit** — `git commit -am "feat: command palette and mobile bottom nav"`

---

## PHASE 6 — Guide + verification

### Task 20: `docs/LIVE_API_INTEGRATION.md`

**Files:** Create `docs/LIVE_API_INTEGRATION.md`

- [ ] **Step 1: Write the guide** with these sections (full prose, not placeholders):
  - **Overview & principle:** demo→live swaps only `exchange.ts`, `history.ts`, `games.ts` loader; consumers unchanged.
  - **Store APIs:** Steam `https://store.steampowered.com/api/appdetails?appids={id}&cc=tr&l=turkish` (price_overview.final is kuruş; NOTE cc=tr may return USD if the request egresses from a non-TR IP — validate, use a TR proxy/region if needed). Epic GraphQL `https://graphql.epicgames.com/graphql` (catalog offers, country=TR). GOG `https://api.gog.com/products/{id}/prices?countryCode=TR`. Xbox displaycatalog (`displaycatalog.mp.microsoft.com`, market=TR). Ubisoft/EA: no public API → scrape store pages (fragile, note legal/ToS caution).
  - **FX:** replace `USD_TRY` const with a cached live rate (e.g. exchangerate.host / TCMB), hourly.
  - **History → real:** schema `price_history(game_id text, store text, day date, try_amount numeric)`; daily Vercel cron upserts a snapshot; `priceHistory()` reads rows instead of the seeded walk; `allTimeLow` becomes a MIN query.
  - **Cron + cache:** `vercel.json` cron entry → `app/api/refresh/route.ts` → fetch all stores → upsert DB → revalidate; per-request reads use `unstable_cache`/runtime cache (price hourly, history daily).
  - **trailerId:** live loader fills it from `appdetails&filters=movies` → `movies[0].id`.
  - **Env & limits:** table of provider, base URL, auth/key, rate limit, backoff.
  - **Migration checklist:** ordered steps to flip each module.
- [ ] **Step 2: Commit** — `git commit -am "docs: live API integration guide"`

### Task 21: Final verification

- [ ] **Step 1: Full test suite** — `npm test` → all pass (existing 23 + history/filters/sub-value/watchlist/free).
- [ ] **Step 2: Build + lint** — `npm run build` and `npx eslint src` → clean.
- [ ] **Step 3: Visual check** — start `npm start -- -p 3199`; Playwright screenshots dark+light of: home (deal radar, free strip, upgraded cards), `/oyunlar` (filters), `/abonelikler`, `/takip`, detail (chart, sticky CTA), command palette open, mobile (bottom nav). Confirm dropdown still above content (z-index), no inner focus box on search.
- [ ] **Step 4: Interaction test** — Playwright: ⌘K opens palette; add to watchlist persists across reload; filter narrows; theme cycles dark→light→system.
- [ ] **Step 5: Commit any fixes; deploy** — `vercel deploy --prod --yes`; smoke `curl` 200 on `/`, `/oyunlar`, `/ucretsiz`, `/abonelikler`, `/takip`, a detail page.

---

## Self-Review Notes

- **Spec coverage:** history (T1), trailerId (T2), filters (T3/T14), sub-value (T4/T16), watchlist (T5/T12/T13), free (T6/T15), i18n (T7), store logos (T8), sparkline/count-up/skeleton/ATL (T9), hover trailer + cover shimmer (T10), three-way theme (T11), price chart + sticky CTA (T17), deal radar + card upgrade (T18), command palette + bottom nav (T19), live-API guide (T20), verification (T21). All spec features mapped.
- **Type consistency:** `FilterOpts`/`SortKey` (T3) reused T14; `SubValue` (T4) used T16; `WatchItem` + ops (T5) used T12/T13; `PricePoint`/`allTimeLow`/`isAllTimeLow`/`sparklinePath` (T1) used T9/T17/T18; `FreeOffer`/`FreePlatform` (T6) used T15; `trailerId` (T2) used T10/T18. i18n keys defined T7 used throughout.
- **Determinism guard:** `history.ts` seeds only from slug+store and uses a fixed date epoch — no `Math.random`/`Date.now` in the series, so SSR/client match (hydration safe).
- **Known judgment calls:** SVG logo glyphs and chart/tooltip JSX detailed at execution under existing component patterns; data contracts and function signatures are fixed here. Palette open-from-bottom-nav uses a `window` CustomEvent to avoid a global context.
