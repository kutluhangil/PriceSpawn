# PriceSpawn Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PriceSpawn launch-ready: zero fake prices (live-only), store deep-links everywhere, ~1500-game catalog, and a premium rich detail page + polish.

**Architecture:** Catalog (`games.ts`) carries metadata only; all prices come from live `/api/prices` (ITAD + PS), injected onto each game by `applyLive`. Store URLs ride along in the live payload. A new `/api/game` serves Steam screenshots/description/tags for the detail page. Generation expands the catalog from ITAD.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Neon Postgres (`@neondatabase/serverless`), Vitest. Existing live pipeline: `src/lib/{db,fetchers,live,exchange,price,history}.ts`, `src/app/api/{prices,history,free,refresh,refresh-ps,trailer}/`, `src/components/providers.tsx` (`useApp`, `priceVersion`, `liveUpdatedAt`).

**Spec:** `docs/superpowers/specs/2026-06-13-pricespawn-launch-design.md`

---

## File Structure

```
src/lib/
  store-url.ts        # NEW: storeUrl(game, price) → store product link
  live.ts             # MODIFY: carry url in applyLive; (already sets prices/lows)
  exchange.ts         # (unchanged)
src/data/
  games.ts            # MODIFY: Price.url?; Game.prices optional; strip demo prices; makeGame → prices:[]
src/components/
  providers.tsx       # MODIFY: add priceLoaded flag
  price-tag.tsx       # (unchanged)
  store-link.tsx      # NEW: <StoreLink game price>…</StoreLink> wrapper (a or span)
  game-card.tsx       # MODIFY: shimmer/no-price states; cheapest store-link; de-nest anchor
  game-detail.tsx     # MODIFY: shimmer/no-price; store-link rows; mount media+about
  billboard.tsx       # MODIFY: store-link on prices; live-only
  game-media.tsx      # NEW: Steam screenshot gallery + lightbox
  game-about.tsx      # NEW: description + tag chips
src/hooks/
  use-game-extra.ts   # NEW: fetch /api/game?appid
src/app/api/
  prices/route.ts     # MODIFY: include url per price
  refresh/route.ts    # MODIFY: write game_prices.url (ITAD deal url)
  refresh-ps/route.ts # MODIFY: write PS product url
  game/route.ts       # NEW: Steam appdetails → screenshots/desc/tags (cached game_meta)
src/lib/db.ts         # MODIFY: game_prices.url column; game_meta table
src/i18n/{tr,en}.ts   # MODIFY: noPriceFound, openInStore, aboutGame, screenshots, savingsPct
tests/
  store-url.test.ts   # NEW
  data.test.ts        # MODIFY: metadata-only checks
```

---

## PHASE 1 — Real-only data + store links

### Task 1: `Price.url` + `storeUrl()` lib (TDD)

**Files:** Modify `src/data/games.ts` (Price type); Create `src/lib/store-url.ts`, `tests/store-url.test.ts`

- [ ] **Step 1: Add `url` to Price type**

In `src/data/games.ts`, the `Price` interface:

```ts
export interface Price {
  store: StoreId;
  amount: number;
  currency: "TRY" | "USD";
  originalAmount?: number;
  discountPercent?: number;
  url?: string; // live store product link
}
```

- [ ] **Step 2: Write failing test**

`tests/store-url.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { storeUrl } from "@/lib/store-url";
import type { Game, Price } from "@/data/games";

const game = (id: string): Game => ({
  id, slug: "x", title: "X", coverUrl: "", genres: [], score: 80,
  releaseYear: 2024, prices: [], subscriptions: [],
});
const price = (store: string, url?: string): Price =>
  ({ store, amount: 100, currency: "TRY", url } as Price);

describe("storeUrl", () => {
  it("uses the live url when present", () => {
    expect(storeUrl(game("1091500"), price("steam", "https://itad.link/abc"))).toBe("https://itad.link/abc");
  });
  it("falls back to the Steam app page for steam when no live url and numeric id", () => {
    expect(storeUrl(game("1091500"), price("steam"))).toBe("https://store.steampowered.com/app/1091500");
  });
  it("returns null for steam fallback when id is not numeric", () => {
    expect(storeUrl(game("ghost-of-yotei"), price("steam"))).toBeNull();
  });
  it("returns null when no url and not steam", () => {
    expect(storeUrl(game("1091500"), price("epic"))).toBeNull();
  });
});
```

