"use client";

import { useRef, useState } from "react";
import { GAMES, type Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { useFreeGames } from "@/hooks/use-free-games";
import { SearchBar } from "@/components/search-bar";
import { GameCard } from "@/components/game-card";
import { Billboard } from "@/components/billboard";
import { PriceDropTicker } from "@/components/price-drop-ticker";
import { PlatformTiles } from "@/components/platform-tiles";
import { DealRadar } from "@/components/deal-radar";
import { BiggestDiscounts } from "@/components/biggest-discounts";
import { LiveDeals } from "@/components/live-deals";
import { Anticipated } from "@/components/anticipated";
import { SaleCalendar } from "@/components/sale-calendar";
import { NextSaleCountdown } from "@/components/next-sale-countdown";
import { FreeCard } from "@/components/free-card";
import { BrandMark } from "@/components/brand-mark";
import { StatBar } from "@/components/stat-bar";
import { GenreChips } from "@/components/genre-chips";
import { DealOfTheDay } from "@/components/deal-of-the-day";
import { SectionHeading } from "@/components/section-heading";
import { useApp } from "@/components/providers";

const PER_PAGE = 16;

/**
 * Billboard headliners — the buzziest titles, not whatever indie happens to be
 * 100%-off. Curated so the showcase always has sharp cover art and recognizable
 * names (newest blockbusters first). No free/giveaway titles here.
 */
const FEATURED_SLUGS = [
  "grand-theft-auto-vi",
  "forza-horizon-6",
  "cyberpunk-2077",
  "elden-ring",
  "baldurs-gate-3",
  "red-dead-redemption-2",
  "the-witcher-3-wild-hunt",
];

/** Compact page list: 1 … current-1 current current+1 … last */
function pagesToShow(current: number, total: number): (number | "…")[] {
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("…");
    out.push(nums[i]);
  }
  return out;
}

