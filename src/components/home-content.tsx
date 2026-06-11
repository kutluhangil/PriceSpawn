"use client";

import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { SearchBar } from "@/components/search-bar";
import { GameCard } from "@/components/game-card";
import { useApp } from "@/components/providers";

export function HomeContent() {
  const { t } = useApp();

  const withDiscount = GAMES.map((game) => ({
    game,
    discount: bestPrice(game)?.price.discountPercent ?? 0,
  }));

  const deals = withDiscount
    .filter((x) => x.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .slice(0, 6)
    .map((x) => x.game);

  const dealSlugs = new Set(deals.map((g) => g.slug));
  const popular = GAMES.filter((g) => !dealSlugs.has(g.slug)).sort(
    (a, b) => b.score - a.score
  );

  return (
    <div className="mx-auto w-[min(100%-2rem,72rem)]">
      {/* Hero */}
      <section className="reveal flex flex-col items-center gap-6 pb-14 pt-16 text-center sm:pt-24">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t.heroTitleA} <span className="gradient-text">{t.heroTitleB}</span>
        </h1>
        <p className="max-w-xl text-sm text-muted sm:text-base">{t.tagline}</p>
        <div className="w-full pt-2">
          <SearchBar />
        </div>
      </section>

      {/* Günün Fırsatları */}
      <section className="reveal pb-12" style={{ animationDelay: "0.12s" }}>
        <h2 className="font-display mb-4 text-lg font-bold sm:text-xl">
          <span className="gradient-text">{t.todaysDeals}</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deals.map((game, i) => (
            <div key={game.slug} className="reveal" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
              <GameCard game={game} />
            </div>
          ))}
        </div>
      </section>

      {/* Popüler Oyunlar */}
      <section className="reveal" style={{ animationDelay: "0.3s" }}>
        <h2 className="font-display mb-4 text-lg font-bold sm:text-xl">
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
