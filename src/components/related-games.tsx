"use client";

import type { Game } from "@/data/games";
import { GAMES } from "@/data/games";
import { GameCard } from "@/components/game-card";
import { relatedGames } from "@/lib/related";
import { useApp } from "@/components/providers";

/** "Similar games" grid for the detail page — genre-based, links across the catalog. */
export function RelatedGames({ game }: { game: Game }) {
  const { t } = useApp();
  const items = relatedGames(game, GAMES, 4);
  if (items.length === 0) return null;

  return (
    <section className="reveal mt-10" style={{ animationDelay: "0.28s" }}>
      <h2 className="font-display mb-4 text-lg font-bold text-bright">{t.relatedGames}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </section>
  );
}
