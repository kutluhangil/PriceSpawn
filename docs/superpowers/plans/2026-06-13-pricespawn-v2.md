# PriceSpawn v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Second launch-polish round — grow the catalog, add EA Play subscription tiers, add shareable filters / biggest-discounts / sale calendar, add SEO + OG images, and polish mobile + empty/loading states.

**Architecture:** Catalog stays metadata-only with a live price overlay (`applyLive`); new work is mostly pure libs (filter-url, sales) with thin client components, plus Next.js metadata/OG/sitemap routes. EA Play is modeled as a subscription tier (no per-game pricing). Catalog growth is a generator/seed step, not runtime.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, React 19, Vitest, Neon Postgres, ITAD API, `next/og`.

**Spec:** `docs/superpowers/specs/2026-06-13-pricespawn-v2-design.md`

---

## Phase 1 — Data

### Task 1: EA Play + EA Play Pro subscription tiers

**Files:**
- Modify: `src/lib/subscriptions.ts`
- Modify: `src/components/store-logo.tsx:37-43` (SUB_BRAND)
- Modify: `src/components/sub-value-card.tsx`
- Test: `tests/sub-value.test.ts`

- [ ] **Step 1: Update subscriptions.ts** — add `eaplaypro`, `yearlyTRY?`, real TR prices.

```ts
export type SubscriptionId = "gamepass" | "psplus" | "eaplay" | "eaplaypro" | "ubisoftplus" | "luna";

export interface SubscriptionMeta {
  id: SubscriptionId;
  label: string;
  monthlyTRY: number;
  yearlyTRY?: number; // shown as a second plan line when present
  accent: string;
  url: string; // official subscription page
}

export const SUBSCRIPTIONS: Record<SubscriptionId, SubscriptionMeta> = {
  gamepass: { id: "gamepass", label: "Xbox Game Pass", monthlyTRY: 549, accent: "#16c60c", url: "https://www.xbox.com/xbox-game-pass" },
  psplus: { id: "psplus", label: "PS Plus Extra", monthlyTRY: 460, accent: "#2e8cff", url: "https://www.playstation.com/ps-plus" },
  eaplay: { id: "eaplay", label: "EA Play", monthlyTRY: 219.99, yearlyTRY: 1499.99, accent: "#ff5c5c", url: "https://www.ea.com/ea-play" },
  eaplaypro: { id: "eaplaypro", label: "EA Play Pro", monthlyTRY: 619, accent: "#ff8a4c", url: "https://www.ea.com/ea-play/pro" },
  ubisoftplus: { id: "ubisoftplus", label: "Ubisoft+", monthlyTRY: 679, accent: "#4da6ff", url: "https://www.ubisoft.com/ubisoft-plus" },
  luna: { id: "luna", label: "Amazon Luna", monthlyTRY: 430, accent: "#9146ff", url: "https://luna.amazon.com" },
};
```

- [ ] **Step 2: Add SUB_BRAND entry** in `src/components/store-logo.tsx` (the `Record<SubscriptionId,...>` will not compile without it). Change the SUB_BRAND object to:

```ts
const SUB_BRAND: Record<SubscriptionId, string | "xbox"> = {
  gamepass: "xbox",
  psplus: "playstation",
  eaplay: "ea",
  eaplaypro: "ea",
  ubisoftplus: "ubisoft",
  luna: "luna",
};
```

- [ ] **Step 3: Show yearly plan line** in `src/components/sub-value-card.tsx`. Replace the right-side price block (lines ~47-55) with:

```tsx
        <div className="text-right">
          <p className="text-sm font-extrabold text-bright">
            {formatTRY(v.monthlyTRY, locale)}
            <span className="text-xs font-normal text-muted">{t.perMonth}</span>
          </p>
          {sub.yearlyTRY != null && (
            <p className="text-xs text-muted">
              {formatTRY(sub.yearlyTRY, locale)}
              <span className="text-[10px]"> /{locale === "tr" ? "yıl" : "yr"}</span>
            </p>
          )}
          <p className="text-xs font-bold" style={{ color: sub.accent }}>
            {Math.round(v.ratio)}× {t.valueWorth}
          </p>
        </div>
```

Add `const sub = SUBSCRIPTIONS[id];` is already present (line 15). Keep `SUBSCRIPTIONS` import (already imported).

- [ ] **Step 4: Update sub-value test** — add a case asserting `eaplaypro` resolves. Append to `tests/sub-value.test.ts` inside the `describe`:

```ts
  it("supports the eaplaypro tier", () => {
    const v = subscriptionValue("eaplaypro", GAMES);
    expect(v.monthlyTRY).toBe(SUBSCRIPTIONS.eaplaypro.monthlyTRY);
    expect(v.count).toBeGreaterThanOrEqual(0);
  });
```