- [ ] **Step 3: Run, verify FAIL** — `npm test -- store-url`.

- [ ] **Step 4: Implement**

`src/lib/store-url.ts`:

```ts
import type { Game, Price } from "@/data/games";

export function storeUrl(game: Game, price: Price): string | null {
  if (price.url) return price.url;
  if (price.store === "steam" && /^\d+$/.test(game.id)) {
    return `https://store.steampowered.com/app/${game.id}`;
  }
  return null;
}
```

- [ ] **Step 5: Run, verify PASS; commit** — `git commit -am "feat: Price.url and storeUrl helper"`

### Task 2: DB columns — `game_prices.url`, `game_meta`

**Files:** Modify `src/lib/db.ts`

- [ ] **Step 1: Add url column + game_meta table** in `ensureSchema()`:

```ts
  await sql`ALTER TABLE game_prices ADD COLUMN IF NOT EXISTS url text`;
  await sql`
    CREATE TABLE IF NOT EXISTS game_meta (
      appid      text PRIMARY KEY,
      data       jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
```

(Place after the existing `trailer_map` create. `ALTER ... ADD COLUMN IF NOT EXISTS` is idempotent.)

- [ ] **Step 2: Verify build** — `npm run build`.
- [ ] **Step 3: Commit** — `git commit -am "feat: game_prices.url column and game_meta table"`

### Task 3: Refresh routes write store URLs

**Files:** Modify `src/lib/fetchers.ts`, `src/app/api/refresh/route.ts`, `src/app/api/refresh-ps/route.ts`

- [ ] **Step 1: itadPrices captures `url`**

In `src/lib/fetchers.ts`, `ItadDeal` + parse:

```ts
export interface ItadDeal {
  store: string;
  amount: number;
  cut: number;
  url: string;
}
```

In `itadPrices`, the deal push:

```ts
        if (store) deals.push({ store, amount: d.price.amount, cut: d.cut || 0, url: d.url ?? "" });
```

And the response type adds `url: string` to each deal:

```ts
      deals: Array<{ shop: { id: number }; price: { amount: number }; cut: number; url: string }>;
```

- [ ] **Step 2: refresh route writes url**

In `src/app/api/refresh/route.ts`, the `ops` collection and upsert:

```ts
  const ops: { slug: string; store: string; amount: number; original: number | null; cut: number | null; url: string }[] = [];
  // ... inside the deals loop:
        ops.push({ slug, store: d.store, amount: d.amount, original, cut: d.cut > 0 ? d.cut : null, url: d.url });
```

Upsert (game_prices) sets url:

```ts
    await sql!`
      INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, url, updated_at)
      VALUES (${o.slug}, ${o.store}, ${o.amount}, 'TRY', ${o.original}, ${o.cut}, ${o.url || null}, now())
      ON CONFLICT (slug, store) DO UPDATE
        SET amount = ${o.amount}, currency = 'TRY',
            original_amount = ${o.original}, discount_percent = ${o.cut},
            url = ${o.url || null}, updated_at = now()`;
```

- [ ] **Step 3: refresh-ps writes PS product url**

In `src/app/api/refresh-ps/route.ts`, `writePrice` signature + body gains url:

```ts
async function writePrice(slug: string, amount: number, cut: number, productId: string, today: string) {
  const original = cut > 0 ? Math.round((amount / (1 - cut / 100)) * 100) / 100 : null;
  const url = `https://store.playstation.com/tr-tr/product/${productId}`;
  await sql!`
    INSERT INTO game_prices (slug, store, amount, currency, original_amount, discount_percent, url, updated_at)
    VALUES (${slug}, 'playstation', ${amount}, 'TRY', ${original}, ${cut > 0 ? cut : null}, ${url}, now())
    ON CONFLICT (slug, store) DO UPDATE
      SET amount = ${amount}, currency = 'TRY',
          original_amount = ${original}, discount_percent = ${cut > 0 ? cut : null},
          url = ${url}, updated_at = now()`;
  await sql!`
    INSERT INTO price_history (slug, store, day, try_amount)
    VALUES (${slug}, 'playstation', ${today}, ${amount})
    ON CONFLICT (slug, store, day) DO UPDATE SET try_amount = ${amount}`;
}
```

Update both `writePrice(...)` call sites to pass the product id: in phase 1 it is `hit.productId`; in phase 2 it is the searched `hit.productId`. (Both `psSearch` results expose `productId`.)

- [ ] **Step 4: Verify build** — `npm run build`.
- [ ] **Step 5: Commit** — `git commit -am "feat: store URLs written on refresh (ITAD deal + PS product)"`

### Task 4: `/api/prices` serves url; `applyLive` carries it

**Files:** Modify `src/app/api/prices/route.ts`, `src/lib/live.ts`

- [ ] **Step 1: prices payload type + select**

In `src/app/api/prices/route.ts`, the price entry type adds `url`:

```ts
  prices: Record<string, Record<string, {
    amount: number;
    currency: string;
    originalAmount: number | null;
    discountPercent: number | null;
    url: string | null;
  }>>;
