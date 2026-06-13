# PriceSpawn v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the screenshot lightbox + blurry billboard, add Amazon Luna monthly free games, add real Web-Push price-drop notifications to the wishlist, and run a premium-sharpness design pass.

**Architecture:** Lightbox moves to a `document.body` portal to escape a transformed ancestor. Billboard uses Steam `library_hero.jpg` with correct `sizes`. Luna is curated data appended to the live free-games hook. Web Push = service worker + VAPID (`web-push`) + Neon tables + `/api/push/*` routes + a `/api/notify` cron. Premium pass = targeted CSS-variable edits.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, React 19 (`createPortal`), Vitest, Neon Postgres, `web-push`, Web Push API / Service Worker.

**Spec:** `docs/superpowers/specs/2026-06-14-pricespawn-v3-design.md`

---

## Task 1: Screenshot lightbox — portal + arrows

**Files:**
- Modify: `src/components/game-media.tsx`

- [ ] **Step 1: Rewrite GameMedia** to render the lightbox via a portal with visible arrows, counter, and scroll lock:

```tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Skeleton } from "@/components/skeleton";
import { useApp } from "@/components/providers";

export function GameMedia({ screenshots, ready }: { screenshots: string[]; ready: boolean }) {
  const { t } = useApp();
  const [open, setOpen] = useState<number | null>(null);
  const n = screenshots.length;

  const close = () => setOpen(null);
  const go = (d: number) => setOpen((i) => (i === null ? null : (i + d + n) % n));

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, n]);

  if (!ready) {
    return (
      <section className="mt-8">
        <Skeleton className="aspect-[16/6] w-full rounded-[var(--radius-card)]" />
      </section>
    );
  }
  if (n === 0) return null;

  const lightbox =
    open !== null && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition-colors hover:bg-white/25 sm:left-6 cursor-pointer"
            >
              ‹
            </button>
            <div className="relative h-[85vh] w-[92vw] max-w-6xl" onClick={(e) => e.stopPropagation()}>
              <Image src={screenshots[open]} alt="" fill sizes="92vw" className="object-contain" priority />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); go(1); }}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition-colors hover:bg-white/25 sm:right-6 cursor-pointer"
            >
              ›
            </button>
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white">
              {open + 1} / {n}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); close(); }}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur hover:bg-white/25 cursor-pointer"
            >
              ✕
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="reveal mt-8">
      <h2 className="font-display mb-4 text-lg font-bold text-bright">{t.screenshotsLabel}</h2>
      <div className="row-scroll -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
        {screenshots.map((src, i) => (
          <button
            key={src}
            onClick={() => setOpen(i)}
            className="relative aspect-[16/9] w-[300px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border border-border transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Image src={src} alt="" fill sizes="300px" className="object-cover" />
          </button>
        ))}
      </div>
      {lightbox}
    </section>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npx eslint src/components/game-media.tsx`
Expected: no errors

- [ ] **Step 3: Manual verify**

Run: `npm run dev`, open a game detail with screenshots (e.g. `/oyun/ultimate-fishing-simulator`), click a screenshot. Confirm: full-screen overlay covers the price section (dimmed beneath), ‹ › buttons + arrow keys cycle, counter shows "i / n", Esc / click-outside / ✕ close, page scroll locked while open.

- [ ] **Step 4: Commit**

```bash
git add src/components/game-media.tsx
git commit -m "fix(detail): render screenshot lightbox in a body portal with arrows + counter"
```

---

## Task 2: Sharp billboard covers

**Files:**
- Modify: `src/components/cover-image.tsx`
- Modify: `src/components/billboard.tsx`

- [ ] **Step 1: Add a `quality` prop to CoverImage.** In `src/components/cover-image.tsx`, update the signature and the `<Image>`:

```tsx
export function CoverImage({
  src,
  title,
  className = "",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px",
  quality,
}: {
  src: string;
  title: string;
  className?: string;
  sizes?: string;
  quality?: number;
}) {
```

