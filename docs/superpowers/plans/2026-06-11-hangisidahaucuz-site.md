# hangisidahaucuz.com Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Game price comparison site for Turkey — search a game, see TL prices across all stores active in Turkey, cheapest highlighted, subscription availability shown.

**Architecture:** Next.js App Router with a static demo catalog (`src/data/games.ts`). Pure functions in `src/lib/` handle currency conversion (USD→TRY), Turkish-aware fuzzy search, and best-price selection. Client-side providers manage theme (two distinct glass identities via `data-theme` + CSS variables) and locale (TR/EN dictionaries). Two routes: home (hero search + deals + grid) and `/oyun/[slug]` detail.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Vitest. Deploy target: Vercel.

**Spec:** `docs/superpowers/specs/2026-06-11-hangisidahaucuz-design.md`

---

## File Structure

```
src/
  lib/
    site.ts            # site name config (single source — name may change later)
    exchange.ts        # demo USD_TRY rate + toTRY()
    format.ts          # formatTRY(amount, locale)
    stores.ts          # store metadata (id, label, accent color)
    subscriptions.ts   # subscription metadata (id, label, monthly TL price)
    price.ts           # priceInTRY(), bestPrice(), sortedPrices()
    search.ts          # normalizeTR(), searchGames()
  data/
    games.ts           # Game type + ~48-game demo catalog
  i18n/
    tr.ts en.ts index.ts  # dictionaries + Dict type
  components/
    providers.tsx      # ThemeProvider + LocaleProvider (one client file)
    navbar.tsx         # logo, theme toggle, lang toggle
    search-bar.tsx     # aurora-border search + instant dropdown
    game-card.tsx      # cover, best price, discount + sub badges
    cover-image.tsx    # img with gradient fallback on error
    price-list.tsx     # detail page store rows
    subscription-block.tsx
  app/
    layout.tsx page.tsx oyun/[slug]/page.tsx not-found.tsx globals.css
tests/
    exchange.test.ts format.test.ts search.test.ts price.test.ts data.test.ts
```

---

### Task 1: Scaffold project + Vitest

**Files:** Create: Next.js scaffold (in repo root), `vitest.config.ts`; Modify: `package.json`

- [ ] **Step 1: Scaffold Next.js into existing repo**

```bash
cd /Volumes/ProjectVault/hangisidahaucuz.com
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --use-npm --no-import-alias-prompt --import-alias "@/*" --turbopack --yes
```

If create-next-app refuses non-empty dir, scaffold in `/tmp/hdu-scaffold` and `cp -R` contents (except `.git`) into repo root.

- [ ] **Step 2: Verify dev build works**

Run: `npm run build` — Expected: build succeeds.

- [ ] **Step 3: Install and wire Vitest**

```bash
npm i -D vitest
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["tests/**/*.test.ts"] },
});
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

### Task 2: Exchange + format libs (TDD)

**Files:** Create: `src/lib/exchange.ts`, `src/lib/format.ts`, `src/lib/site.ts`, `tests/exchange.test.ts`, `tests/format.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/exchange.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { USD_TRY, toTRY } from "@/lib/exchange";

describe("toTRY", () => {
  it("converts USD using the demo rate", () => {
    expect(toTRY(1)).toBe(USD_TRY);
  });
  it("rounds to 2 decimals", () => {
    expect(toTRY(29.99)).toBeCloseTo(Math.round(29.99 * USD_TRY * 100) / 100, 2);
  });
});
```

`tests/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatTRY } from "@/lib/format";