```

Select includes `url`; mapping sets it:

```ts
    const rows = await sql!`
      SELECT slug, store, amount, currency, original_amount, discount_percent, url, updated_at
      FROM game_prices`;
    // ...
      (prices[slug] ??= {})[store] = {
        amount: Number(r.amount),
        currency: r.currency as string,
        originalAmount: r.original_amount === null ? null : Number(r.original_amount),
        discountPercent: r.discount_percent === null ? null : Number(r.discount_percent),
        url: (r.url as string | null) ?? null,
      };
```

- [ ] **Step 2: applyLive copies url to Price**

In `src/lib/live.ts`, the `next` Price build:

```ts
      const next: Price = {
        store: store as StoreId,
        amount: p.amount,
        currency: p.currency === "USD" ? "USD" : "TRY",
        ...(p.originalAmount != null ? { originalAmount: p.originalAmount } : {}),
        ...(p.discountPercent != null ? { discountPercent: p.discountPercent } : {}),
        ...(p.url ? { url: p.url } : {}),
      };
```

- [ ] **Step 3: Verify build** — `npm run build`.
- [ ] **Step 4: Commit** — `git commit -am "feat: serve and apply store url in live prices"`

### Task 5: `providers.priceLoaded` flag

**Files:** Modify `src/components/providers.tsx`

- [ ] **Step 1: Add flag** — in the context interface add `priceLoaded: boolean;`. Add state `const [priceLoaded, setPriceLoaded] = useState(false);`. In the `/api/prices` effect, in the `finally`/after-apply path set `setPriceLoaded(true)` (both success and catch — loading is "done" either way). Provide `priceLoaded` in the context value.

```ts
  // inside the existing fetch effect, after try/catch resolves:
      } catch {
        // keep empty
      } finally {
        if (!cancelled) setPriceLoaded(true);
      }
```

(Convert the IIFE to set `priceLoaded` in a `finally`.)

- [ ] **Step 2: Verify build** — `npm run build`.
- [ ] **Step 3: Commit** — `git commit -am "feat: priceLoaded flag in app context"`

### Task 6: Strip demo prices; metadata-only catalog

**Files:** Modify `src/data/games.ts`, `tests/data.test.ts`

- [ ] **Step 1: Rewrite data.test for metadata**

`tests/data.test.ts` (replace price assertions):

```ts
import { describe, expect, it } from "vitest";
import { GAMES } from "@/data/games";