- [ ] **Step 5: Run tests**

Run: `npm test -- sub-value`
Expected: PASS (all sub-value tests green)

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (all `Record<SubscriptionId>` maps updated)

- [ ] **Step 7: Commit**

```bash
git add src/lib/subscriptions.ts src/components/store-logo.tsx src/components/sub-value-card.tsx tests/sub-value.test.ts
git commit -m "feat(subs): add EA Play + EA Play Pro tiers with real TR prices and yearly plan line"
```

---

### Task 2: Mark EA-published games as included in EA Play / EA Play Pro

**Files:**
- Modify: `src/data/games.ts` (end of file, after `GAMES.push(...GENERATED.map(makeGame))`)

- [ ] **Step 1: Discover EA titles in the catalog**

Run: `grep -niE "fifa|ea sports fc|\\bfc 2[0-9]|battlefield|need for speed|dragon age|mass effect|dead space|star wars jedi|the sims|\\bsims [0-9]|apex legends|it takes two|plants vs|titanfall|madden|nfs|unravel|a way out|grid legends|wild hearts|immortals of aveum|skate" src/data/games.ts | grep -oE 'slug: "[^"]+"'`

Collect the matching slugs. These are EA-published (or EA-distributed) games available via EA Play.

- [ ] **Step 2: Append a marking pass** at the very end of `src/data/games.ts` (after the existing `GAMES.push(...)` line). Use the slugs found in Step 1 to fill `EA_PLAY_SLUGS`. Newer EA titles (year ≥ 2022, day-one in EA Play Pro) additionally get `eaplaypro`.

```ts
// EA Play / EA Play Pro inclusion (curated — EA has no ITAD TR shop, so we
// surface subscription value instead of a per-store price). EA Play Pro is the
// premium tier and includes everything EA Play does plus day-one new releases.
const EA_PLAY_SLUGS: string[] = [
  // filled from the Step-1 grep, e.g.:
  // "battlefield-2042", "ea-sports-fc-25", "need-for-speed-unbound",
  // "dragon-age-the-veilguard", "mass-effect-legendary-edition",
  // "dead-space", "star-wars-jedi-survivor", "the-sims-4", "it-takes-two",
];

function markSub(slugs: string[], sub: SubscriptionId) {
  const set = new Set(slugs);
  for (const g of GAMES) {
    if (set.has(g.slug) && !g.subscriptions.includes(sub)) {
      g.subscriptions = [...g.subscriptions, sub];
    }
  }
}

markSub(EA_PLAY_SLUGS, "eaplay");
markSub(
  EA_PLAY_SLUGS.filter((s) => {
    const g = GAMES.find((x) => x.slug === s);
    return g != null && g.releaseYear >= 2022;
  }),
  "eaplaypro"
);
```

- [ ] **Step 3: Verify counts**

Run: `npx tsx -e "import('./src/data/games.ts').then(m=>{const c=(id)=>m.GAMES.filter(g=>g.subscriptions.includes(id)).length;console.log('eaplay',c('eaplay'),'eaplaypro',c('eaplaypro'))})" 2>/dev/null || node --import tsx -e "import('./src/data/games.ts').then(m=>{const c=(id)=>m.GAMES.filter(g=>g.subscriptions.includes(id)).length;console.log('eaplay',c('eaplay'),'eaplaypro',c('eaplaypro'))})"`
Expected: `eaplay` ≥ 8, `eaplaypro` ≥ 3 (non-zero both)

- [ ] **Step 4: Run full tests + typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: PASS, no type errors

- [ ] **Step 5: Commit**

```bash
git add src/data/games.ts
git commit -m "feat(subs): mark EA-published catalog games as EA Play / EA Play Pro included"
```

---

### Task 3: Grow catalog to ~2500 via ITAD stats endpoints, then seed

**Files:**
- Modify: `/tmp/gen2.py` (generator, not in repo)
- Modify: `src/data/games.ts` (append to `GENERATED`)
- Modify: `tests/data.test.ts:6` (bump min count)

- [ ] **Step 1: Export current ids/slugs for dedup**

```bash
grep -oE 'id: "[0-9]+"' src/data/games.ts | grep -oE '[0-9]+' > /tmp/existing_ids.txt
grep -oE 'appid: [0-9]+' src/data/games.ts | grep -oE '[0-9]+' >> /tmp/existing_ids.txt
grep -oE 'slug: "[^"]+"' src/data/games.ts | sed 's/slug: "//;s/"//' > /tmp/existing_slugs.txt
sort -u /tmp/existing_ids.txt -o /tmp/existing_ids.txt
wc -l /tmp/existing_ids.txt /tmp/existing_slugs.txt
```