and add `quality={quality}` to the `<Image>` element (next/image accepts `undefined` → default):

```tsx
      <Image
        src={src}
        alt={title}
        fill
        sizes={sizes}
        quality={quality}
        unoptimized={src.endsWith(".webm")}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        className={`object-cover transition-opacity duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
```

- [ ] **Step 2: Use library_hero + sizes + quality in Billboard.** In `src/components/billboard.tsx`, change `bigCover` and the billboard `CoverImage`:

```tsx
/** Upgrade a Steam header.jpg to the large, sharp wide hero art when possible. */
function bigCover(url: string): string {
  return /\/apps\/\d+\/header\.jpg$/.test(url)
    ? url.replace(/header\.jpg$/, "library_hero.jpg")
    : url;
}
```

and the `<CoverImage>` inside the billboard `<Link>`:

```tsx
          <CoverImage
            key={game.slug}
            src={bigCover(game.coverUrl)}
            title={game.title}
            sizes="(max-width: 768px) 100vw, 760px"
            quality={90}
            className="billboard-fade h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
```

- [ ] **Step 3: Verify library_hero exists for billboard games + build**

Run: `npm run build`
Expected: build succeeds. Then `npm run dev`, open home, open DevTools Network, filter Img — confirm the billboard image request is a large (≥760px) `_next/image` URL and renders crisp. If a specific game lacks `library_hero.jpg` (404), `CoverImage`'s `onError` falls back to the gradient — acceptable.

- [ ] **Step 4: Commit**

```bash
git add src/components/cover-image.tsx src/components/billboard.tsx
git commit -m "fix(home): sharp billboard via library_hero + correct sizes + quality"
```

---

## Task 3: Amazon Luna data + active-filter library

**Files:**
- Create: `src/data/luna.ts`
- Create: `src/lib/luna.ts`
- Test: `tests/luna.test.ts`

- [ ] **Step 1: Create** `src/data/luna.ts` (June 2026 lineup, 15 titles; `coverUrl: ""` → gradient fallback shows the title):

```ts
export interface LunaFreeGame {
  title: string;
  claimStore: "epic" | "gog" | "amazon";
  coverUrl: string; // Steam header when known, else "" (gradient fallback)
  claimUrl: string;
  validUntil: string; // ISO date (inclusive)
}

export const LUNA_MONTH = "2026-06";

const CLAIM = "https://luna.amazon.com/claims";
const END = "2026-06-30";

export const LUNA_FREE: LunaFreeGame[] = [
  { title: "Tomb Raider IV-VI Remastered", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "G.I. Joe: Wrath of Cobra", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Space Grunts: Chrono Shard", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Please Touch the Artwork", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Mafia III: Definitive Edition", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "XCOM: Chimera Squad", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Tested on Humans: Escape Room", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Sin Slayers: Reign of the 8th", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Paradise Killer", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Between Time: Escape Room", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Sugardew Island", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Wargame Construction Set III: Age of Rifles", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Space Grunts 2", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Terraforming Mars", claimStore: "amazon", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Lost Eidolons: Veil of the Witch", claimStore: "amazon", coverUrl: "", claimUrl: CLAIM, validUntil: END },
];
```

- [ ] **Step 2: Write the failing test** `tests/luna.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { activeLunaGames } from "@/lib/luna";
import type { LunaFreeGame } from "@/data/luna";

const g = (validUntil: string): LunaFreeGame => ({
  title: "X", claimStore: "gog", coverUrl: "", claimUrl: "u", validUntil,
});