describe("catalog metadata", () => {
  it("has many games", () => expect(GAMES.length).toBeGreaterThanOrEqual(400));
  it("unique slugs", () => {
    const s = GAMES.map((g) => g.slug);
    expect(new Set(s).size).toBe(s.length);
  });
  it("scores in range and genres present", () => {
    for (const g of GAMES) {
      expect(g.score, g.slug).toBeGreaterThanOrEqual(0);
      expect(g.score, g.slug).toBeLessThanOrEqual(100);
      expect(g.genres.length, g.slug).toBeGreaterThan(0);
    }
  });
  it("no hardcoded prices remain (live-only)", () => {
    const withPrices = GAMES.filter((g) => g.prices.length > 0 && !g.unreleased);
    expect(withPrices, "released games must not ship demo prices").toHaveLength(0);
  });
});
```

- [ ] **Step 2: Make `makeGame` produce empty prices**

In `src/data/games.ts`, `makeGame` return — replace the computed `prices` with `prices: []`:

```ts
function makeGame(s: GameSpec): Game {
  return {
    id: String(s.appid),
    slug: s.slug,
    title: s.title,
    coverUrl: cover(s.appid),
    genres: s.genres,
    score: s.score,
    releaseYear: s.year,
    prices: [],
    subscriptions: s.subs,
  };
}
```

(The `GameSpec.usd/stores/disc` fields stay in the type but are unused now; leave them to avoid touching the big GENERATED list.)

- [ ] **Step 3: Strip hand-written `prices` arrays**

For every hand-written game object in `GAMES` (the ~120 before the GENERATED section), set `prices: []` — EXCEPT `unreleased` games (GTA VI keeps its prices array; they're never shown). Use a script:

```bash
node -e '
const fs=require("fs"); let s=fs.readFileSync("src/data/games.ts","utf8");
// blank every prices: [ ... ] that is NOT immediately preceded by unreleased:true on the prior line
s=s.replace(/prices: \[[\s\S]*?\],/g, (m, off, str)=>{
  const before = str.slice(Math.max(0,off-120), off);
  return /unreleased: true,/.test(before) ? m : "prices: [],";
});
fs.writeFileSync("src/data/games.ts", s);
console.log("stripped");
'
```

Then verify GTA VI still has its prices and others are empty:

```bash
grep -c "prices: \[\]," src/data/games.ts   # expect ~119
grep -A1 "unreleased: true" src/data/games.ts | grep -c "prices: \[ *$\|prices: \["  # GTA VI keeps non-empty
```

- [ ] **Step 4: Run tests** — `npm test`. Expected: `data.test` passes; `price/filters/sub-value` tests still pass (they build their own game objects with prices inline — verify; if any imports a real catalog game expecting prices, switch it to a constructed game). If `history.test`/`filters.test` use a catalog game's `prices`, update them to construct a game with prices.

- [ ] **Step 5: Commit** — `git commit -am "refactor: catalog is metadata-only (prices come live)"`

### Task 7: Shimmer + no-price + store-link UI

**Files:** Create `src/components/store-link.tsx`; Modify `src/components/{game-card,game-detail,billboard}.tsx`, `src/i18n/{tr,en}.ts`

- [ ] **Step 1: i18n keys** — add to both dictionaries:

```ts
  noPriceFound: "Fiyat bulunamadı",       // EN: "No price found"
  openInStore: "Mağazada aç",             // EN: "Open in store"
  loadingPrice: "Fiyat yükleniyor",       // EN: "Loading price"
```

- [ ] **Step 2: `store-link.tsx`**

```tsx
"use client";
import type { Game, Price } from "@/data/games";
import { storeUrl } from "@/lib/store-url";

export function StoreLink({
  game, price, className = "", children,
}: { game: Game; price: Price; className?: string; children: React.ReactNode }) {
  const url = storeUrl(game, price);
  if (!url) return <span className={className}>{children}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {children}
    </a>
  );
}
```

- [ ] **Step 3: game-card — loading / no-price / store-link**

In `src/components/game-card.tsx`, use `priceLoaded` from `useApp()`. Replace the cheapest block:

```tsx
  const { locale, t, priceLoaded } = useApp();
  const best = bestPrice(game);
  // ...
        <div className="mt-0.5 flex items-end justify-between gap-2">
          <SubBadges ids={game.subscriptions} />
          {game.unreleased ? (
            <span className="ml-auto text-xs font-semibold text-muted">{t.comingSoon}</span>
          ) : best ? (
            <span className="ml-auto flex shrink-0 flex-col items-end">
              <StoreLink game={game} price={best.price} className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted hover:text-fg">
                <StoreLogo id={best.price.store} size={12} /> {STORES[best.price.store].label} ↗
              </StoreLink>
              <PriceTag rp={best} locale={locale} size="sm" highlight />
            </span>
          ) : priceLoaded ? (
            <span className="ml-auto text-xs text-muted">{t.noPriceFound}</span>
          ) : (
            <span className="ml-auto h-4 w-16 animate-shimmer rounded" />
          )}
        </div>
