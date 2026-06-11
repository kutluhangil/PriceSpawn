"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { useApp } from "@/components/providers";

export function GameCard({ game }: { game: Game }) {
  const { locale, t } = useApp();
  const best = bestPrice(game);

  return (
    <Link
      href={`/oyun/${game.slug}`}
      className="glass glass-hover group block overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <CoverImage
          src={game.coverUrl}
          title={game.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {best?.price.discountPercent !== undefined && (
          <span className="absolute right-2 top-2 rounded-lg bg-best px-2 py-0.5 font-display text-xs font-bold text-white shadow-lg">
            -%{best.price.discountPercent}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-sm font-semibold leading-snug">{game.title}</h3>
        <p className="text-xs text-muted">{game.genres.join(" · ")}</p>

        {best && (
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted">
                {t.cheapestAt} {STORES[best.price.store].label}
              </span>
              <span className="font-display text-lg font-bold text-best">
                {formatTRY(best.tryAmount, locale)}
              </span>
            </div>
          </div>
        )}

        <SubBadges ids={game.subscriptions} />
      </div>
    </Link>
  );
}
