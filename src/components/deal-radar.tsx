"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";
import { useApp } from "@/components/providers";

/** Compact deal grid: cover thumbnail + discount badge, price on hover. */
export function DealRadar({ games }: { games: Game[] }) {
  const { locale } = useApp();

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
      {games.map((g) => {
        const best = bestPrice(g);
        const pct = best?.price.discountPercent ?? 0;
        return (
          <Link
            key={g.slug}
            href={`/oyun/${g.slug}`}
            title={g.title}
            className="group relative block overflow-hidden rounded-xl border border-border transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_14px_36px_rgba(0,0,0,0.35)]"
          >
            <div className="relative aspect-[460/215] overflow-hidden">
              <CoverImage
                src={g.coverUrl}
                title={g.title}
                className="h-full w-full transition-transform duration-500 group-hover:scale-105"
              />
              <span className="discount-chip absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-xs shadow-lg">
                -%{pct}
              </span>
              {/* alttan kayan fiyat */}
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1.5 pt-6">
                <span className="truncate text-[11px] font-semibold text-white/90">{g.title}</span>
                {best && (
                  <span className="shrink-0 text-xs font-bold text-best">
                    {formatTRY(best.tryAmount, locale)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
