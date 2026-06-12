"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

/** Steam arama sonucu satırı: küçük kapsül + başlık/tür + sağda fiyat */
export function GameRow({ game }: { game: Game }) {
  const { locale } = useApp();
  const best = bestPrice(game);

  return (
    <Link
      href={`/oyun/${game.slug}`}
      className="game-row flex items-center gap-3 rounded-sm px-2.5 py-2 transition-colors"
    >
      <CoverImage
        src={game.coverUrl}
        title={game.title}
        className="h-[42px] w-[112px] shrink-0 rounded-sm"
      />
      <span className="min-w-0 flex-1">
        <span className="row-title block truncate text-[13px] font-semibold text-fg transition-colors">
          {game.title}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className="truncate text-[11px] text-muted">
            {game.releaseYear} · {game.genres.join(", ")}
          </span>
          <SubBadges ids={game.subscriptions} />
        </span>
      </span>
      {best && (
        <span className="flex shrink-0 flex-col items-end">
          <PriceTag rp={best} locale={locale} size="sm" />
          <span className="text-[10px] text-muted">{STORES[best.price.store].label}</span>
        </span>
      )}
    </Link>
  );
}
