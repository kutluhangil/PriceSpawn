"use client";

import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { SearchBar } from "@/components/search-bar";
import { GameCard } from "@/components/game-card";
import { Billboard } from "@/components/billboard";
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
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-bright sm:text-5xl">
          {t.heroTitleA} <span className="spectrum-text">{t.heroTitleB}</span>
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

      {/* Günün Fırsatları — ray */}
      <section className="reveal pt-12" style={{ animationDelay: "0.2s" }}>
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
      <section className="reveal pt-10" style={{ animationDelay: "0.26s" }}>
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
      <section className="reveal pt-10" style={{ animationDelay: "0.32s" }}>
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