- [ ] **Step 2: Replace the id-collection block in `/tmp/gen2.py`** (lines ~19-32) so ids come from ITAD `stats/*` (non-discounted included) plus deals as fallback:

```python
# 1) collect game ids: ITAD popularity/waitlist/collection stats + deals fallback
ids=[]; seen=set()
def add_ids(items, key="id"):
    for g in items or []:
        gid = g.get(key) if isinstance(g, dict) else None
        if gid and gid not in seen:
            seen.add(gid); ids.append(gid)

for ep in ["most-popular", "most-waitlisted", "most-collected"]:
    for offset in range(0, 3000, 500):
        u=f"https://api.isthereanydeal.com/stats/{ep}/v1?key={KEY}&country=TR&limit=500&offset={offset}"
        d=get(u)
        if not d: break
        rows = d if isinstance(d, list) else d.get("list", [])
        if not rows: break
        # each row may be {"id": "...", ...} or {"game": {"id": "..."}}
        add_ids([(r.get("game") or r) for r in rows])
        if len(rows) < 500: break

# deals fallback to top up
offset=0
while len(ids) < 4000 and offset < 6000:
    u=f"https://api.isthereanydeal.com/deals/v2?key={KEY}&country=TR&limit=200&offset={offset}&sort=-trending&nondeals=true"
    d=get(u)
    if not d: break
    add_ids([g for g in d.get("list",[]) if g.get("type")=="game"])
    if not d.get("hasMore"): break
    offset=d.get("nextOffset",offset+200)
print("collected game ids:", len(ids))
```

Also bump the build cap in the `ThreadPoolExecutor` loop from `if len(out)>=950` to `if len(out)>=1500`.

- [ ] **Step 3: Run the generator**

```bash
cd /tmp && python3 gen2.py
```
Expected: prints `collected game ids: <large>` and `NEW games: <hundreds>`; writes `/tmp/specs2.txt`.

- [ ] **Step 4: Append new specs** to `src/data/games.ts` — insert the lines from `/tmp/specs2.txt` immediately before the closing `];` of the `GENERATED` array (before line `GAMES.push(...GENERATED.map(makeGame));`).

```bash
python3 - <<'PY'
src="src/data/games.ts"
s=open(src).read()
new=open("/tmp/specs2.txt").read().rstrip()+"\n"
marker="];\n\nGAMES.push(...GENERATED.map(makeGame));"
assert marker in s, "marker not found"
s=s.replace(marker, new+marker)
open(src,"w").write(s)
print("appended")
PY
```

- [ ] **Step 5: Bump the catalog min-count assertion** in `tests/data.test.ts`:

```ts
  it("has many games", () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(2000);
  });
```

- [ ] **Step 6: Run tests + typecheck + build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: PASS; build succeeds (unique slugs, no leaked prices). If a duplicate slug/id slipped in, remove the offending appended line.

- [ ] **Step 7: Commit**

```bash
git add src/data/games.ts tests/data.test.ts
git commit -m "feat(catalog): grow to ~2500 games via ITAD popularity/waitlist/collection stats"
```

- [ ] **Step 8: Deploy + seed live prices from production** (local IP is blocked by PS; ITAD works locally but prod is the source of truth).

```bash
vercel --prod
# after READY, seed (CRON_SECRET from Vercel env):
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://<prod-url>/api/refresh" | head
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://<prod-url>/api/refresh-ps?seed=1" | head
curl -s "https://<prod-url>/api/prices" | python3 -c "import sys,json;d=json.load(sys.stdin);print('priced slugs:',len(d['prices']))"
```
Expected: `priced slugs` grows toward the new catalog size (multiple refresh runs may be needed since refresh-ps processes ~80/run).

---

## Phase 2 — Features

### Task 4: Filter URL serialization library

**Files:**
- Create: `src/lib/filter-url.ts`
- Test: `tests/filter-url.test.ts`

- [ ] **Step 1: Write the failing test** `tests/filter-url.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { serializeOpts, parseOpts } from "@/lib/filter-url";
import type { FilterOpts } from "@/lib/filters";

const base: FilterOpts = {
  genres: [], stores: [], subscriptions: [],
  onlyDiscounted: false, minTRY: null, maxTRY: null, sort: "discount",
};

describe("filter-url", () => {
  it("empty opts serialize to empty string", () => {
    expect(serializeOpts(base)).toBe("");
  });

  it("round-trips a populated filter", () => {
    const o: FilterOpts = {
      genres: ["RPG", "Aksiyon"], stores: ["steam", "epic"], subscriptions: ["gamepass"],
      onlyDiscounted: true, minTRY: 100, maxTRY: 900, sort: "priceAsc",
    };
    const parsed = parseOpts(new URLSearchParams(serializeOpts(o)));
    expect({ ...base, ...parsed }).toEqual(o);
  });

  it("accepts legacy ?store= alias", () => {
    const parsed = parseOpts(new URLSearchParams("store=epic"));
    expect(parsed.stores).toEqual(["epic"]);
  });

  it("ignores an invalid sort", () => {
    const parsed = parseOpts(new URLSearchParams("sort=bogus"));
    expect(parsed.sort).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- filter-url`