```

Because the card root is a `<Link>`, the inner `<a>` (StoreLink) is a nested anchor — invalid. Fix: change the card root from `<Link>` to a `<div>` with an overlay `<Link>` for navigation, so the store `<a>` is a separate sibling. Concretely: card root `<div className="... relative">`, add `<Link href={'/oyun/'+game.slug} className="absolute inset-0 z-0" aria-label={game.title} />` as the first child, and give the price/store area `relative z-10`. The StoreLink keeps `stopPropagation`. (Repeat this de-nesting for the cover/title which were inside the Link — they're covered by the absolute overlay link.)

- [ ] **Step 4: game-detail — store-link rows + states**

In `src/components/game-detail.tsx`: wrap each price row's store label/value in `StoreLink game={game} price={rp.price}`. When not `unreleased` and `prices.length === 0`: show `priceLoaded ? t.noPriceFound : <shimmer>` instead of the list.

- [ ] **Step 5: billboard — store-link prices**

In `src/components/billboard.tsx`, wrap each store price row in `StoreLink`. If a billboard game has no live prices yet, the existing `prices.slice` is empty → guard with a shimmer line until `priceLoaded`.

- [ ] **Step 6: Verify** — `npm run build`; `npx eslint src`; dev: prices appear after load, store links open store in new tab, no-price state shows where applicable.

- [ ] **Step 7: Commit** — `git commit -am "feat: live-only price UI with store links, loading and no-price states"`

### Task 8: Re-seed prices with URLs

- [ ] **Step 1: Deploy P1** — `vercel deploy --prod --yes`.
- [ ] **Step 2: Run refresh from Vercel to populate url column** — call `/api/refresh` (with `Authorization: Bearer $CRON_SECRET`) once (FX + ITAD prices + storelow now write `url`). Then `/api/refresh-ps?seed=1` a few times to write PS urls.
- [ ] **Step 3: Verify** — `curl .../api/prices` shows `url` populated for sample games; detail page store links resolve.

---

## PHASE 2 — Rich detail page

### Task 9: `/api/game` — Steam media

**Files:** Create `src/app/api/game/route.ts`

- [ ] **Step 1: Implement** (cached in `game_meta`):

```ts
import { NextResponse } from "next/server";
import { sql, hasDb, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

interface GameExtra {
  description: string;
  screenshots: string[];
  tags: string[];
}

async function fromSteam(appid: string): Promise<GameExtra> {
  try {
    const res = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=tr&l=turkish&filters=basic,screenshots,genres,categories`,
      { headers: { "User-Agent": UA, Accept: "application/json" } }
    );
    if (!res.ok) return { description: "", screenshots: [], tags: [] };
    const d = await res.json();
    const data = d?.[appid]?.data ?? {};
    const desc = String(data.short_description ?? "").replace(/<[^>]+>/g, "").trim();
    const shots = ((data.screenshots ?? []) as Array<{ path_full: string }>)
      .slice(0, 8).map((s) => s.path_full);
    const tags = [
      ...((data.genres ?? []) as Array<{ description: string }>).map((g) => g.description),
    ].slice(0, 6);
    return { description: desc, screenshots: shots, tags };
  } catch {
    return { description: "", screenshots: [], tags: [] };
  }
}

export async function GET(req: Request) {
  const appid = new URL(req.url).searchParams.get("appid");
  if (!appid || !/^\d+$/.test(appid)) {
    return NextResponse.json({ description: "", screenshots: [], tags: [] } satisfies GameExtra);
  }
  if (!hasDb()) {
    return NextResponse.json(await fromSteam(appid), {
      headers: { "Cache-Control": "public, s-maxage=604800" },
    });
  }
  try {
    await ensureSchema();
    const rows = (await sql!`SELECT data FROM game_meta WHERE appid = ${appid}`) as { data: GameExtra }[];
    let extra: GameExtra;
    if (rows.length) {
      extra = rows[0].data;
    } else {
      extra = await fromSteam(appid);
      await sql!`
        INSERT INTO game_meta (appid, data, updated_at) VALUES (${appid}, ${JSON.stringify(extra)}, now())
        ON CONFLICT (appid) DO UPDATE SET data = ${JSON.stringify(extra)}, updated_at = now()`;
    }
    return NextResponse.json(extra, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" },
    });
  } catch {
    return NextResponse.json({ description: "", screenshots: [], tags: [] } satisfies GameExtra);
  }
}
```

- [ ] **Step 2: Verify** — `npm run build`; `curl 'localhost:3199/api/game?appid=1091500'` returns description + screenshots.
- [ ] **Step 3: Commit** — `git commit -am "feat: /api/game serves Steam screenshots, description, tags"`

### Task 10: `use-game-extra` hook + media/about components

**Files:** Create `src/hooks/use-game-extra.ts`, `src/components/game-media.tsx`, `src/components/game-about.tsx`; Modify `src/components/game-detail.tsx`, `src/i18n/{tr,en}.ts`

- [ ] **Step 1: i18n** — add `aboutGame: "Hakkında" / "About"`, `screenshotsLabel: "Ekran Görüntüleri" / "Screenshots"`.

- [ ] **Step 2: `use-game-extra.ts`**

```ts
"use client";
import { useEffect, useState } from "react";
interface GameExtra { description: string; screenshots: string[]; tags: string[]; }
export function useGameExtra(appid: string | null) {
  const [extra, setExtra] = useState<GameExtra>({ description: "", screenshots: [], tags: [] });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!appid || !/^\d+$/.test(appid)) { setReady(true); return; }
    let cancelled = false;
    fetch(`/api/game?appid=${appid}`).then((r) => r.json()).then((d) => {
      if (!cancelled) setExtra(d);
    }).catch(() => {}).finally(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, [appid]);
  return { extra, ready };
}
```

- [ ] **Step 3: `game-media.tsx`** — horizontal scroll row of screenshots (`next/image`, 16:9), click opens a fixed full-screen lightbox (`useState` selected index, Esc closes). Empty → render nothing. Use `src/components/skeleton.tsx` while `!ready`.

- [ ] **Step 4: `game-about.tsx`** — `description` paragraph + tag chips (reuse the squared chip style). Empty → render nothing.

- [ ] **Step 5: wire into `game-detail.tsx`** — `const { extra, ready } = useGameExtra(/^\d+$/.test(game.id) ? game.id : null);` Insert `<GameAbout extra={extra} ready={ready} />` and `<GameMedia screenshots={extra.screenshots} ready={ready} />` between the header section and the prices section. Hidden for `unreleased`/non-Steam games (empty extra).

- [ ] **Step 6: Verify** — `npm run build`; detail page shows screenshots + description + tags.
- [ ] **Step 7: Commit** — `git commit -am "feat: rich detail — screenshot gallery, description, tags"`

---

## PHASE 3 — Catalog → 1500+

### Task 11: Generate ~950 more games (metadata-only)

**Files:** Modify `src/data/games.ts` (append to GENERATED)

- [ ] **Step 1: Refresh existing id/slug lists**

```bash
grep -oE 'cover\(([0-9]+)\)|id: "([0-9]+)"|appid: ([0-9]+)' src/data/games.ts | grep -oE '[0-9]+' | sort -u > /tmp/existing_ids.txt
grep -oE 'slug: "[^"]+"' src/data/games.ts | sed 's/slug: "//; s/"//' | sort -u > /tmp/existing_slugs.txt
```

- [ ] **Step 2: Run the generator** (adapt `/tmp/gen2.py` — it already: pulls ITAD `deals/v2` trending, resolves `games/info/v2` for appid/title/tags→TR genres/score/year, verifies cover, dedupes). Raise the collection target and the `if len(out)>=350` cap to `>=950`, and paginate `deals/v2` further (offset up to ~6000). Run:

```bash
cd /tmp && python3 gen2.py    # uses curl (urllib is 403); writes /tmp/specs2.txt
wc -l /tmp/specs2.txt          # expect ~950
```

The emitted specs already match `GameSpec` shape (`appid, slug, title, genres, score, year, usd, stores, subs, disc`). `usd/stores/disc` are ignored by the new `makeGame` (prices:[]) but keep them so the spec array type stays valid.

- [ ] **Step 3: Insert into GENERATED** (before the closing `];` of the GENERATED array):

```bash
cd /Volumes/ProjectVault/hangisidahaucuz.com
python3 - <<'PY'
f="src/data/games.ts"; s=open(f).read()
specs=open("/tmp/specs2.txt").read().rstrip()+"\n"
marker="GAMES.push(...GENERATED.map(makeGame));"
i=s.index(marker); close=s.rindex("];", 0, i)
open(f,"w").write(s[:close]+specs+s[close:])
print("inserted")
PY
```

- [ ] **Step 4: Verify** — `npm test` (data.test: unique slugs, ≥400); `npm run build`. Game count:

```bash
npx tsx -e "import {GAMES} from './src/data/games'; console.log(GAMES.length)"   # ~1500
```

- [ ] **Step 5: Commit** — `git commit -am "feat: expand catalog to ~1500 games from ITAD (metadata-only)"`

### Task 12: Seed live prices for the expanded catalog

- [ ] **Step 1: Deploy** — `vercel deploy --prod --yes`.
- [ ] **Step 2: Seed ITAD** — call `/api/refresh` (Bearer CRON_SECRET) repeatedly until `lookedUp` reaches 0 (new appids get ITAD ids cached, then prices + lows + urls). Each call is idempotent.
- [ ] **Step 3: Seed PS** — call `/api/refresh-ps?seed=1` repeatedly (80/run) until `searchedUnmapped` is 0; PS is gentle (concurrency 3, 150ms) — many calls. Run from Vercel (PS blocks local IP).
- [ ] **Step 4: Verify** — `curl .../api/prices` shows a high `live games` count and sample new games have prices + urls.

---

## PHASE 4 — Premium polish

### Task 13: Savings badge + premium price badges

**Files:** Create `src/components/savings-badge.tsx`; Modify `src/components/{game-card,game-detail}.tsx`, `src/i18n/{tr,en}.ts`

- [ ] **Step 1: i18n** — `savingsPct: "tasarruf" / "off"` (already have `discount`; reuse or add `savings`).
- [ ] **Step 2: `savings-badge.tsx`** — given a `ResolvedPrice` with `tryOriginal`, render "%X tasarruf" with a premium gradient chip (reuse `discount-chip`). Hidden when no discount.
- [ ] **Step 3: Use it** — show on the detail cheapest row and on cards (top-right of cover) when discounted; ensure it doesn't overlap the watch button (place bottom-right or under price).
- [ ] **Step 4: Verify + commit** — `npm run build`; `git commit -am "feat: premium savings badge"`

### Task 14: Micro-interaction + typography polish (frontend-design)

**Files:** Modify components + `src/app/globals.css`

- [ ] **Step 1: Invoke `frontend-design:frontend-design`** and do a focused pass:
  - Buttons/links: consistent hover (scale/så color), focus-visible rings.
  - Cards: refine hover lift/shadow; image zoom easing.
  - Typography: unify heading sizes/weights/line-heights via a small scale; tighten section spacing; align price/label baselines.
  - Badges ("EN UCUZ", "Tarihî dip", savings): consistent radius/size/contrast.
  - Respect `prefers-reduced-motion`.
- [ ] **Step 2: Verify** — `npm run build`; `npx eslint src`; Playwright screenshots dark+light of home, detail (with media), browse, mobile; check both themes.
- [ ] **Step 3: Commit** — `git commit -am "polish: micro-interactions, typography, spacing pass"`

### Task 15: Final verification + deploy

- [ ] **Step 1: Full suite** — `npm test` (all green), `npm run build`, `npx eslint src` (clean).
- [ ] **Step 2: Visual + interaction (Playwright)** — store link opens new tab to store; detail screenshots/description/tags render; shimmer→price→no-price states; savings badge; GTA VI still "Çıkmadı"; pagination; ⌘K; hover trailer; both themes; mobile.
- [ ] **Step 3: Deploy + smoke** — `vercel deploy --prod --yes`; curl 200 on `/`, `/oyunlar`, `/ucretsiz`, `/abonelikler`, `/takip`, a detail page, `/api/prices`, `/api/game?appid=1091500`.

---

## Self-Review Notes

- **Spec coverage:** real-only data (T6 strip + T7 UI states), store links (T1 storeUrl, T3 write, T4 serve, T7 UI everywhere), priceLoaded (T5), DB (T2), rich detail (T9 api, T10 media/about), catalog 1500 (T11 gen, T12 seed), premium (T13 badges, T14 polish), verification (T8/T12 seeds, T15). All four spec phases mapped.
- **Type consistency:** `Price.url?` (T1) used in storeUrl/StoreLink/applyLive (T1/T4/T7); `ItadDeal.url` (T3); prices payload `url` (T4); `GameExtra {description,screenshots,tags}` consistent across T9/T10; `priceLoaded` (T5) used in T7.
- **Known judgment calls:** card anchor de-nesting (overlay Link + sibling store `<a>`) detailed in T7; generator volume bump in T11 reuses the proven gen2.py; component JSX for media/about/badges described with data contracts, built under frontend-design in T14.
- **No fake data guarantee:** T6 strips all hand-written + generated prices (prices:[]); only `unreleased` keeps a never-shown array; data.test enforces it.
