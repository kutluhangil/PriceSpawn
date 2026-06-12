"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { CoverImage } from "@/components/cover-image";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

/** Steam "Özel Teklifler" kapsülü: kapak + alt fiyat şeridi */
export function GameCard({ game }: { game: Game }) {
  const { locale } = useApp();
  const best = bestPrice(game);

  return (
    <Link
      href={`/oyun/${game.slug}`}
      aria-label={game.title}
      className="panel-strong group block overflow-hidden rounded transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(102,192,244,0.4)]"
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <CoverImage
          src={game.coverUrl}
          title={game.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-xs font-semibold text-muted transition-colors group-hover:text-bright">
          {game.title}
        </span>
        {best && <PriceTag rp={best} locale={locale} size="sm" />}
      </div>
    </Link>
  );
}