Expected: FAIL ("Cannot find module '@/lib/filter-url'")

- [ ] **Step 3: Implement** `src/lib/filter-url.ts`:

```ts
import type { FilterOpts, SortKey } from "@/lib/filters";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

const SORTS: SortKey[] = ["discount", "priceAsc", "priceDesc", "score", "year", "name"];

export function serializeOpts(o: FilterOpts): string {
  const p = new URLSearchParams();
  if (o.genres.length) p.set("g", o.genres.join(","));
  if (o.stores.length) p.set("s", o.stores.join(","));
  if (o.subscriptions.length) p.set("sub", o.subscriptions.join(","));
  if (o.onlyDiscounted) p.set("disc", "1");
  if (o.minTRY !== null) p.set("min", String(o.minTRY));
  if (o.maxTRY !== null) p.set("max", String(o.maxTRY));
  if (o.sort !== "discount") p.set("sort", o.sort);
  return p.toString();
}

export function parseOpts(params: URLSearchParams): Partial<FilterOpts> {
  const out: Partial<FilterOpts> = {};
  const g = params.get("g");
  if (g) out.genres = g.split(",").filter(Boolean);
  const s = params.get("s") ?? params.get("store");
  if (s) out.stores = s.split(",").filter(Boolean) as StoreId[];
  const sub = params.get("sub");
  if (sub) out.subscriptions = sub.split(",").filter(Boolean) as SubscriptionId[];
  if (params.get("disc") === "1") out.onlyDiscounted = true;
  const min = params.get("min");
  if (min !== null && min !== "" && !Number.isNaN(Number(min))) out.minTRY = Number(min);
  const max = params.get("max");
  if (max !== null && max !== "" && !Number.isNaN(Number(max))) out.maxTRY = Number(max);
  const sort = params.get("sort");
  if (sort && (SORTS as string[]).includes(sort)) out.sort = sort as SortKey;
  return out;
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- filter-url`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/filter-url.ts tests/filter-url.test.ts
git commit -m "feat(filters): URL serialize/parse for shareable filter state"
```

---

### Task 5: Wire BrowseContent to the URL

**Files:**
- Modify: `src/components/browse-content.tsx`

- [ ] **Step 1: Replace BrowseContent** with URL-synced version:

```tsx
"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GAMES } from "@/data/games";
import { filterSortGames } from "@/lib/filters";
import { GameCard } from "@/components/game-card";
import { FilterBar } from "@/components/filter-bar";
import { useGameFilters } from "@/hooks/use-game-filters";
import { parseOpts, serializeOpts } from "@/lib/filter-url";
import { useApp } from "@/components/providers";

