# PriceSpawn v2 — Design Spec

**Date:** 2026-06-13
**Status:** Approved (user: "Onaylıyorum. Başla.")

## Goal

Second launch-polish round for PriceSpawn (Turkish game price-comparison site). Four phases: grow the catalog and add EA Play subscription tiers (data), add shareable filters / biggest-discounts / a sale calendar (features), add SEO + OG images (discoverability), and polish mobile + empty/loading states (design).

## Context & Constraints

- Catalog is **metadata-only** (`src/data/games.ts`, ~1134 games); all prices are live via `/api/prices` overlay (`applyLive`). No fake prices in the catalog — this invariant must hold.
- ITAD covers 30 TR shops; we map 6 (`steam, epic, gog, humble, ubisoft, xbox`). **No EA/Origin shop** exists in ITAD for TR → EA per-game prices are not obtainable. We do **not** scrape EA.
- Subscriptions are curated metadata (`g.subscriptions: SubscriptionId[]`). EA games already show their Steam/Epic live prices; EA Play is added as a *subscription value*, not per-game pricing.
- PS scraping stays gentle (Vercel-seeded). ITAD quota 1000 req/5min is ample.
- Caveman mode for chat; code/commits written normally.

---

## Phase 1 — Data

### 1A. Catalog 1134 → ~2500+

**Why few Ubisoft / niche games:** the catalog was sourced only from ITAD `deals/v2` (on-sale trending), which caps expansion. ITAD `stats/most-popular/v1`, `most-waitlisted/v1`, `most-collected/v1` return ranked lists **including non-discounted games** → a much larger pool.

**Approach:** Extend `/tmp/gen2.py` to collect game ids from the three `stats/*` endpoints (in addition to `deals/v2`), dedup against existing ids/slugs, resolve each via `games/info/v2` (appid + title + tags→TR genres + review score + year), verify the Steam cover returns 200, and emit `GameSpec` lines. Append to `GENERATED` in `src/data/games.ts`. Then seed live prices from production (`/api/refresh`, `/api/refresh-ps?seed=1`) and all-time-lows.

**Acceptance:** `GAMES.length >= 2200`; unique slugs; every released game still ships `prices: []`; `npm test` green; production `/api/prices` returns live prices for the new games after seeding.

### 1B. EA Play + EA Play Pro subscription tiers

**Why:** EA games can't get per-store TR prices, but EA Play / EA Play Pro are real subscriptions whose *value* we can show (like Game Pass). User decision: add both tiers, real TR prices, **no per-game price** — mark EA games as included.

**Changes:**
- `src/lib/subscriptions.ts`:
  - Add `eaplaypro` to `SubscriptionId`.
  - Add optional `yearlyTRY?: number` to `SubscriptionMeta` (so plans show monthly + yearly).
  - Real TR prices: `eaplay` → `monthlyTRY: 219.99, yearlyTRY: 1499.99` (was 149); `eaplaypro` → `monthlyTRY: 619` (no official TR yearly → omit; PC is $16.99/mo, $119.99/yr).
- `src/data/games.ts`: mark a curated list of EA-published catalog slugs with `eaplay` (and the newer ones additionally with `eaplaypro`, which includes day-one EA releases). Curated from EA franchises present in the catalog (FC/FIFA, Battlefield, Need for Speed, Dragon Age, Mass Effect, Dead Space, Star Wars Jedi, The Sims, Apex, It Takes Two, Plants vs Zombies, Titanfall, Madden, F1-by-EA, etc.).
- `src/components/subs-content.tsx`: render `eaplaypro` automatically (it iterates `SUBSCRIPTIONS`); show yearly price line where `yearlyTRY` exists.

