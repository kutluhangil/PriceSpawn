"use client";

import { useState } from "react";
import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { GameCard } from "@/components/game-card";
import { GameRow } from "@/components/game-row";
import { Spotlight } from "@/components/spotlight";
import { useApp } from "@/components/providers";

type TabId = "new" | "discount" | "rated";

export function HomeContent() {
  const { t } = useApp();
  const [tab, setTab] = useState<TabId>("new");

  const withDiscount = GAMES.map((game) => ({
    game,
    discount: bestPrice(game)?.price.discountPercent ?? 0,
  }));

  const byDiscount = withDiscount
    .filter((x) => x.discount > 0)
    .sort((a, b) => b.discount - a.discount)
    .map((x) => x.game);

  const spotlightGames = byDiscount.slice(0, 5);
  const offers = byDiscount.slice(5, 17);

  const tabGames: Record<TabId, typeof GAMES> = {
    new: [...GAMES].sort((a, b) => b.releaseYear - a.releaseYear || b.score - a.score).slice(0, 10),
    discount: byDiscount.slice(0, 10),
    rated: [...GAMES].sort((a, b) => b.score - a.score).slice(0, 10),
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "new", label: t.tabNew },
    { id: "discount", label: t.tabDiscount },
    { id: "rated", label: t.tabRated },
  ];

  return (
    <div className="mx-auto w-[min(100%-2rem,71rem)] pt-6">
      {/* Öne Çıkanlar */}
      <section className="reveal">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-bright">
          {t.featuredSection}
        </h2>
        <Spotlight games={spotlightGames} />
      </section>

      {/* Özel Teklifler */}
      <section id="offers" className="reveal pt-10" style={{ animationDelay: "0.1s" }}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-bright">
          {t.specialOffers}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {offers.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* Sekmeli listeler */}
      <section className="reveal pt-10" style={{ animationDelay: "0.18s" }}>
        <div role="tablist" className="flex gap-1 px-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className="tab-btn rounded-t px-4 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="panel rounded-b rounded-tr p-2">
          <div key={tab} className="reveal flex flex-col gap-1">
            {tabGames[tab].map((game) => (
              <GameRow key={game.slug} game={game} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
