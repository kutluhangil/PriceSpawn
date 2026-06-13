# PriceSpawn v3 — Design Spec

**Date:** 2026-06-14
**Status:** Approved (user: "onaylıyorum başla")

## Goal

Fix two visual bugs (broken screenshot lightbox, blurry billboard covers), add Amazon Luna monthly free games, add a real Web-Push price-drop notification system on the existing wishlist, and run a "sharper / more premium" design pass.

## Context & Constraints

- Catalog metadata-only; prices live via `/api/prices` overlay. Wishlist (`/takip`) already stores `{slug, targetTRY}[]` in `localStorage` (`pricespawn-watch`) via `useWatchlist` + pure `src/lib/watchlist.ts`.
- Free games strip already renders `FreeOffer[]`; `FreePlatform` already includes `"prime"` (Prime Gaming, #00a8e1). Epic offers are live via `/api/free`.
- Neon Postgres + Vercel cron (`/api/refresh` 06:00, `/api/refresh-ps` 06:30). `web-push` not yet a dependency.
- Steam high-res asset `library_hero.jpg` (1920×620) exists at `store_item_assets/steam/apps/{appid}/library_hero.jpg`.
- Caveman mode for chat; code/commits normal.

---

## Phase 1 — Screenshot lightbox fix (bug)

**Root cause:** `GameMedia`'s lightbox `<div className="fixed inset-0 z-[110]">` is nested inside `<section className="reveal">`. `.reveal { animation: fade-up … both }` animates `transform`; with `fill: both` the element acts as a **containing block for fixed descendants**, so the overlay is clipped to the section box instead of the viewport — the modal overlaps the price section below (observed).

**Fix:** Render the lightbox through a **React Portal to `document.body`** so it escapes all transformed ancestors. Rebuild it as a proper modal:
- Full-viewport dark backdrop (`bg-black/90`), click-outside closes.
- Centered image (`object-contain`, ~`90vw`/`85vh`).
- **Visible prev/next arrow buttons** (left/right), plus existing keyboard ←/→/Esc.
- Image counter "`{i+1} / {n}`".
- Lock body scroll while open (`document.body.style.overflow = "hidden"`, restored on close).
- Guard `typeof document !== "undefined"` for SSR.

**Acceptance:** Clicking any screenshot opens a true full-screen modal over everything (price section dimmed beneath); arrows + keys cycle images; counter correct; Esc/click-outside/✕ close; scroll locked. No overlap with "Tüm Fiyatlar".

---

## Phase 2 — Sharp billboard / covers (bug)

**Root cause:** `Billboard` calls `<CoverImage src={bigCover(...)} …>` **without a `sizes` prop**, so `CoverImage`'s default `sizes` (`…280px`) makes `next/image` serve a ~280px-wide image into a ~745px slot → upscaled/blurry. Source `capsule_616x353.jpg` is also smaller than the slot.

**Fix:**
- `bigCover()` (in `billboard.tsx`) upgrades Steam `header.jpg` → **`library_hero.jpg`** (1920×620) for crisp wide art.
- Pass `sizes="(max-width: 768px) 100vw, 760px"` to the billboard's `CoverImage`.
- Add an optional `quality` prop to `CoverImage` (default keep next/image default 75); billboard uses `quality={90}`.
- Keep grid cards on `header.jpg`/`capsule` with their existing 280px sizes (already sharp at that size).

**Acceptance:** Billboard art renders crisp (no blur) at desktop and mobile widths; network shows a large (~760px+) optimized image, not 280px.

---

## Phase 3 — Amazon Luna monthly free games

Amazon Luna gives Prime members ~15 keep-forever PC games monthly, **claimable in Turkey** (only cloud streaming is geo-locked). No clean API → curated monthly list.

**Data:** `src/data/luna.ts`
```ts
export interface LunaFreeGame {
  title: string;
  claimStore: "epic" | "gog" | "amazon";
  coverUrl: string;   // Steam header when known, else "" (gradient fallback)
  claimUrl: string;   // luna.amazon.com/claims (or store page)
  validUntil: string; // ISO date
}
export const LUNA_MONTH = "2026-06";
export const LUNA_FREE: LunaFreeGame[] = [ /* June 2026 list, 15 titles */ ];
```
**Lib:** `src/lib/luna.ts` → `activeLunaGames(now: Date): LunaFreeGame[]` (drop entries past `validUntil`); unit-tested.

**Display:** Map Luna games to `FreeOffer` (`platform: "prime"`, `url: claimUrl`) and **append to `useFreeGames()` output** so both the home "Şu An Ücretsiz" strip and `/ucretsiz` show them with the existing `FreeCard` (Prime Gaming badge) alongside live Epic offers. `freeUntil = validUntil`, `normalTRY = 0` (claim value not priced).

**Acceptance:** Home strip + `/ucretsiz` show active Luna games (Prime Gaming badge) next to Epic; expired entries hidden; clicking opens the claim URL.

---

## Phase 4 — Wishlist + real Web-Push price-drop notifications ⭐

Enhance the existing `/takip` wishlist with opt-in background push notifications (work even when the site is closed). Wishlist data stays local; only an anonymous push subscription + its watch targets live server-side to enable delivery.

### Components & flow
- **Service worker** `public/sw.js` (plain JS, served statically):
  - `push` event → `self.registration.showNotification(title, { body, icon: "/icon-192.png", data: { url } })`.
  - `notificationclick` → focus an existing tab or `clients.openWindow(url)`.
- **VAPID** via `web-push` dependency. Keys in env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:`). Added to `.env.local` + Vercel (production).
- **Client manager** `src/hooks/use-push.ts` + a button in `watch-content.tsx` ("🔔 Fiyat düşünce bildir"):
  - Register `/sw.js`; on enable, request `Notification.requestPermission()`; if granted, `reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) })`.
  - POST `/api/push/subscribe` `{ subscription, watches: [{slug, targetTRY}] }`.
  - Re-sync watches whenever the wishlist changes (while enabled).
  - "Disable" → `subscription.unsubscribe()` + POST `/api/push/unsubscribe { endpoint }`.
- **Cache-clear warning popup** `src/components/storage-notice.tsx`: a one-time modal shown when the user first enables notifications (or first adds to wishlist), text: list is stored locally in this browser; clearing browser data deletes it and stops notifications. Dismissed flag in `localStorage` (`pricespawn-storage-notice`).

### Server
- **DB** (extend `ensureSchema`):
  ```sql
  CREATE TABLE IF NOT EXISTS push_subs (
    endpoint text PRIMARY KEY, p256dh text NOT NULL, auth text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE IF NOT EXISTS push_watches (
    endpoint text NOT NULL, slug text NOT NULL, target_try numeric,
    last_notified_day date, PRIMARY KEY (endpoint, slug));
  ```
- **`POST /api/push/subscribe`**: upsert `push_subs`; replace that endpoint's `push_watches` with the posted list (delete missing, upsert present, preserving `last_notified_day`).
- **`POST /api/push/unsubscribe`**: delete sub + its watches by endpoint.
- **`GET /api/notify`** (CRON_SECRET-protected): load `fx_rate`; join `push_watches` + `push_subs`; for each watch with a non-null `target_try`, compute current best TRY from `game_prices` (USD rows × fx) for that slug; if `best ≤ target_try` and `last_notified_day` ≠ today → `webpush.sendNotification(sub, payload)`; on success set `last_notified_day = today`. On `404/410` → delete the sub + its watches. Returns counts `{checked, sent, expired}`.
- **Cron**: add `{ "path": "/api/notify", "schedule": "0 7 * * *" }` to `vercel.json` (after refresh + refresh-ps).
- **Icon**: add `public/icon-192.png` (192×192 brand icon) for notifications.

### Privacy / degradation
- No login. Subscription is an opaque push endpoint. Removing permission / clearing data orphans the server row; it is GC'd when a push returns 410.
- If permission denied or push unsupported (Safari iOS limited), the wishlist still works locally (no push) — button shows unavailable.

**Acceptance:** Enabling notifications registers the SW, stores a subscription, and syncs watches. Setting a target above the live price and running `/api/notify` (or the cron) delivers a real Chrome notification that deep-links to the game. Unsubscribe removes server rows. Cache-clear popup shows once. Wishlist works without notifications.

---

## Phase 5 — Premium sharpness design pass

Make the UI read sharper and more premium (user: "buğulu değil, keskin"):
- **Reduce background softness:** lower aurora/`app-bg` blur + ambient opacity so foreground pops.
- **Crisper surfaces:** stronger panel borders/rings (raise `--border` contrast), tighter shadow definition.
- **Typography:** tighten display headings (weight/letter-spacing), increase body contrast (`--bright`/`--muted` separation).
- **Image quality:** ensure `next/image` covers aren't soft — already addressed for billboard (Phase 2); spot-check rails.

Scope: targeted edits to `src/app/globals.css` (CSS variables + the aurora/app-bg/panel rules) and a couple of components; no structural redesign. Validate by build + visual check on home + detail + browse at desktop and mobile.

**Acceptance:** Side-by-side, surfaces and type look crisper/higher-contrast; background no longer muddies foreground; no regressions in dark/light themes.

---

## Phase 6 — Verification + deploy

`npm test` (new luna + push pure-fn tests green), `npm run build`, deploy `vercel --prod`, add VAPID env vars to Vercel, verify `/api/notify` cron + an end-to-end push, confirm Luna strip + sharp billboard + working lightbox on the live URL. Update project-state memory.

---

## Out of Scope
- Login/accounts (push stays anonymous).
- Per-game Luna pricing (claim value not priced).
- iOS Safari background push (platform-limited; degrades to local-only).

## Testing
- Pure fns unit-tested: `activeLunaGames` (status by date), `urlBase64ToUint8Array` round-trip, best-TRY computation helper used by `/api/notify` (extract to a pure `src/lib/best-live.ts` and test).
- `tests/data.test.ts` unchanged.
- Manual: lightbox interaction, billboard sharpness (network panel), Luna strip, full push round-trip (subscribe → /api/notify → notification), cache popup once, mobile pass.
- Full `npm test` green before finishing.

## Rollout Order
1 → 2 → 3 → 5 (quick wins / visual) → 4 (push, largest) → 6 (deploy + env + e2e push).