**Acceptance:** `/abonelikler` shows EA Play and EA Play Pro cards with monthly (+yearly for EA Play) prices and included-game value (sum of included games' live best price ÷ monthly). `subscriptionValue("eaplaypro", …).count > 0`. Tests updated for the new tier.

---

## Phase 2 — Features

### 2A. Shareable filters (URL state)

`/oyunlar` filter/sort state lives in the URL query so links are shareable and back/forward works.

**Approach:** A `serializeOpts(opts) → URLSearchParams` and `parseOpts(params) → Partial<FilterOpts>` pair (pure, in `src/lib/filter-url.ts`, unit-tested round-trip). `BrowseContent` initializes `useGameFilters` from `parseOpts(useSearchParams())` and, on `opts` change, `router.replace('?' + serializeOpts(opts), { scroll: false })`. Keys: `g` (genres csv), `s` (stores csv), `sub` (subs csv), `disc` (1), `min`, `max`, `sort`. Empty values omitted (clean URLs). Existing `?store=` deep-link still works (alias into `s`).

**Acceptance:** Applying filters updates the URL; pasting a filtered URL reproduces the same results; round-trip unit test passes.

### 2B. Home "En Büyük İndirimler"

A dedicated section near the top of the home page showing the highest live-discount games with prominent `%` badges and an all-time-low marker where the live best price equals the historic low (`realAtl`).

**Approach:** New `src/components/biggest-discounts.tsx` (client). Reads `GAMES`, sorts by `bestPrice().discountPercent` desc, takes top 8, renders a grid reusing `GameCard` plus a bold discount ribbon; flags ATL via `realAtl(slug)`. Placed in `home-content.tsx` above "Fırsat Radarı". Hidden until prices load (uses `priceLoaded`), empty-safe.

**Acceptance:** Section renders top discounts after prices load; nothing shown before load / when no discounts.

### 2C. Sale event calendar

Curated upcoming store sale events on the home page, so users see what's coming (Steam Summer Sale, Next Fest, Epic, etc.).

**Approach:**
- `src/data/sales.ts`: `SaleEvent { id, name, store: StoreId, start: string ISO, end: string ISO, url?: string }` + curated 2026–27 list (Steam Summer 2026-06-25→07-09, Steam Next Fest Oct ~2026-10-13→10-20, Steam Autumn ~2026-11-25→12-01, Steam Winter 2026-12-18→2027-01-05, Epic Holiday ~2026-12 etc.). Dates marked "projected" in a comment; manually updatable.
- `src/lib/sales.ts`: pure `saleStatus(event, now) → "active" | "upcoming" | "past"` and `daysUntil(date, now)`. Unit-tested.
- `src/components/sale-calendar.tsx`: timeline list showing active + next upcoming events, each with store logo, name, date range, and "X gün kaldı" / "Şu an aktif". Placed on home (e.g., below Deal Radar). Past events filtered out.

**Acceptance:** Calendar lists active/upcoming events with correct status and countdown for a fixed `now`; `saleStatus`/`daysUntil` unit tests pass.

---

## Phase 3 — SEO + Sharing

### 3A. OG images

Per-game dynamic share card via Next `ImageResponse` at `src/app/oyun/[slug]/opengraph-image.tsx`: cover image background, gradient scrim, game title, score, genres, and PriceSpawn brand. (Live price omitted — not available server-side without a per-request DB hit; card stays price-free.) `generateMetadata` on the detail route sets `openGraph` + `twitter` (`summary_large_image`).

**Acceptance:** `/oyun/<slug>/opengraph-image` returns a 1200×630 PNG; detail pages expose OG/Twitter meta; LinkedIn/Twitter preview renders the card.

### 3B. Sitemap + robots + base metadata

- `src/app/sitemap.ts`: all game detail URLs + static routes (`/`, `/oyunlar`, `/ucretsiz`, `/takip`, `/abonelikler`).
- `src/app/robots.ts`: allow all, point to sitemap.
- `src/lib/site.ts`: add `SITE_URL` (canonical). Root `metadata` gains `metadataBase`, `openGraph` defaults, `twitter`.

**Acceptance:** `/sitemap.xml` lists all games; `/robots.txt` references it; root has `metadataBase`.

---

## Phase 4 — Design Polish

### 4A. Mobile pass

Walk every page at mobile width; fix spacing, tap targets (min 44px), and overflow. Priority: home rows, filter bar, detail price rows, subs cards, sale calendar.

### 4B. Empty / loading consistency

Unify skeletons (cover + price shimmer) and empty states across home, `/oyunlar`, `/takip`, `/abonelikler`, `/ucretsiz` so pre-price-load and no-result states feel premium and consistent.

**Acceptance:** No layout shift jank on slow price load; every list has a defined empty state; visual pass approved.

---

## Out of Scope

- Additional key-reseller stores (Fanatical, GMG, …) — not selected this round.
- EA per-game price scraping — replaced by EA Play tiers.
- Real email price alerts — still localStorage.

## Testing

- Pure functions unit-tested (`filter-url` round-trip, `sales` status/countdown, updated `sub-value` for `eaplaypro`).
- `tests/data.test.ts`: bump min-count assertion, keep "no released game ships prices".
- Manual: production seed verification, OG image fetch, mobile pass, shareable-URL paste.
- Full `npm test` green before finishing.

## Rollout Order

1A → 1B → 2A → 2B → 2C → 3A → 3B → 4A → 4B. Commit per task. Seed catalog from production after 1A lands. Deploy at the end.