describe("activeLunaGames", () => {
  it("keeps games whose validUntil is today or later", () => {
    const r = activeLunaGames([g("2026-06-30")], new Date("2026-06-14T12:00:00Z"));
    expect(r).toHaveLength(1);
  });
  it("drops games past validUntil", () => {
    const r = activeLunaGames([g("2026-06-13")], new Date("2026-06-14T12:00:00Z"));
    expect(r).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `npm test -- luna`
Expected: FAIL ("Cannot find module '@/lib/luna'")

- [ ] **Step 4: Implement** `src/lib/luna.ts`:

```ts
import type { LunaFreeGame } from "@/data/luna";

export function activeLunaGames(games: LunaFreeGame[], now: Date): LunaFreeGame[] {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return games.filter((g) => Date.parse(`${g.validUntil}T23:59:59Z`) >= today);
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `npm test -- luna`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/luna.ts src/lib/luna.ts tests/luna.test.ts
git commit -m "feat(free): curated Amazon Luna monthly free games data + active filter"
```

---

## Task 4: Wire Luna into the free-games strip

**Files:**
- Modify: `src/hooks/use-free-games.ts`

- [ ] **Step 1: Append Luna offers** to the live Epic offers. Replace `src/hooks/use-free-games.ts` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { FreeOffer } from "@/data/free";
import { LUNA_FREE } from "@/data/luna";
import { activeLunaGames } from "@/lib/luna";

interface EpicFree {
  title: string;
  image: string;
  originalTRY: number;
  freeUntil: string;
  url: string;
}

function lunaOffers(): FreeOffer[] {
  return activeLunaGames(LUNA_FREE, new Date()).map((g) => ({
    title: g.title,
    coverUrl: g.coverUrl,
    platform: "prime",
    freeUntil: g.validUntil,
    normalTRY: 0,
    url: g.claimUrl,
  }));
}

/** Live Epic free games (Türkiye) + curated Amazon Luna monthly games. */
export function useFreeGames() {
  const [offers, setOffers] = useState<FreeOffer[]>(lunaOffers());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/free");
        const data = await res.json();
        if (cancelled) return;
        const epic: FreeOffer[] = (data.offers as EpicFree[]).map((e) => ({
          title: e.title,
          coverUrl: e.image,
          platform: "epic",
          freeUntil: e.freeUntil,
          normalTRY: e.originalTRY || 0,
          url: e.url,
        }));
        setOffers([...epic, ...lunaOffers()]);
      } catch {
        // keep Luna-only offers
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { offers, ready };
}
```

- [ ] **Step 2: Typecheck + lint + build**

Run: `npx tsc --noEmit && npx eslint src/hooks/use-free-games.ts && npm run build`
Expected: no errors

- [ ] **Step 3: Manual verify**

Run: `npm run dev`, open home + `/ucretsiz`. Confirm Luna games appear with a "Prime Gaming" badge (cyan) alongside Epic; clicking opens `luna.amazon.com/claims`.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-free-games.ts
git commit -m "feat(free): show Amazon Luna monthly games in the free strip (home + /ucretsiz)"
```

---

## Task 5: Premium sharpness CSS pass

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Sharpen surfaces + reduce background softness.** In `src/app/globals.css`, in `:root[data-theme="dark"]` change these vars:

```css
  --border: rgba(255, 255, 255, 0.14);
  --ambient-opacity: 0.26;
  --bg-glow-1: rgba(109, 40, 217, 0.16);
  --bg-glow-2: rgba(8, 145, 178, 0.13);
  --bg-glow-3: rgba(219, 39, 119, 0.1);
  --noise-opacity: 0.04;
```

and in `:root[data-theme="light"]` change:

```css
  --border: rgba(28, 30, 38, 0.14);
  --ambient-opacity: 0.12;
```

- [ ] **Step 2: Reduce aurora blur** (sharper search ring). Change `.aurora::before` blur from `14px` to `10px`:

```css
.aurora::before {
  filter: blur(10px);
  opacity: 0.55;
}
```

- [ ] **Step 3: Tighten display headings.** Append to `src/app/globals.css`:

```css
/* ── Premium keskinlik ────────────────────────────────────────────── */
.font-display {
  letter-spacing: -0.018em;
}

.panel-strong {
  box-shadow: var(--shadow);
}
```

- [ ] **Step 4: Build + visual check**

Run: `npm run build`
Expected: build succeeds. Then `npm run dev`, compare home/detail/browse before-after at desktop + mobile, and toggle dark/light: surfaces/borders crisper, background less muddy, headings tighter. No broken layout.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "style: premium sharpness pass — crisper borders, less background blur, tighter headings"
```

---

## Task 6: Web-Push foundation — dependency, VAPID, service worker

**Files:**
- Modify: `package.json` (via npm)
- Create: `public/sw.js`
- Create: `public/icon-192.png`
- Modify: `.env.local` (local secrets, gitignored)

- [ ] **Step 1: Install web-push**

Run: `npm install web-push && npm install -D @types/web-push`
Expected: added to `package.json` dependencies / devDependencies.

- [ ] **Step 2: Generate VAPID keys**

Run: `npx web-push generate-vapid-keys --json`
Expected: prints `{ "publicKey": "...", "privateKey": "..." }`. Copy both.

- [ ] **Step 3: Add VAPID env to `.env.local`** (append; do NOT commit — `.env.local` is gitignored):

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey from step 2>
VAPID_PRIVATE_KEY=<privateKey from step 2>
VAPID_SUBJECT=mailto:kutluhangul@windowslive.com
```

- [ ] **Step 4: Create the service worker** `public/sw.js`:

```js
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || "PriceSpawn";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});
```

- [ ] **Step 5: Create a notification icon** `public/icon-192.png` (192×192). Generate a simple branded PNG:

```bash
python3 - <<'PY'
import struct, zlib
W=H=192
# spectrum-ish purple background with a white "P" block
px=bytearray()
for y in range(H):
    px.append(0)  # filter byte per row
    for x in range(W):
        r=int(80+120*x/W); g=int(60+40*y/H); b=int(200-60*x/W)
        # white rounded square in center
        if 56<=x<136 and 40<=y<152 and (x<72 or (y<88) or (88<=y<104)):
            r=g=b=245
        px+=bytes((r,g,b))
def chunk(t,d):
    c=t+d; return struct.pack(">I",len(d))+c+struct.pack(">I",zlib.crc32(c)&0xffffffff)
sig=b"\x89PNG\r\n\x1a\n"
ihdr=struct.pack(">IIBBBBB",W,H,8,2,0,0,0)
idat=zlib.compress(bytes(px),9)
open("public/icon-192.png","wb").write(sig+chunk(b"IHDR",ihdr)+chunk(b"IDAT",idat)+chunk(b"IEND",b""))
print("wrote public/icon-192.png")
PY
```
Expected: `wrote public/icon-192.png` (a valid 192×192 PNG). Verify: `file public/icon-192.png` → "PNG image data, 192 x 192".

- [ ] **Step 6: Commit** (sw + icon only; `.env.local` is gitignored)

```bash
git add package.json package-lock.json public/sw.js public/icon-192.png
git commit -m "feat(push): add web-push dep, service worker, notification icon"
```

---

## Task 7: Push DB schema + subscribe/unsubscribe API

**Files:**
- Modify: `src/lib/db.ts`
- Create: `src/app/api/push/subscribe/route.ts`
- Create: `src/app/api/push/unsubscribe/route.ts`

- [ ] **Step 1: Extend `ensureSchema`** in `src/lib/db.ts` — add before the closing `}` of the function:

```ts
  // Web Push subscriptions + their watched price targets
  await sql`
    CREATE TABLE IF NOT EXISTS push_subs (
      endpoint   text PRIMARY KEY,
      p256dh     text NOT NULL,
      auth       text NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS push_watches (
      endpoint         text NOT NULL,
      slug             text NOT NULL,
      target_try       numeric,
      last_notified_day date,
      PRIMARY KEY (endpoint, slug)
    )`;
```

- [ ] **Step 2: Create** `src/app/api/push/subscribe/route.ts`:

```ts
import { NextResponse } from "next/server";
import { sql, ensureSchema, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface Body {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  watches: { slug: string; targetTRY: number | null }[];
}

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "bad subscription" }, { status: 400 });
  }
  await ensureSchema();

  await sql!`
    INSERT INTO push_subs (endpoint, p256dh, auth, updated_at)
    VALUES (${sub.endpoint}, ${sub.keys.p256dh}, ${sub.keys.auth}, now())
    ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = ${sub.keys.p256dh}, auth = ${sub.keys.auth}, updated_at = now()`;

  const watches = Array.isArray(body.watches) ? body.watches : [];
  const slugs = watches.map((w) => w.slug);
  // Remove watches no longer in the list (preserve last_notified_day for kept ones).
  if (slugs.length) {
    await sql!`DELETE FROM push_watches WHERE endpoint = ${sub.endpoint} AND slug <> ALL(${slugs})`;
  } else {
    await sql!`DELETE FROM push_watches WHERE endpoint = ${sub.endpoint}`;
  }
  for (const w of watches) {
    await sql!`
      INSERT INTO push_watches (endpoint, slug, target_try)
      VALUES (${sub.endpoint}, ${w.slug}, ${w.targetTRY})
      ON CONFLICT (endpoint, slug) DO UPDATE SET target_try = ${w.targetTRY}`;
  }
  return NextResponse.json({ ok: true, watches: watches.length });
}
```

- [ ] **Step 3: Create** `src/app/api/push/unsubscribe/route.ts`:

```ts
import { NextResponse } from "next/server";
import { sql, hasDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  let endpoint: string | undefined;
  try { endpoint = (await req.json()).endpoint; } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }
  if (!endpoint) return NextResponse.json({ error: "no endpoint" }, { status: 400 });
  await sql!`DELETE FROM push_watches WHERE endpoint = ${endpoint}`;
  await sql!`DELETE FROM push_subs WHERE endpoint = ${endpoint}`;
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; both routes appear as `ƒ` (dynamic) in the build output.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts src/app/api/push/subscribe/route.ts src/app/api/push/unsubscribe/route.ts
git commit -m "feat(push): push_subs/push_watches schema + subscribe/unsubscribe API"
```

---

## Task 8: Notify cron + best-live helper

**Files:**
- Create: `src/lib/best-live.ts`
- Test: `tests/best-live.test.ts`
- Create: `src/app/api/notify/route.ts`
- Modify: `vercel.json`

- [ ] **Step 1: Write the failing test** `tests/best-live.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bestLiveTRY } from "@/lib/best-live";

describe("bestLiveTRY", () => {
  it("returns the minimum TRY across stores", () => {
    expect(bestLiveTRY([{ amount: 100, currency: "TRY" }, { amount: 80, currency: "TRY" }], 40)).toBe(80);
  });
  it("converts USD rows with the fx rate", () => {
    expect(bestLiveTRY([{ amount: 3, currency: "USD" }], 40)).toBe(120);
  });
  it("returns null for no rows", () => {
    expect(bestLiveTRY([], 40)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- best-live`
Expected: FAIL ("Cannot find module '@/lib/best-live'")

- [ ] **Step 3: Implement** `src/lib/best-live.ts`:

```ts
export function bestLiveTRY(rows: { amount: number; currency: string }[], fx: number): number | null {
  if (!rows.length) return null;
  return Math.min(...rows.map((r) => (r.currency === "USD" ? r.amount * fx : r.amount)));
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `npm test -- best-live`
Expected: PASS

- [ ] **Step 5: Create** `src/app/api/notify/route.ts`:

```ts
import { NextResponse } from "next/server";
import webpush from "web-push";
import { sql, ensureSchema, hasDb } from "@/lib/db";
import { bestLiveTRY } from "@/lib/best-live";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!hasDb()) return NextResponse.json({ error: "no database" }, { status: 503 });
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@pricespawn.com";
  if (!pub || !priv) return NextResponse.json({ error: "no vapid keys" }, { status: 503 });
  webpush.setVapidDetails(subject, pub, priv);

  await ensureSchema();
  const today = new Date().toISOString().slice(0, 10);

  const fxRows = (await sql!`SELECT rate FROM fx_rate WHERE base = 'USD_TRY' LIMIT 1`) as { rate: number }[];
  const fx = fxRows.length ? Number(fxRows[0].rate) : 1;

  const watches = (await sql!`
    SELECT w.endpoint, w.slug, w.target_try, w.last_notified_day,
           s.p256dh, s.auth
    FROM push_watches w
    JOIN push_subs s ON s.endpoint = w.endpoint
    WHERE w.target_try IS NOT NULL`) as {
    endpoint: string; slug: string; target_try: number; last_notified_day: string | null;
    p256dh: string; auth: string;
  }[];

  let sent = 0, expired = 0;
  for (const w of watches) {
    if (w.last_notified_day && String(w.last_notified_day).slice(0, 10) === today) continue;
    const priceRows = (await sql!`
      SELECT amount, currency FROM game_prices WHERE slug = ${w.slug}`) as { amount: number; currency: string }[];
    const best = bestLiveTRY(priceRows.map((r) => ({ amount: Number(r.amount), currency: r.currency })), fx);
    if (best === null || best > Number(w.target_try)) continue;

    const payload = JSON.stringify({
      title: "Fiyat düştü! 🎯",
      body: `${w.slug} hedef fiyatına ulaştı: ₺${best.toFixed(2)}`,
      url: `/oyun/${w.slug}`,
    });
    try {
      await webpush.sendNotification(
        { endpoint: w.endpoint, keys: { p256dh: w.p256dh, auth: w.auth } },
        payload
      );
      sent++;
      await sql!`UPDATE push_watches SET last_notified_day = ${today} WHERE endpoint = ${w.endpoint} AND slug = ${w.slug}`;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        expired++;
        await sql!`DELETE FROM push_watches WHERE endpoint = ${w.endpoint}`;
        await sql!`DELETE FROM push_subs WHERE endpoint = ${w.endpoint}`;
      }
    }
  }
  return NextResponse.json({ ok: true, checked: watches.length, sent, expired, at: new Date().toISOString() });
}
```

- [ ] **Step 6: Add the cron** to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/refresh", "schedule": "0 6 * * *" },
    { "path": "/api/refresh-ps", "schedule": "30 6 * * *" },
    { "path": "/api/notify", "schedule": "0 7 * * *" }
  ]
}
```

- [ ] **Step 7: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors; `/api/notify` shows as `ƒ`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/best-live.ts tests/best-live.test.ts src/app/api/notify/route.ts vercel.json
git commit -m "feat(push): /api/notify cron sends price-drop pushes + best-live helper"
```

---

## Task 9: Client push hook + wishlist button + cache-notice popup

**Files:**
- Create: `src/lib/push-client.ts`
- Create: `src/hooks/use-push.ts`
- Create: `src/components/storage-notice.tsx`
- Modify: `src/components/watch-content.tsx`
- Modify: `src/i18n/tr.ts`, `src/i18n/en.ts`

- [ ] **Step 1: Create** `src/lib/push-client.ts` (pure helper, unit-testable):

```ts
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}
```

- [ ] **Step 2: Create** `src/hooks/use-push.ts`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import type { WatchItem } from "@/lib/watchlist";
import { urlBase64ToUint8Array, pushSupported } from "@/lib/push-client";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

async function getReg(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing ?? (await navigator.serviceWorker.register("/sw.js"));
}

export function usePush(list: WatchItem[]) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(pushSupported());
    if (!pushSupported()) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(!!sub && Notification.permission === "granted");
    });
  }, []);

  const sync = useCallback(async (watches: WatchItem[]) => {
    if (!pushSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return;
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), watches }),
    });
  }, []);

  const enable = useCallback(async () => {
    if (!pushSupported() || !PUBLIC_KEY) return false;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;
    const reg = await getReg();
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      }));
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), watches: list }),
    });
    setEnabled(true);
    return true;
  }, [list]);

  const disable = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setEnabled(false);
  }, []);

  // Keep server watches in sync whenever the wishlist changes while enabled.
  useEffect(() => {
    if (enabled) sync(list);
  }, [list, enabled, sync]);

  return { enabled, supported, enable, disable };
}
```

- [ ] **Step 3: Create** `src/components/storage-notice.tsx` (one-time popup):

```tsx
"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";

const KEY = "pricespawn-storage-notice";

export function StorageNotice({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { t } = useApp();
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(localStorage.getItem(KEY) === "1");
  }, []);

  if (!show || seen) return null;

  const dismiss = () => {
    try { localStorage.setItem(KEY, "1"); } catch {}
    setSeen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={dismiss}>
      <div className="panel-strong w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display mb-2 text-lg font-bold text-bright">{t.storageNoticeTitle}</h3>
        <p className="mb-5 text-sm text-muted">{t.storageNoticeBody}</p>
        <button
          onClick={dismiss}
          className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] cursor-pointer"
        >
          {t.storageNoticeOk}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add i18n keys.** In `src/i18n/tr.ts` (near other watch keys):

```ts
  notifyEnable: "Fiyat düşünce bildir",
  notifyOn: "Bildirim açık",
  notifyUnsupported: "Tarayıcı bildirimi desteklemiyor",
  storageNoticeTitle: "İstek listen bu tarayıcıda saklanır",
  storageNoticeBody:
    "Listen ve hedef fiyatların yalnızca bu tarayıcıda yerel olarak tutulur. Tarayıcı verilerini (önbellek) silersen liste kaybolur ve bildirimler durur. Hesap gerekmez.",
  storageNoticeOk: "Anladım",
```

In `src/i18n/en.ts`:

```ts
  notifyEnable: "Notify on price drop",
  notifyOn: "Notifications on",
  notifyUnsupported: "Browser doesn't support notifications",
  storageNoticeTitle: "Your wishlist is stored in this browser",
  storageNoticeBody:
    "Your list and target prices are kept locally in this browser only. Clearing your browser data (cache) deletes the list and stops notifications. No account needed.",
  storageNoticeOk: "Got it",
```

- [ ] **Step 5: Wire the button + popup into** `src/components/watch-content.tsx`. Add imports:

```tsx
import { useState } from "react";
import { usePush } from "@/hooks/use-push";
import { StorageNotice } from "@/components/storage-notice";
```

In the component body (after `const { list, ready, setTargetFor, toggle } = useWatchlist();`):

```tsx
  const { enabled, supported, enable, disable } = usePush(list);
  const [notice, setNotice] = useState(false);

  const onToggleNotify = async () => {
    if (enabled) { await disable(); return; }
    setNotice(true);
    await enable();
  };
```

Add the button just under the `<h1>` (before the empty-state block):

```tsx
      {ready && rows.length > 0 && (
        <div className="mb-5">
          <button
            onClick={onToggleNotify}
            disabled={!supported}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              enabled ? "border-best text-best" : "border-border text-muted hover:text-bright"
            }`}
          >
            🔔 {!supported ? t.notifyUnsupported : enabled ? t.notifyOn : t.notifyEnable}
          </button>
        </div>
      )}
      <StorageNotice show={notice} onClose={() => setNotice(false)} />
```

- [ ] **Step 6: Typecheck + lint + build**

Run: `npx tsc --noEmit && npx eslint src/hooks/use-push.ts src/components/watch-content.tsx src/components/storage-notice.tsx src/lib/push-client.ts && npm run build`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/lib/push-client.ts src/hooks/use-push.ts src/components/storage-notice.tsx src/components/watch-content.tsx src/i18n/tr.ts src/i18n/en.ts
git commit -m "feat(push): wishlist notify toggle, push subscription sync, cache-notice popup"
```

---

## Task 10: Deploy + VAPID env + end-to-end push verification

**Files:** none (ops)

- [ ] **Step 1: Add VAPID env vars to Vercel production** (values from Task 6 Step 2):

```bash
printf '%s' "<publicKey>"  | vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
printf '%s' "<privateKey>" | vercel env add VAPID_PRIVATE_KEY production
printf '%s' "mailto:kutluhangul@windowslive.com" | vercel env add VAPID_SUBJECT production
```
Expected: each prints "Added Environment Variable … to Project".

- [ ] **Step 2: Deploy**

Run: `vercel --prod --yes`
Expected: READY. Note the URL (stable alias `pricespawn-kutluhans-projects-93876a9e.vercel.app`).

- [ ] **Step 3: Smoke-check routes**

```bash
URL="https://pricespawn-kutluhans-projects-93876a9e.vercel.app"
curl -s -o /dev/null -w "sw=%{http_code}\n" "$URL/sw.js"
curl -s -o /dev/null -w "icon=%{http_code}\n" "$URL/icon-192.png"
set -a; . ./.env.local; set +a
curl -s -H "Authorization: Bearer $CRON_SECRET" "$URL/api/notify"
```
Expected: `sw=200`, `icon=200`, `/api/notify` → `{"ok":true,"checked":0,...}` (0 until someone subscribes).

- [ ] **Step 4: End-to-end push test (manual, Chrome).** On the live site: open `/oyunlar`, add a game to the wishlist, open `/takip`, click "🔔 Fiyat düşünce bildir" → accept the storage popup → accept the Chrome permission prompt. Set that game's target price **above** its current live price. Then trigger the cron manually:

```bash
URL="https://pricespawn-kutluhans-projects-93876a9e.vercel.app"
set -a; . ./.env.local; set +a
curl -s -H "Authorization: Bearer $CRON_SECRET" "$URL/api/notify"
```
Expected: `{"ok":true,"checked":>=1,"sent":>=1,...}` and a Chrome notification appears; clicking it opens the game page.

- [ ] **Step 5: Verify the other phases live** — lightbox opens correctly over the price section, billboard art is crisp, Luna games show in the free strip, design looks sharper.

- [ ] **Step 6: Update memory** — append the v3 summary to `hangisidahaucuz-project-state.md` and add a one-line pointer in `MEMORY.md` if needed.

---

## Self-Review

**Spec coverage:**
- Phase 1 lightbox → Task 1 ✓
- Phase 2 sharp billboard → Task 2 ✓
- Phase 3 Luna data/lib + display → Tasks 3 (data/lib/test) + 4 (wire) ✓
- Phase 4 push: SW/VAPID → Task 6; DB + subscribe/unsubscribe → Task 7; notify cron + best-live → Task 8; client hook + button + cache popup → Task 9 ✓
- Phase 5 premium CSS → Task 5 ✓
- Phase 6 deploy + env + e2e → Task 10 ✓

**Type consistency:** `LunaFreeGame` defined in Task 3, consumed in Tasks 3–4; `WatchItem` (existing) used by `usePush` (Task 9); `bestLiveTRY` defined Task 8 used in `/api/notify` (Task 8); `urlBase64ToUint8Array`/`pushSupported` defined Task 9 used in `use-push` (Task 9); push payload shape `{title, body, url}` matches `public/sw.js` (Task 6) ↔ `/api/notify` (Task 8). `FreeOffer.platform: "prime"` already exists.

**Placeholder scan:** VAPID keys are real values generated at execution (Task 6 Step 2), referenced by `<publicKey>`/`<privateKey>` placeholders only in the ops commands (Task 6/10) where the engineer pastes the generated value — not code placeholders. No TODO/TBD in code.

**Note:** Execution order follows the spec rollout (1 → 2 → 3 → 4-wire → 5 → push 6-9 → 10); quick visual wins first, push subsystem last before deploy.