describe("formatTRY", () => {
  it("formats Turkish style", () => {
    expect(formatTRY(1234.5, "tr")).toBe("₺1.234,50");
  });
  it("formats English style", () => {
    expect(formatTRY(1234.5, "en")).toBe("₺1,234.50");
  });
  it("drops decimals for whole amounts", () => {
    expect(formatTRY(999, "tr")).toBe("₺999");
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npm test` → modules not found.

- [ ] **Step 3: Implement**

`src/lib/site.ts`:

```ts
export const SITE_NAME = "hangisidahaucuz.com";
export const SITE_SHORT = "hangisidahaucuz";
```

`src/lib/exchange.ts`:

```ts
// Demo kuru — ileride canlı kur API'sine bağlanacak (tek değişiklik noktası).
export const USD_TRY = 44.2;

export function toTRY(usd: number): number {
  return Math.round(usd * USD_TRY * 100) / 100;
}
```

`src/lib/format.ts`:

```ts
import type { Locale } from "@/i18n";

export function formatTRY(amount: number, locale: Locale): string {
  const isWhole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
```

Note: `format.ts` imports `Locale` from `@/i18n` — create a minimal `src/i18n/index.ts` now containing only `export type Locale = "tr" | "en";` (expanded in Task 7).

- [ ] **Step 4: Run, verify PASS** — `npm test`. If `₺` placement differs in Node ICU, adjust expected strings to actual ICU output (document in test comment).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: currency conversion and TL formatting"`

---

### Task 3: Store + subscription metadata

**Files:** Create: `src/lib/stores.ts`, `src/lib/subscriptions.ts`

- [ ] **Step 1: Implement (no test needed — pure constants, validated by data test in Task 4)**

`src/lib/stores.ts`:

```ts
export type StoreId =
  | "steam" | "epic" | "gog" | "xbox"
  | "playstation" | "ubisoft" | "ea" | "humble";

export interface StoreMeta {
  id: StoreId;
  label: string;
  accent: string; // brand hex, used for logo chip
}

export const STORES: Record<StoreId, StoreMeta> = {
  steam:       { id: "steam",       label: "Steam",            accent: "#1b2838" },
  epic:        { id: "epic",        label: "Epic Games",       accent: "#2a2a2a" },
  gog:         { id: "gog",         label: "GOG",              accent: "#86328a" },
  xbox:        { id: "xbox",        label: "Xbox Store",       accent: "#107c10" },
  playstation: { id: "playstation", label: "PlayStation Store",accent: "#0070d1" },
  ubisoft:     { id: "ubisoft",     label: "Ubisoft Store",    accent: "#0070ff" },
  ea:          { id: "ea",          label: "EA App",           accent: "#ff4747" },
  humble:      { id: "humble",      label: "Humble Store",     accent: "#cc2929" },
};
```

`src/lib/subscriptions.ts`:

```ts
export type SubscriptionId = "gamepass" | "psplus" | "eaplay" | "ubisoftplus" | "luna";

export interface SubscriptionMeta {
  id: SubscriptionId;
  label: string;
  monthlyTRY: number; // demo fiyat
  accent: string;
}

export const SUBSCRIPTIONS: Record<SubscriptionId, SubscriptionMeta> = {
  gamepass:    { id: "gamepass",    label: "Xbox Game Pass", monthlyTRY: 549, accent: "#107c10" },
  psplus:      { id: "psplus",      label: "PS Plus Extra",  monthlyTRY: 460, accent: "#0070d1" },
  eaplay:      { id: "eaplay",      label: "EA Play",        monthlyTRY: 149, accent: "#ff4747" },
  ubisoftplus: { id: "ubisoftplus", label: "Ubisoft+",       monthlyTRY: 679, accent: "#0070ff" },
  luna:        { id: "luna",        label: "Amazon Luna",    monthlyTRY: 430, accent: "#9146ff" },
};
```

- [ ] **Step 2: Commit** — `git add -A && git commit -m "feat: store and subscription metadata"`

---

### Task 4: Game data model + demo catalog + consistency tests

**Files:** Create: `src/data/games.ts`, `tests/data.test.ts`

- [ ] **Step 1: Write failing consistency tests**

`tests/data.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { GAMES } from "@/data/games";

describe("demo catalog", () => {
  it("has at least 40 games", () => {
    expect(GAMES.length).toBeGreaterThanOrEqual(40);
  });
  it("has unique slugs", () => {
    const slugs = GAMES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
  it("every game has at least one price, all positive", () => {
    for (const g of GAMES) {
      expect(g.prices.length, g.slug).toBeGreaterThan(0);
      for (const p of g.prices) {
        expect(p.amount, `${g.slug}/${p.store}`).toBeGreaterThan(0);
        if (p.originalAmount !== undefined) {
          expect(p.originalAmount).toBeGreaterThan(p.amount);
        }
        if (p.discountPercent !== undefined) {
          expect(p.discountPercent).toBeGreaterThan(0);
          expect(p.discountPercent).toBeLessThan(100);
        }
      }
    }
  });
  it("no duplicate store within a game", () => {
    for (const g of GAMES) {
      const ids = g.prices.map((p) => p.store);
      expect(new Set(ids).size, g.slug).toBe(ids.length);
    }
  });
});
```

- [ ] **Step 2: Run, verify FAIL** — `npm test`.

- [ ] **Step 3: Implement the model and catalog**

`src/data/games.ts` — type + ~48 entries:

```ts
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

export interface Price {
  store: StoreId;
  amount: number;            // TRY for TL stores; USD for steam/gog/humble
  currency: "TRY" | "USD";
  originalAmount?: number;   // pre-discount, same currency
  discountPercent?: number;  // 1-99
}

export interface Game {
  id: string;          // steam appid when known, else slug
  slug: string;
  title: string;
  coverUrl: string;    // Steam CDN header; CoverImage falls back to gradient on error
  genres: string[];    // Turkish genre labels
  score: number;       // 0-100
  releaseYear: number;
  prices: Price[];
  subscriptions: SubscriptionId[];
}

const cover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

export const GAMES: Game[] = [
  {
    id: "1091500",
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    coverUrl: cover(1091500),
    genres: ["RPG", "Aksiyon"],
    score: 86,
    releaseYear: 2020,
    prices: [
      { store: "steam", amount: 29.99, currency: "USD", originalAmount: 59.99, discountPercent: 50 },
      { store: "gog", amount: 27.0, currency: "USD", originalAmount: 59.99, discountPercent: 55 },
      { store: "epic", amount: 1349, currency: "TRY", originalAmount: 2699, discountPercent: 50 },
      { store: "xbox", amount: 1499, currency: "TRY" },
      { store: "playstation", amount: 1599, currency: "TRY" },
    ],
    subscriptions: [],
  },
  // ... full shape repeated for every game below
];
```

Catalog list (title — steam appid — stores — subscriptions). Prices: realistic mid-2026 demo values; Steam/GOG/Humble in USD, rest TL; sprinkle discounts (30–70%) on ~third of catalog:

| Title | appid | stores | subs |
|---|---|---|---|
| Cyberpunk 2077 | 1091500 | steam,gog,epic,xbox,playstation | — |
| The Witcher 3: Wild Hunt | 292030 | steam,gog,epic,xbox,playstation | — |
| Red Dead Redemption 2 | 1174180 | steam,epic,xbox,playstation,humble | — |
| Grand Theft Auto V Enhanced | 271590 | steam,epic,xbox,playstation | — |
| Grand Theft Auto VI | — (placeholder cover) | xbox,playstation | — |
| Elden Ring | 1245620 | steam,xbox,playstation,humble | — |
| Baldur's Gate 3 | 1086940 | steam,gog,xbox,playstation | — |
| Hogwarts Legacy | 990080 | steam,epic,xbox,playstation,humble | — |
| God of War Ragnarök | 2322010 | steam,epic,playstation | psplus |
| Ghost of Tsushima | 2215430 | steam,epic,playstation | psplus |
| Horizon Forbidden West | 2420110 | steam,epic,playstation | psplus |
| Marvel's Spider-Man 2 | 2651280 | steam,playstation | — |
| The Last of Us Part I | 1888930 | steam,playstation | — |
| Forza Horizon 5 | 1551360 | steam,xbox | gamepass,luna |
| Forza Horizon 6 | — (placeholder) | steam,xbox | gamepass |
| Forza Motorsport | 2440510 | steam,xbox | gamepass |
| Halo Infinite | 1240440 | steam,xbox | gamepass |
| Starfield | 1716740 | steam,xbox | gamepass |
| DOOM: The Dark Ages | 3017860 | steam,xbox | gamepass |
| Fallout 4 | 377160 | steam,xbox,gog | gamepass |
| Diablo IV | 2344520 | steam,xbox | gamepass |
| Call of Duty: Black Ops 6 | 2933620 | steam,xbox,playstation | gamepass |
| EA Sports FC 26 | — (placeholder) | steam,epic,xbox,playstation,ea | eaplay |
| F1 25 | — (placeholder) | steam,xbox,playstation,ea | eaplay |
| It Takes Two | 1426210 | steam,epic,xbox,playstation,ea | eaplay |
| Split Fiction | 2001120 | steam,xbox,playstation,ea | — |
| Dead Space | 1693980 | steam,epic,xbox,playstation,ea | eaplay |
| Star Wars Jedi: Survivor | 1774580 | steam,epic,xbox,playstation,ea | eaplay |
| Battlefield 2042 | 1517290 | steam,xbox,playstation,ea | eaplay |
| Assassin's Creed Mirage | 3035570 | steam,epic,xbox,playstation,ubisoft | ubisoftplus,luna |
| Assassin's Creed Shadows | 3159330 | steam,xbox,playstation,ubisoft | ubisoftplus |
| Far Cry 6 | 2369390 | steam,epic,xbox,playstation,ubisoft | ubisoftplus,luna |
| Tom Clancy's Rainbow Six Siege | 359550 | steam,xbox,playstation,ubisoft | ubisoftplus,luna |
| Black Myth: Wukong | 2358720 | steam,epic,playstation | — |
| Sekiro: Shadows Die Twice | 814380 | steam,xbox,playstation | gamepass |
| Armored Core VI | 1888160 | steam,xbox,playstation | — |
| Lies of P | 1627720 | steam,xbox,playstation | gamepass |
| Monster Hunter Wilds | 2246340 | steam,xbox,playstation | — |
| Resident Evil 4 | 2050650 | steam,xbox,playstation,humble | — |
| Street Fighter 6 | 1364780 | steam,xbox,playstation | — |
| Tekken 8 | 1778820 | steam,xbox,playstation | — |
| Mortal Kombat 1 | 1971870 | steam,epic,xbox,playstation | — |
| Silent Hill 2 | 2124490 | steam,playstation | — |
| Clair Obscur: Expedition 33 | 1903340 | steam,xbox,playstation | gamepass |
| Kingdom Come: Deliverance II | 1771300 | steam,xbox,playstation | — |
| Persona 3 Reload | 2161700 | steam,xbox,playstation | gamepass |
| Metaphor: ReFantazio | 2679460 | steam,xbox,playstation | — |
| Hades II | 1145360 | steam,epic | — |
| Stardew Valley | 413150 | steam,gog,xbox | gamepass |
| Death Stranding Director's Cut | 1850570 | steam,epic,playstation | psplus |

For games without appid: `coverUrl: ""` (CoverImage renders gradient fallback), `id: slug`.

- [ ] **Step 4: Run, verify PASS** — `npm test`.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: demo game catalog with TL/USD prices"`

---

### Task 5: Turkish-aware search (TDD)

**Files:** Create: `src/lib/search.ts`, `tests/search.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { normalizeTR, searchGames } from "@/lib/search";
import { GAMES } from "@/data/games";

describe("normalizeTR", () => {
  it("maps Turkish characters", () => {
    expect(normalizeTR("WIıİşŞçÇğĞöÖüÜ")).toBe("wiiissccggoouu");
  });
  it("strips punctuation and collapses spaces", () => {
    expect(normalizeTR("Assassin's   Creed:  Mirage")).toBe("assassins creed mirage");
  });
});

describe("searchGames", () => {
  it("finds by partial title case-insensitively", () => {
    const r = searchGames("forza", GAMES);
    expect(r.length).toBeGreaterThanOrEqual(2);
    expect(r[0].title.toLowerCase()).toContain("forza");
  });
  it("tolerates Turkish keyboard input", () => {
    const r = searchGames("wıtcher", GAMES);
    expect(r[0].slug).toBe("the-witcher-3-wild-hunt");
  });
  it("returns empty for gibberish", () => {
    expect(searchGames("zzzxqqy", GAMES)).toEqual([]);
  });
  it("respects limit", () => {
    expect(searchGames("a", GAMES, 5).length).toBeLessThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Game } from "@/data/games";

const TR_MAP: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ç: "c", Ç: "c",
  ğ: "g", Ğ: "g", ö: "o", Ö: "o", ü: "u", Ü: "u",
};

export function normalizeTR(s: string): string {
  return s
    .replace(/[ıİşŞçÇğĞöÖüÜ]/g, (ch) => TR_MAP[ch])
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchGames(query: string, games: Game[], limit = 8): Game[] {
  const q = normalizeTR(query);
  if (!q) return [];
  return games
    .map((game) => {
      const t = normalizeTR(game.title);
      let score = 0;
      if (t.startsWith(q)) score = 3;
      else if (t.split(" ").some((w) => w.startsWith(q))) score = 2;
      else if (t.includes(q)) score = 1;
      return { game, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.game.score - a.game.score)
    .slice(0, limit)
    .map((x) => x.game);
}
```

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: Turkish-aware fuzzy search"`

---

### Task 6: Price selection (TDD)

**Files:** Create: `src/lib/price.ts`, `tests/price.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { bestPrice, priceInTRY, sortedPrices } from "@/lib/price";
import { toTRY } from "@/lib/exchange";
import type { Game, Price } from "@/data/games";

const p = (store: string, amount: number, currency: "TRY" | "USD"): Price =>
  ({ store, amount, currency } as Price);

const game = (prices: Price[]): Game => ({
  id: "x", slug: "x", title: "X", coverUrl: "", genres: [],
  score: 80, releaseYear: 2024, prices, subscriptions: [],
});

describe("priceInTRY", () => {
  it("passes TRY through", () => expect(priceInTRY(p("epic", 100, "TRY"))).toBe(100));
  it("converts USD", () => expect(priceInTRY(p("steam", 10, "USD"))).toBe(toTRY(10)));
});

describe("bestPrice / sortedPrices", () => {
  it("picks cheapest across currencies", () => {
    const g = game([p("epic", 500, "TRY"), p("steam", 10, "USD")]); // 10 USD = 442 TL
    expect(bestPrice(g)!.price.store).toBe("steam");
  });
  it("sorts ascending in TL", () => {
    const g = game([p("epic", 500, "TRY"), p("steam", 10, "USD"), p("xbox", 400, "TRY")]);
    expect(sortedPrices(g).map((x) => x.price.store)).toEqual(["xbox", "steam", "epic"]);
  });
});
```

- [ ] **Step 2: Run, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Game, Price } from "@/data/games";
import { toTRY } from "@/lib/exchange";

export interface ResolvedPrice {
  price: Price;
  tryAmount: number;
  tryOriginal?: number;
}

export function priceInTRY(price: Price): number {
  return price.currency === "USD" ? toTRY(price.amount) : price.amount;
}

export function resolvePrice(price: Price): ResolvedPrice {
  return {
    price,
    tryAmount: priceInTRY(price),
    tryOriginal:
      price.originalAmount !== undefined
        ? priceInTRY({ ...price, amount: price.originalAmount })
        : undefined,
  };
}

export function sortedPrices(game: Game): ResolvedPrice[] {
  return game.prices.map(resolvePrice).sort((a, b) => a.tryAmount - b.tryAmount);
}

export function bestPrice(game: Game): ResolvedPrice | null {
  return sortedPrices(game)[0] ?? null;
}
```

(Test uses `tryAmount` via `.price.store` only — adjust test field names to match: `bestPrice(g)!.price.store`.)

- [ ] **Step 4: Run, verify PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: best-price selection across currencies"`

---

### Task 7: i18n dictionaries + theme/locale providers

**Files:** Create: `src/i18n/tr.ts`, `src/i18n/en.ts`, `src/components/providers.tsx`; Modify: `src/i18n/index.ts`, `src/app/layout.tsx`

- [ ] **Step 1: Dictionaries**

`src/i18n/index.ts`:

```ts
export type Locale = "tr" | "en";
export { tr } from "./tr";
export { en } from "./en";
import type { tr as TrDict } from "./tr";
export type Dict = typeof TrDict;
```

`src/i18n/tr.ts` (keys final — en.ts mirrors with English values):

```ts
export const tr = {
  tagline: "Hangi oyun nerede daha ucuz? Tek bakışta gör.",
  searchPlaceholder: "Oyun ara… (örn. Forza Horizon 6)",
  noResults: "Sonuç bulunamadı",
  todaysDeals: "Günün Fırsatları",
  popularGames: "Popüler Oyunlar",
  cheapest: "EN UCUZ",
  cheapestAt: "En ucuz:",
  includedIn: "Aboneliklere dahil",
  perMonth: "/ay",
  steamNote: "güncel kurla",
  allPrices: "Tüm Fiyatlar",
  storesCount: "mağaza",
  notFoundTitle: "Oyun bulunamadı",
  notFoundBody: "Aradığın sayfa yok ya da taşınmış olabilir.",
  backHome: "Ana sayfaya dön",
  footerNote: "Fiyatlar demo veridir; mağaza fiyatları değişebilir.",
  themeToggle: "Tema değiştir",
  discount: "indirim",
} as const;
```

- [ ] **Step 2: Providers**

`src/components/providers.tsx` (client component):

```tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { tr, en, type Locale, type Dict } from "@/i18n";

type Theme = "dark" | "light";
const Ctx = createContext<{
  theme: Theme; toggleTheme: () => void;
  locale: Locale; setLocale: (l: Locale) => void; t: Dict;
} | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(t);
    const l = (localStorage.getItem("hdu-locale") as Locale) || "tr";
    setLocaleState(l);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("hdu-theme", next);
      return next;
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("hdu-locale", l);
    document.documentElement.lang = l;
  }, []);

  return (
    <Ctx.Provider value={{ theme, toggleTheme, locale, setLocale, t: locale === "tr" ? tr : en }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp outside Providers");
  return ctx;
}
```

- [ ] **Step 3: Layout with FOUC-prevention inline script**

`src/app/layout.tsx` `<head>` gets:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){try{var t=localStorage.getItem("hdu-theme");if(!t)t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.dataset.theme=t;var l=localStorage.getItem("hdu-locale");if(l)document.documentElement.lang=l;}catch(e){}})();`,
  }}
/>
```

Body wraps children in `<Providers>`. `metadata`: title `hangisidahaucuz.com — Oyun Fiyat Karşılaştırma`, description in Turkish. `suppressHydrationWarning` on `<html>`.

- [ ] **Step 4: Verify** — `npm run build` passes.
- [ ] **Step 5: Commit** — `git commit -am "feat: i18n dictionaries, theme/locale providers"`

---

### Task 8: Theme tokens + glass design system (globals.css)

**Files:** Modify: `src/app/globals.css`

- [ ] **Step 1: Define dual-identity tokens**

Replace globals.css content. Structure (complete tokens — values may be tuned during polish):

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root[data-theme="light"] {
  --bg: #f4f1ec;
  --fg: #1c1a24;
  --muted: #6e6880;
  --glass: rgba(255, 255, 255, 0.55);
  --glass-border: rgba(255, 255, 255, 0.8);
  --accent: #7c5cff;
  --best: #0a8f5b;
  --mesh-a: #ffd9c0; /* şeftali */
  --mesh-b: #d9c8ff; /* lila */
  --mesh-c: #bfe3ff; /* gök mavisi */
}

:root[data-theme="dark"] {
  --bg: #0a0a12;
  --fg: #f2f0ff;
  --muted: #9a94b8;
  --glass: rgba(20, 18, 38, 0.55);
  --glass-border: rgba(255, 255, 255, 0.12);
  --accent: #a78bfa;
  --best: #34d399;
  --mesh-a: #6d28d9; /* mor */
  --mesh-b: #0891b2; /* cyan */
  --mesh-c: #db2777; /* pembe */
}

@theme inline {
  --color-bg: var(--bg);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-best: var(--best);
}

body { background: var(--bg); color: var(--fg); }

/* Gradient mesh background — fixed blobs, slow drift */
.mesh::before, .mesh::after { /* two radial-gradient blobs, blur(90px), animation: drift 24s alternate infinite */ }
@keyframes drift { from { transform: translate(-6%, -4%) scale(1); } to { transform: translate(6%, 5%) scale(1.15); } }

/* Glass card */
.glass {
  background: var(--glass);
  backdrop-filter: blur(18px) saturate(1.4);
  border: 1px solid var(--glass-border);
}

/* Apple Intelligence-style aurora ring for search bar */
.aurora { position: relative; }
.aurora::before {
  content: ""; position: absolute; inset: -2px; border-radius: inherit; z-index: -1;
  background: conic-gradient(from var(--angle, 0deg),
    #ff5f6d, #ffc371, #47e891, #38b6ff, #a86cff, #ff5f6d);
  animation: spin-aurora 6s linear infinite;
  filter: blur(6px);
}
@property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
@keyframes spin-aurora { to { --angle: 360deg; } }
```

Mesh blobs implemented as full CSS in this step (the `/* two radial-gradient blobs */` comment above is shorthand for plan brevity — write the actual gradients using `--mesh-a/b/c`, e.g. `background: radial-gradient(40% 35% at 20% 25%, var(--mesh-a), transparent 70%), radial-gradient(35% 40% at 80% 20%, var(--mesh-b), transparent 70%), radial-gradient(45% 45% at 60% 80%, var(--mesh-c), transparent 70%);`).

- [ ] **Step 2: Verify** — `npm run build` passes; manual check both themes once pages exist.
- [ ] **Step 3: Commit** — `git commit -am "feat: dual-identity glass theme tokens"`

---

### Task 9: Navbar + CoverImage + GameCard

**Files:** Create: `src/components/navbar.tsx`, `src/components/cover-image.tsx`, `src/components/game-card.tsx`

- [ ] **Step 1: CoverImage** — client component; plain `<img>` with `onError` switching to a gradient `<div>` (derived from title hash → pick 1 of 5 gradient pairs) showing game title centered. Plain `<img>` chosen over `next/image` to avoid remote-domain config and demo-image 404 handling complexity; add `loading="lazy"`.

- [ ] **Step 2: Navbar** — glass sticky bar: site name (from `SITE_NAME`, gradient text), right side: locale toggle (`TR | EN` pill) and theme toggle (sun/moon inline SVG). Uses `useApp()`.

- [ ] **Step 3: GameCard** — link to `/oyun/[slug]`; cover on top, body shows title, genre chips, best price (`bestPrice()` + `formatTRY`), store label, discount badge (`-50%`) when best price discounted, subscription mini-badges. Glass styling.

- [ ] **Step 4: Verify** — `npm run build`; `npx eslint src` clean.
- [ ] **Step 5: Commit** — `git commit -am "feat: navbar, cover fallback, game card"`

---

### Task 10: SearchBar with instant dropdown

**Files:** Create: `src/components/search-bar.tsx`

- [ ] **Step 1: Implement** — client component:
  - Input wrapped in `.aurora .glass` rounded-full container.
  - `useState` query; results = `searchGames(query, GAMES, 8)` (memoized).
  - Dropdown (absolute, glass): each row = small cover (40px), title, best price + store, subscription badges; `Link` to detail; Escape/blur closes; arrow keys move highlight; Enter navigates (`useRouter`).
  - Empty query → no dropdown; no matches → `t.noResults` row.

- [ ] **Step 2: Verify** — `npm run build`; manual: type "forza" → results include Forza games; "wıtcher" finds Witcher 3.
- [ ] **Step 3: Commit** — `git commit -am "feat: instant search with aurora ring"`

---

### Task 11: Home page

**Files:** Modify: `src/app/page.tsx`; Create: `src/components/sections.tsx` (client wrapper for translated section headers)

- [ ] **Step 1: Compose home**
  - Mesh background container.
  - Hero: oversized gradient headline (site name styled as "hangisi daha ucuz?"), tagline (`t.tagline`), SearchBar centered.
  - "Günün Fırsatları": games sorted by best-price `discountPercent` desc, top 6, horizontal scroll row of GameCards.
  - "Popüler Oyunlar": remaining games sorted by `score` desc, responsive grid (2/3/4/5 cols).
  - Footer: `t.footerNote` + demo-kur notice (`1$ ≈ ₺44,20`).

- [ ] **Step 2: Verify** — `npm run dev`, check both themes + both locales render.
- [ ] **Step 3: Commit** — `git commit -am "feat: home page with deals strip and popular grid"`

---

### Task 12: Detail page + 404

**Files:** Create: `src/app/oyun/[slug]/page.tsx`, `src/components/price-list.tsx`, `src/components/subscription-block.tsx`; Modify: `src/app/not-found.tsx`

- [ ] **Step 1: Detail route** — server component: `generateStaticParams` from GAMES; unknown slug → `notFound()`. Layout: blurred cover as backdrop, glass panel with cover, title, year, score chip, genres.

- [ ] **Step 2: PriceList** (client, needs `t`/locale): rows from `sortedPrices(game)`, each: store chip (accent color dot + label), TL price big; if `currency === "USD"`: small line `$29.99 · güncel kurla`; if discounted: `-50%` badge + struck original TL; first row gets `t.cheapest` ribbon + `--best` colored border/glow.

- [ ] **Step 3: SubscriptionBlock** (client): if `game.subscriptions.length`, glass block `t.includedIn`, row per sub: label + `formatTRY(monthlyTRY)/ay`. Hidden otherwise.

- [ ] **Step 4: 404** — glass card, `t.notFoundTitle`, `t.backHome` link.

- [ ] **Step 5: Verify** — `npm run build` (static params generate all pages); visit `/oyun/cyberpunk-2077`, `/oyun/yok-boyle-oyun` → 404.
- [ ] **Step 6: Commit** — `git commit -am "feat: game detail page with price comparison and 404"`

---

### Task 13: Design polish pass (frontend-design skill)

**Files:** Modify: components + globals.css as needed

- [ ] **Step 1: Invoke `frontend-design:frontend-design` skill** and do a polish pass: typography scale (distinct display font via `next/font` — e.g. distinctive sans for dark identity), hover/transition micro-interactions, mobile responsiveness (hero, grid, dropdown widths), dark/light identity contrast check (palettes must read as two designs), reduced-motion media query for aurora/mesh animations.
- [ ] **Step 2: Verify** — `npm test`, `npm run build`, `npx eslint src` all green; manually inspect both themes/locales on mobile width.
- [ ] **Step 3: Commit** — `git commit -am "polish: dual-identity visual pass"`

---

### Task 14: Deploy

- [ ] **Step 1: Confirm with user, then deploy preview to Vercel** (`vercel:deploy` skill). Domain `hangisidahaucuz.com` binding handled by the user in Vercel dashboard or via CLI on request.

---

## Self-Review Notes

- Spec coverage: stores/subs (T3-4), TL conversion + Steam USD note (T2, T12), search w/ TR normalization (T5, T10), cheapest highlight (T6, T12), dual themes (T8, T13), i18n (T7), 404/empty states (T10, T12), name-from-config (T2 `site.ts`), tests (T2, T4, T5, T6). Live-data future-proofing: conversion isolated in `exchange.ts`, prices typed with currency.
- Types consistent: `Game`/`Price` defined T4, consumed T5/T6/T9-12; `ResolvedPrice.tryAmount` used in PriceList.
- Known judgment calls: plain `<img>` over `next/image` (demo external covers + fallback); component JSX detailed at execution time under frontend-design skill — structure and data contracts are fixed here.
