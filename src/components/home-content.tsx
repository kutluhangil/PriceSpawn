"use client";

import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { SearchBar } from "@/components/search-bar";
import { GameCard } from "@/components/game-card";
import { Spotlight } from "@/components/spotlight";
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

  const spotlightGames = byDiscount.slice(0, 5);
  const deals = byDiscount.slice(5, 17);
  const spotlightSlugs = new Set([...spotlightGames, ...deals].map((g) => g.slug));
  const popular = GAMES.filter((g) => !spotlightSlugs.has(g.slug)).sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="mx-auto w-[min(100%-2rem,76rem)]">
      {/* Hero + arama — z-30: dropdown her zaman içerik üstünde */}
      <section className="reveal relative z-30 flex flex-col items-center gap-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {t.heroTitleA} <span className="text-accent">{t.heroTitleB}</span>
        </h1>
        <p className="max-w-xl text-sm text-muted sm:text-base">{t.tagline}</p>
        <div className="w-full pt-3">
          <SearchBar />
        </div>
      </section>

      {/* Spotlight karuseli */}
      <div className="reveal relative z-0" style={{ animationDelay: "0.1s" }}>
        <Spotlight games={spotlightGames} />
      </div>

      {/* Günün Fırsatları — yatay ray */}
      <section className="reveal pt-12" style={{ animationDelay: "0.18s" }}>
        <h2 className="font-display mb-4 text-lg font-extrabold sm:text-xl">
          {t.todaysDeals}
        </h2>
        <div className="row-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
          {deals.map((game) => (
            <div key={game.slug} className="w-[270px] shrink-0 snap-start">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      {/* Popüler Oyunlar — grid */}
      <section className="reveal pt-10" style={{ animationDelay: "0.26s" }}>
        <h2 className="font-display mb-4 text-lg font-extrabold sm:text-xl">
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
