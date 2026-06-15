"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { HoverTrailer } from "@/components/hover-trailer";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { DealVerdict } from "@/components/deal-verdict";
import { StoreLogo } from "@/components/store-logo";
import { StoreLink } from "@/components/store-link";
import { WatchButton } from "@/components/watch-button";
import { useApp } from "@/components/providers";

export function GameCard({ game }: { game: Game }) {
  const { locale, t, priceLoaded } = useApp();
  const best = bestPrice(game);

  return (
    <Link
      href={`/oyun/${game.slug}`}
      className="group block h-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_14px_40px_rgba(0,0,0,0.35)]"
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <HoverTrailer game={game}>
          <CoverImage
            src={game.coverUrl}
            title={game.title}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </HoverTrailer>
        <span className="pointer-events-none absolute left-2 top-2">
          <DealVerdict game={game} variant="compact" />
        </span>
        {!game.unreleased && best?.price.discountPercent !== undefined && (
          <span className="discount-chip absolute bottom-2 left-2 rounded-[3px] px-1.5 py-0.5 text-xs shadow-lg">
            -%{best.price.discountPercent}
          </span>
        )}
        {game.unreleased && (
          <span className="absolute bottom-2 left-2 rounded-[3px] bg-accent px-1.5 py-0.5 text-[11px] font-bold text-white shadow-lg">
            🕓 {t.comingSoon} · {game.releaseYear}
          </span>
        )}
        <span className="absolute right-2 top-2">
          <WatchButton slug={game.slug} compact />
        </span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <h3 className="truncate text-sm font-bold text-bright">{game.title}</h3>

        {/* Steam tarzı düz etiket çipleri */}
        <div className="flex flex-wrap gap-1">
          {game.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="rounded-[3px] bg-(--row-hover) px-1.5 py-0.5 text-[10px] font-medium text-muted"
            >
              {g}
            </span>
          ))}
        </div>

        <div className="mt-0.5 flex items-end justify-between gap-2">
          <SubBadges ids={game.subscriptions} />
          {game.unreleased ? (
            <span className="ml-auto text-xs font-semibold text-muted">{t.comingSoon}</span>
          ) : best ? (
            <span className="ml-auto flex shrink-0 flex-col items-end">
              <StoreLink
                game={game}
                price={best.price}
                nested
                className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted transition-colors hover:text-fg"
              >
                <StoreLogo id={best.price.store} size={12} /> {STORES[best.price.store].label} ↗
              </StoreLink>
              <PriceTag rp={best} locale={locale} size="sm" highlight />
            </span>
          ) : priceLoaded ? (
            <span className="ml-auto text-xs text-muted">{t.noPriceFound}</span>
          ) : (
            <span className="ml-auto h-5 w-20 animate-shimmer rounded" />
          )}
        </div>
        <span className="sr-only">{t.cheapestAt}</span>
      </div>
    </Link>
  );
}
