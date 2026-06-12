"use client";

import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { FREE_OFFERS } from "@/data/free";
import { SearchBar } from "@/components/search-bar";
import { GameCard } from "@/components/game-card";
import { Billboard } from "@/components/billboard";
import { PlatformTiles } from "@/components/platform-tiles";
import { DealRadar } from "@/components/deal-radar";
import { FreeCard } from "@/components/free-card";
import { BrandMark } from "@/components/brand-mark";
import { useApp } from "@/components/providers";

export function HomeContent() {
  const { t } = useApp();

  const withDiscount = GAMES.map((game) => ({
    game,
    discount: bestPrice(game)?.price.discountPercent ?? 0,
  }));

  const byDiscount = withDiscount
    .filter((x) => x.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .map((x) => x.game);

  const billboardGames = byDiscount.slice(0, 5);
  const deals = byDiscount.slice(5, 17);
  const radarGames = byDiscount.slice(0, 18);
  const freeStrip = FREE_OFFERS.slice(0, 4);
  const newReleases = [...GAMES]
    .sort((a, b) => b.releaseYear - a.releaseYear || b.score - a.score)
    .slice(0, 12);
  const shown = new Set(
    [...billboardGames, ...deals, ...newReleases].map((g) => g.slug)
  );
  const popular = GAMES.filter((g) => !shown.has(g.slug)).sort(
    (a, b) => b.score - a.score
  );

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
      </section>

      {/* Sinematik vitrin */}
      <div className="reveal relative z-0" style={{ animationDelay: "0.12s" }}>
        <Billboard games={billboardGames} />
      </div>

      {/* Platformlar */}
      <section className="reveal pt-12" style={{ animationDelay: "0.14s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.platforms}
        </h2>
        <PlatformTiles />
      </section>

      {/* Fırsat Radarı */}
      <section className="reveal pt-12" style={{ animationDelay: "0.18s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.dealRadar}
        </h2>
        <DealRadar games={radarGames} />
      </section>

      {/* Şu An Ücretsiz — şerit */}
      <section className="reveal pt-10" style={{ animationDelay: "0.2s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.freeNow}
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {freeStrip.map((o) => (
            <FreeCard key={o.title} offer={o} />
          ))}
        </div>
      </section>

      {/* Günün Fırsatları — ray */}
      <section id="deals" className="reveal pt-12" style={{ animationDelay: "0.24s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.todaysDeals}
        </h2>
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
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.tabNew}
        </h2>
        <div className="row-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
          {newReleases.map((game) => (
            <div key={game.slug} className="w-[280px] shrink-0 snap-start">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      {/* Popüler Oyunlar — grid */}
      <section id="popular" className="reveal pt-10" style={{ animationDelay: "0.32s" }}>
        <h2 className="font-display mb-4 text-lg font-bold text-bright sm:text-xl">
          {t.popularGames}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {popular.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
