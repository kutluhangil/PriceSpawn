"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

export function GameCard({ game }: { game: Game }) {
  const { locale, t } = useApp();
  const best = bestPrice(game);

  return (
    <Link
      href={`/oyun/${game.slug}`}
      className="panel-strong group block h-full overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <CoverImage
          src={game.coverUrl}
          title={game.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {best?.price.discountPercent !== undefined && (
          <span className="discount-chip absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-xs shadow-lg">
            -%{best.price.discountPercent}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3.5">
        <h3 className="truncate text-sm font-bold text-bright">{game.title}</h3>
        <p className="truncate text-xs text-muted">{game.genres.join(" · ")}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <SubBadges ids={game.subscriptions} />
          {best && (
            <span className="ml-auto flex shrink-0 flex-col items-end">
              <span className="text-[10px] uppercase tracking-wide text-muted">
                {t.cheapestAt} {STORES[best.price.store].label}
              </span>
              <PriceTag rp={best} locale={locale} size="sm" highlight />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