export function BrowseContent() {
  const { t } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Initialize once from the URL (deep-link / shared filter).
  const initial = useMemo(() => parseOpts(new URLSearchParams(params.toString())), []); // eslint-disable-line react-hooks/exhaustive-deps
  const f = useGameFilters(initial);
  const results = useMemo(() => filterSortGames(GAMES, f.opts), [f.opts]);

  // Reflect filter state back into the URL (shareable, back/forward works).
  useEffect(() => {
    const qs = serializeOpts(f.opts);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [f.opts, pathname, router]);

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-5 text-2xl font-bold text-bright sm:text-3xl">
        {t.allGamesPage}
      </h1>

      <FilterBar
        opts={f.opts}
        toggleGenre={f.toggleGenre}
        toggleStore={f.toggleStore}
        toggleSub={f.toggleSub}
        setOnlyDiscounted={f.setOnlyDiscounted}
        setMin={f.setMin}
        setMax={f.setMax}
        setSort={f.setSort}
        reset={f.reset}
      />

      <p className="mb-4 mt-5 text-sm text-muted">
        {results.length} {t.resultCount}
      </p>

      {results.length === 0 ? (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">
          {t.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manual verify**

Run: `npm run dev` then open `http://localhost:3000/oyunlar`, toggle a genre + store + sort; confirm the URL gains `?g=…&s=…&sort=…`. Copy the URL into a new tab; confirm the same filters are active. Open `/oyunlar?store=epic`; confirm the Epic store chip is pre-selected.

- [ ] **Step 3: Lint + typecheck**

Run: `npx tsc --noEmit && npx eslint src/components/browse-content.tsx`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/browse-content.tsx
git commit -m "feat(filters): sync /oyunlar filter state to the URL (shareable links)"
```

---

### Task 6: Home "En Büyük İndirimler" section

**Files:**
- Create: `src/components/biggest-discounts.tsx`
- Modify: `src/i18n/tr.ts`, `src/i18n/en.ts`
- Modify: `src/components/home-content.tsx`

- [ ] **Step 1: Add translation key** to `src/i18n/tr.ts` (near `dealRadar`, line ~84):

```ts
  biggestDiscounts: "En Büyük İndirimler",
```

and to `src/i18n/en.ts` (near its `dealRadar`):

```ts
  biggestDiscounts: "Biggest Discounts",
```

- [ ] **Step 2: Create** `src/components/biggest-discounts.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { GameCard } from "@/components/game-card";
import { useApp } from "@/components/providers";

export function BiggestDiscounts({ limit = 8 }: { limit?: number }) {
  const { priceLoaded, priceVersion } = useApp();
  const top = useMemo(() => {
    return GAMES.map((g) => ({ g, d: bestPrice(g)?.price.discountPercent ?? 0 }))
      .filter((x) => x.d > 0)
      .sort((a, b) => b.d - a.d)
      .slice(0, limit)
      .map((x) => x.g);
    // priceVersion bump means live prices changed → recompute.
  }, [limit, priceVersion]);

  if (!priceLoaded || top.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {top.map((g) => (
        <GameCard key={g.slug} game={g} />
      ))}
    </div>
  );
}
```

(`useApp()` exposes `priceLoaded` and `priceVersion` per `src/components/providers.tsx`.)

- [ ] **Step 3: Place it on the home page** — in `src/components/home-content.tsx`, import it and add a section just above the "Fırsat Radarı" section (line ~95):

```tsx
import { BiggestDiscounts } from "@/components/biggest-discounts";
```

```tsx
      {/* En Büyük İndirimler */}
      <section className="reveal pt-12" style={{ animationDelay: "0.16s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.biggestDiscounts}
        </h2>
        <BiggestDiscounts />
      </section>
```

- [ ] **Step 4: Typecheck + lint + build**

Run: `npx tsc --noEmit && npx eslint src/components/biggest-discounts.tsx && npm run build`
Expected: no errors; build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/biggest-discounts.tsx src/components/home-content.tsx src/i18n/tr.ts src/i18n/en.ts
git commit -m "feat(home): biggest-discounts section (live, hidden until prices load)"
```

---

### Task 7: Sale events data + status library

**Files:**
- Create: `src/data/sales.ts`
- Create: `src/lib/sales.ts`
- Test: `tests/sales.test.ts`

- [ ] **Step 1: Create** `src/data/sales.ts`:

```ts
import type { StoreId } from "@/lib/stores";

export interface SaleEvent {
  id: string;
  name: string;
  store: StoreId;
  start: string; // ISO date (UTC), inclusive
  end: string; // ISO date (UTC), inclusive
  url?: string;
}

// Curated store sale calendar. Dates after the next confirmed event are
// PROJECTED from prior-year patterns and should be verified/refreshed each
// quarter. Sources: Valve seasonal schedule, SteamDB history, Epic patterns.
export const SALE_EVENTS: SaleEvent[] = [
  { id: "steam-nextfest-jun-2026", name: "Steam Next Fest (Haziran)", store: "steam", start: "2026-06-15", end: "2026-06-22", url: "https://store.steampowered.com" },
  { id: "steam-summer-2026", name: "Steam Yaz İndirimi", store: "steam", start: "2026-06-25", end: "2026-07-09", url: "https://store.steampowered.com" },
  { id: "steam-nextfest-oct-2026", name: "Steam Next Fest (Ekim)", store: "steam", start: "2026-10-13", end: "2026-10-20", url: "https://store.steampowered.com" },
  { id: "steam-autumn-2026", name: "Steam Sonbahar İndirimi", store: "steam", start: "2026-11-25", end: "2026-12-01", url: "https://store.steampowered.com" },
  { id: "epic-holiday-2026", name: "Epic Yılbaşı İndirimi", store: "epic", start: "2026-12-17", end: "2027-01-07", url: "https://store.epicgames.com" },
  { id: "steam-winter-2026", name: "Steam Kış İndirimi", store: "steam", start: "2026-12-18", end: "2027-01-05", url: "https://store.steampowered.com" },
  { id: "ps-holiday-2026", name: "PlayStation Yılbaşı İndirimi", store: "playstation", start: "2026-12-17", end: "2027-01-19", url: "https://store.playstation.com" },
];
```

- [ ] **Step 2: Write the failing test** `tests/sales.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";

const ev = { start: "2026-06-25", end: "2026-07-09" };

describe("saleStatus", () => {
  it("is upcoming before the start", () => {
    expect(saleStatus(ev, new Date("2026-06-13T12:00:00Z"))).toBe("upcoming");
  });
  it("is active within the window (inclusive ends)", () => {
    expect(saleStatus(ev, new Date("2026-06-25T00:00:00Z"))).toBe("active");
    expect(saleStatus(ev, new Date("2026-07-09T23:00:00Z"))).toBe("active");
  });
  it("is past after the end", () => {
    expect(saleStatus(ev, new Date("2026-07-10T12:00:00Z"))).toBe("past");
  });
});

describe("daysUntil", () => {
  it("counts whole days to a future date", () => {
    expect(daysUntil("2026-06-25", new Date("2026-06-13T20:00:00Z"))).toBe(12);
  });
  it("is zero on the day itself", () => {
    expect(daysUntil("2026-06-13", new Date("2026-06-13T20:00:00Z"))).toBe(0);
  });
});

describe("upcomingAndActive", () => {
  it("drops past events and sorts by start", () => {
    const events = [
      { id: "b", name: "B", store: "steam" as const, start: "2026-08-01", end: "2026-08-05" },
      { id: "a", name: "A", store: "steam" as const, start: "2026-07-01", end: "2026-07-05" },
      { id: "old", name: "Old", store: "steam" as const, start: "2026-01-01", end: "2026-01-05" },
    ];
    const r = upcomingAndActive(events, new Date("2026-06-13T00:00:00Z"));
    expect(r.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- sales`
Expected: FAIL ("Cannot find module '@/lib/sales'")

- [ ] **Step 4: Implement** `src/lib/sales.ts`:

```ts
import type { SaleEvent } from "@/data/sales";

export type SaleStatus = "active" | "upcoming" | "past";

export function saleStatus(event: { start: string; end: string }, now: Date): SaleStatus {
  const start = Date.parse(`${event.start}T00:00:00Z`);
  const end = Date.parse(`${event.end}T23:59:59Z`);
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t > end) return "past";
  return "active";
}

export function daysUntil(dateISO: string, now: Date): number {
  const target = Date.parse(`${dateISO}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

export function upcomingAndActive(events: SaleEvent[], now: Date): SaleEvent[] {
  return events
    .filter((e) => saleStatus(e, now) !== "past")
    .sort((a, b) => a.start.localeCompare(b.start));
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npm test -- sales`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/sales.ts src/lib/sales.ts tests/sales.test.ts
git commit -m "feat(sales): curated sale-event calendar data + status/countdown library"
```

---

### Task 8: Sale calendar component on home

**Files:**
- Create: `src/components/sale-calendar.tsx`
- Modify: `src/i18n/tr.ts`, `src/i18n/en.ts`
- Modify: `src/components/home-content.tsx`

- [ ] **Step 1: Add translation keys** to `src/i18n/tr.ts`:

```ts
  saleCalendar: "İndirim Takvimi",
  saleActiveNow: "Şu an aktif",
  saleDaysLeft: "gün kaldı",
```

and `src/i18n/en.ts`:

```ts
  saleCalendar: "Sale Calendar",
  saleActiveNow: "Live now",
  saleDaysLeft: "days left",
```

- [ ] **Step 2: Create** `src/components/sale-calendar.tsx`:

```tsx
"use client";

import { SALE_EVENTS } from "@/data/sales";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

export function SaleCalendar({ limit = 5 }: { limit?: number }) {
  const { t, locale } = useApp();
  const now = new Date();
  const events = upcomingAndActive(SALE_EVENTS, now).slice(0, limit);
  if (events.length === 0) return null;

  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  return (
    <ul className="flex flex-col gap-2">
      {events.map((e) => {
        const status = saleStatus(e, now);
        const left = daysUntil(e.start, now);
        const store = STORES[e.store];
        return (
          <li key={e.id}>
            <a
              href={e.url ?? store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="panel-strong flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:border-accent"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${store.accent}1f` }}
              >
                <StoreLogo id={e.store} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bright">{e.name}</p>
                <p className="text-xs text-muted">
                  {fmt(e.start)} – {fmt(e.end)}
                </p>
              </div>
              {status === "active" ? (
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                  style={{ background: store.accent }}
                >
                  ● {t.saleActiveNow}
                </span>
              ) : (
                <span className="shrink-0 text-right text-xs font-bold text-bright">
                  {left} <span className="font-normal text-muted">{t.saleDaysLeft}</span>
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 3: Place it on the home page** — in `src/components/home-content.tsx`, import and add a section after the "Fırsat Radarı" section (after line ~100):

```tsx
import { SaleCalendar } from "@/components/sale-calendar";
```

```tsx
      {/* İndirim Takvimi */}
      <section className="reveal pt-12" style={{ animationDelay: "0.22s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.saleCalendar}
        </h2>
        <SaleCalendar />
      </section>
```

- [ ] **Step 4: Typecheck + lint + build**

Run: `npx tsc --noEmit && npx eslint src/components/sale-calendar.tsx && npm run build`
Expected: no errors; build succeeds

- [ ] **Step 5: Manual verify**

Run: `npm run dev`, open home; confirm the calendar shows "Steam Next Fest (Haziran)" / "Steam Yaz İndirimi" with a countdown or "Şu an aktif" badge, sorted by date.

- [ ] **Step 6: Commit**

```bash
git add src/components/sale-calendar.tsx src/components/home-content.tsx src/i18n/tr.ts src/i18n/en.ts
git commit -m "feat(home): store sale calendar with countdown / live badges"
```

---

## Phase 3 — SEO + Sharing

### Task 9: Canonical site URL + base/detail metadata

**Files:**
- Modify: `src/lib/site.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/oyun/[slug]/page.tsx`

- [ ] **Step 1: Add canonical URL** to `src/lib/site.ts`:

```ts
export const SITE_NAME = "pricespawn.com";
export const SITE_SHORT = "pricespawn";
export const SITE_URL = "https://pricespawn.com";
export const FEEDBACK_EMAIL = "kutluhangul@windowslive.com";
```

- [ ] **Step 2: Add metadataBase + OG/Twitter defaults** to `src/app/layout.tsx`. Replace the `metadata` export with:

```ts
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} — Oyun Fiyat Karşılaştırma`,
  description:
    "Türkiye'deki tüm oyun mağazalarını karşılaştır: Steam, Epic, Xbox, PlayStation, GOG ve daha fazlası. Hangi oyun nerede daha ucuz, TL olarak gör.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    title: `${SITE_NAME} — Oyun Fiyat Karşılaştırma`,
    description:
      "Steam, Epic, Xbox, PlayStation ve daha fazlasında TL fiyatlarını karşılaştır.",
  },
  twitter: { card: "summary_large_image" },
};
```

(`SITE_URL` import added; keep the existing `SITE_NAME` import on the same line.)

- [ ] **Step 3: Add OG/Twitter to detail metadata** in `src/app/oyun/[slug]/page.tsx`. Replace the `return` inside `generateMetadata` with:

```ts
  const title = `${game.title} fiyatları — ${SITE_NAME}`;
  const description = `${game.title} hangi platformda daha ucuz? Steam, Epic, Xbox, PlayStation ve diğer mağazalardaki TL fiyatlarını karşılaştır.`;
  return {
    title,
    description,
    alternates: { canonical: `/oyun/${slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/oyun/${slug}`,
      images: [`/oyun/${slug}/opengraph-image`],
    },
    twitter: { card: "summary_large_image", title, description },
  };
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/app/layout.tsx "src/app/oyun/[slug]/page.tsx"
git commit -m "feat(seo): metadataBase + OpenGraph/Twitter metadata for site and game pages"
```

---

### Task 10: Per-game OpenGraph image

**Files:**
- Create: `src/app/oyun/[slug]/opengraph-image.tsx`

- [ ] **Step 1: Create** `src/app/oyun/[slug]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { GAMES } from "@/data/games";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "PriceSpawn";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = GAMES.find((g) => g.slug === slug);
  const title = game?.title ?? SITE_NAME;
  const cover = game?.coverUrl;
  const meta = game ? `${game.genres.slice(0, 3).join(" · ")}  ·  ${game.score}/100` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#0a0b10",
          position: "relative",
        }}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={1200}
            height={630}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(10,11,16,0.2) 0%, rgba(10,11,16,0.95) 100%)",
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16, padding: 64 }}>
          <div style={{ display: "flex", fontSize: 28, color: "#8b8ba7", fontWeight: 600 }}>{SITE_NAME}</div>
          <div style={{ display: "flex", fontSize: 68, color: "#ffffff", fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
          {meta ? <div style={{ display: "flex", fontSize: 30, color: "#c9c9e0" }}>{meta}</div> : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
```

- [ ] **Step 2: Build (OG routes are compiled at build)**

Run: `npm run build`
Expected: build succeeds; no error about `opengraph-image`

- [ ] **Step 3: Manual verify**

Run: `npm run dev`, open `http://localhost:3000/oyun/elden-ring/opengraph-image`; confirm a 1200×630 PNG renders with cover + title + meta.

- [ ] **Step 4: Commit**

```bash
git add "src/app/oyun/[slug]/opengraph-image.tsx"
git commit -m "feat(seo): dynamic per-game OpenGraph share image"
```

---

### Task 11: Sitemap + robots

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create** `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";
import { GAMES } from "@/data/games";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/oyunlar", "/ucretsiz", "/takip", "/abonelikler"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const gameRoutes = GAMES.map((g) => ({
    url: `${SITE_URL}/oyun/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...gameRoutes];
}
```

- [ ] **Step 2: Create** `src/app/robots.ts`:

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: Build + verify**

Run: `npm run build && npx tsc --noEmit`
Expected: build succeeds. Then `npm run dev`, open `http://localhost:3000/sitemap.xml` (lists game URLs) and `http://localhost:3000/robots.txt` (references sitemap).

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts
git commit -m "feat(seo): sitemap.xml (all games) + robots.txt"
```

---

## Phase 4 — Design Polish

### Task 12: Mobile pass + empty/loading consistency

**Files:**
- Modify: as found during the pass (likely `src/components/home-content.tsx`, `src/components/filter-bar.tsx`, `src/components/game-detail.tsx`, `src/components/sale-calendar.tsx`, `src/components/sub-value-card.tsx`)

- [ ] **Step 1: Mobile audit** — `npm run dev`, open each page at 390px width (DevTools device toolbar): `/`, `/oyunlar`, `/oyun/elden-ring`, `/abonelikler`, `/takip`, `/ucretsiz`. Note every issue: horizontal overflow, tap targets < 44px, cramped spacing, text truncation. Write the list before editing.

- [ ] **Step 2: Fix overflow + tap targets** — apply the noted fixes (e.g. ensure rows use `overflow-x-auto` not page overflow; buttons/links have `min-h-11`/adequate padding; the new sale-calendar badges wrap). Keep changes minimal and pattern-consistent with existing Tailwind usage.

- [ ] **Step 3: Empty/loading consistency** — verify each list has a defined empty state and a skeleton during price load:
  - `/oyunlar`: empty state already present (`t.noResults`). Confirm grid shows skeletons before `priceLoaded` if it currently flashes "no price".
  - `/takip` (watchlist): confirm empty state exists; if not, add a panel with guidance text.
  - `/abonelikler`: cards render immediately (value fills after price load) — confirm no NaN/0 flash; guard `ratio`/`totalTRY` display when `!priceLoaded` by showing a dash.
  - `/ucretsiz`: confirm empty state when no free offers.
  Make the smallest edits needed for consistency; reuse existing skeleton/shimmer classes.

- [ ] **Step 4: Full verification**

Run: `npm test && npx tsc --noEmit && npx eslint src && npm run build`
Expected: all green

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "polish(mobile): overflow/tap-target fixes + consistent empty/loading states"
```

---

## Finishing

After all tasks: run `npm test` (all green), `npm run build`, deploy to production (`vercel --prod`), seed the new catalog (Task 3 Step 8), then verify `/api/prices` count, a couple of game pages, OG image, sitemap, and the home calendar on the live URL. Update the `hangisidahaucuz-project-state` memory with the v2 changes.

---

## Self-Review

**Spec coverage:**
- 1A catalog → Task 3 ✓
- 1B EA Play/Pro tiers → Tasks 1 (tiers) + 2 (inclusion) ✓
- 2A shareable filters → Tasks 4 (lib) + 5 (wire) ✓
- 2B biggest discounts → Task 6 ✓
- 2C sale calendar → Tasks 7 (data/lib) + 8 (component) ✓
- 3A OG images → Tasks 9 (meta) + 10 (image) ✓
- 3B sitemap/robots/base meta → Tasks 9 + 11 ✓
- 4A/4B mobile + empty/loading → Task 12 ✓

**Type consistency:** `SubscriptionId` gains `eaplaypro` (Task 1) and every `Record<SubscriptionId>` map is updated in the same task (SUBSCRIPTIONS, SUB_BRAND); `FilterOpts`/`SortKey` reused from `src/lib/filters.ts` in Tasks 4–5; `SaleEvent` defined in `src/data/sales.ts` (Task 7) and consumed in Tasks 7–8; `serializeOpts`/`parseOpts` names consistent across Tasks 4–5; `saleStatus`/`daysUntil`/`upcomingAndActive` consistent across Tasks 7–8.

**Placeholder scan:** `EA_PLAY_SLUGS` is filled from a concrete discovery grep (Task 2 Step 1) — the array literal is populated during execution, not left as TODO. No other placeholders.
