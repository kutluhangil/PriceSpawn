"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

export function GameCard({ game }: { game: Game }) {
  const { locale } = useApp();
  const prices = sortedPrices(game);
  const best = prices[0];
  const peek = prices.slice(0, 3);

  return (
    <Link
      href={`/oyun/${game.slug}`}
      className="surface group block h-full overflow-hidden rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50"
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <CoverImage
          src={game.coverUrl}
          title={game.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* Hover'da: en ucuz 3 mağaza */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/90 via-black/75 to-transparent px-3 pb-2 pt-6 transition-transform duration-300 group-hover:translate-y-0">
          {peek.map((rp) => (
            <div
              key={rp.price.store}
              className="flex items-center justify-between text-[11px] leading-5"
            >
              <span className="text-white/75">{STORES[rp.price.store].label}</span>
              <span className="font-semibold tabular-nums text-white">
                {formatTRY(rp.tryAmount, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-3.5">
        <h3 className="truncate text-sm font-bold">{game.title}</h3>
        <p className="truncate text-xs text-muted">{game.genres.join(" · ")}</p>

        <div className="mt-1.5 flex items-end justify-between gap-2">
          <SubBadges ids={game.subscriptions} />
          {best && (
            <span className="ml-auto flex flex-col items-end">
              <PriceTag rp={best} locale={locale} size="sm" />
              <span className="text-[10px] text-muted">
                {STORES[best.price.store].label}
              </span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