export function HomeContent({
  catalogTotal = 0,
  storeCounts = {},
}: {
  catalogTotal?: number;
  storeCounts?: Record<string, number>;
}) {
  const { t } = useApp();
  const [page, setPage] = useState(1);
  const popularRef = useRef<HTMLElement | null>(null);
  const { offers: freeOffers } = useFreeGames();
  const freeStrip = freeOffers.slice(0, 4);

  const withDiscount = GAMES.map((game) => ({
    game,
    discount: bestPrice(game)?.price.discountPercent ?? 0,
  }));

  const byDiscount = withDiscount
    .filter((x) => x.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .map((x) => x.game);

  const featuredSet = new Set(FEATURED_SLUGS);
  const billboardGames = FEATURED_SLUGS
    .map((s) => GAMES.find((g) => g.slug === s))
    .filter((g): g is Game => Boolean(g));
  const dealPool = byDiscount.filter((g) => !featuredSet.has(g.slug));
  const deals = dealPool.slice(0, 12);
  const radarGames = dealPool.slice(0, 18);
  const newReleases = [...GAMES]
    .sort((a, b) => b.releaseYear - a.releaseYear || b.score - a.score)
    .slice(0, 12);
  const shown = new Set(
    [...billboardGames, ...deals, ...newReleases].map((g) => g.slug)
  );
  const popular = GAMES.filter((g) => !shown.has(g.slug)).sort(
    (a, b) => b.score - a.score
  );
  const pageCount = Math.max(1, Math.ceil(popular.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const pageGames = popular.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  function goto(p: number) {
    setPage(p);
    popularRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)]">
      {/* Hero: büyük aurora arama */}
      <section className="reveal relative z-30 flex flex-col items-center gap-5 pb-12 pt-14 text-center sm:pt-20">
        <h1 className="leading-tight tracking-tight">
          <BrandMark className="text-4xl font-bold sm:text-6xl" />
        </h1>
        <p className="max-w-xl text-sm text-muted sm:text-base">{t.tagline}</p>
        <div className="w-full pt-4">
          <SearchBar variant="hero" />
        </div>
        <div className="pt-1">
          <StatBar catalogTotal={catalogTotal} dealCount={byDiscount.length} />
        </div>
        <div className="pt-1">
          <GenreChips />
        </div>
      </section>

      {/* Canlı fiyat düşüşü şeridi */}
      <div className="reveal relative z-0 mb-6" style={{ animationDelay: "0.1s" }}>
        <PriceDropTicker games={dealPool} />
      </div>

      {/* Sinematik vitrin */}
      <div className="reveal relative z-0" style={{ animationDelay: "0.12s" }}>
        <Billboard games={billboardGames} />
      </div>

      {/* Günün Fırsatı — editöryel hero (canlı feed) */}
      <div className="reveal pt-6" style={{ animationDelay: "0.13s" }}>
        <DealOfTheDay />
      </div>

      {/* Platformlar */}
      <section className="reveal pt-12" style={{ animationDelay: "0.14s" }}>
        <SectionHeading title={t.platforms} />
        <PlatformTiles counts={storeCounts} />
      </section>

      {/* En Büyük İndirimler */}
      <section className="reveal pt-12" style={{ animationDelay: "0.16s" }}>
        <SectionHeading title={t.biggestDiscounts} href="/oyunlar?disc=1" />
        <BiggestDiscounts />
      </section>

      {/* Canlı indirim feed'i (ITAD, tüm mağazalar) */}
      <LiveDeals />

      {/* En çok beklenenler (ITAD most-waitlisted) */}
      <Anticipated />

      {/* Fırsat Radarı */}
      <section className="reveal pt-12" style={{ animationDelay: "0.18s" }}>
        <SectionHeading title={t.dealRadar} />
        <DealRadar games={radarGames} />
      </section>

      {/* İndirim Takvimi + sıradaki büyük indirim */}
      <section className="reveal pt-12" style={{ animationDelay: "0.22s" }}>
        <SectionHeading title={t.saleCalendar} />
        <div className="grid gap-4 lg:grid-cols-[19rem_1fr]">
          <NextSaleCountdown />
          <SaleCalendar />
        </div>
      </section>

      {/* Şu An Ücretsiz (Epic, canlı) — şerit */}
      {freeStrip.length > 0 && (
        <section className="reveal pt-10" style={{ animationDelay: "0.2s" }}>
          <SectionHeading title={t.freeNow} sub="· Epic Games" href="/ucretsiz" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {freeStrip.map((o) => (
              <FreeCard key={o.title} offer={o} />
            ))}
          </div>
        </section>
      )}

      {/* Günün Fırsatları — ray */}
      <section id="deals" className="reveal pt-12" style={{ animationDelay: "0.24s" }}>
        <SectionHeading title={t.todaysDeals} href="/oyunlar?disc=1" id="deals-h" />
        <div className="row-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
          {deals.map((game) => (
            <div key={game.slug} className="w-[280px] shrink-0 snap-start">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      {/* Yeni Çıkanlar — ray */}
      <section id="new" className="reveal pt-10" style={{ animationDelay: "0.26s" }}>
        <SectionHeading title={t.tabNew} />
        <div className="row-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
          {newReleases.map((game) => (
            <div key={game.slug} className="w-[280px] shrink-0 snap-start">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      {/* Popüler Oyunlar — sayfalı (16/sayfa) */}
      <section
        id="popular"
        ref={popularRef}
        className="reveal scroll-mt-20 pt-10"
        style={{ animationDelay: "0.32s" }}
      >
        <div className="mb-4 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-bright sm:text-xl">
            {t.popularGames}
          </h2>
          <span className="text-xs text-muted">
            {t.page} {current}/{pageCount}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageGames.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>

        {pageCount > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-1.5">
            <button
              onClick={() => goto(Math.max(1, current - 1))}
              disabled={current === 1}
              aria-label={t.prevPage}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] border border-border text-muted transition-colors enabled:hover:text-bright disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              ‹
            </button>
            {pagesToShow(current, pageCount).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="px-1 text-muted">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goto(p)}
                  aria-current={p === current}
                  className={`h-9 min-w-9 rounded-[var(--radius-card)] border px-2 text-sm font-semibold transition-colors cursor-pointer ${
                    p === current
                      ? "border-accent bg-accent text-white"
                      : "border-border text-muted hover:text-bright"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => goto(Math.min(pageCount, current + 1))}
              disabled={current === pageCount}
              aria-label={t.nextPage}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] border border-border text-muted transition-colors enabled:hover:text-bright disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              ›
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
