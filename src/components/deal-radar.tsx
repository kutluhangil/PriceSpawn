"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { useApp } from "@/components/providers";

// discount% → heat color (cool blue → hot green-yellow)
function heat(pct: number): string {
  const stops: [number, string][] = [
    [20, "#1e3a8a"],
    [40, "#0e7490"],
    [55, "#15803d"],
    [70, "#65a30d"],
    [85, "#bef264"],
  ];
  let color = stops[0][1];
  for (const [p, c] of stops) if (pct >= p) color = c;
  return color;
}

export function DealRadar({ games }: { games: Game[] }) {
  const { locale } = useApp();

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 lg:grid-cols-9">
      {games.map((g) => {
        const best = bestPrice(g);
        const pct = best?.price.discountPercent ?? 0;
        return (
          <Link
            key={g.slug}
            href={`/oyun/${g.slug}`}
            className="heat-block group relative flex aspect-square flex-col items-center justify-center rounded-lg p-1 text-center"
            style={{ background: heat(pct) }}
            title={g.title}
          >
            <span className="font-display text-sm font-extrabold text-white drop-shadow sm:text-base">
              -%{pct}
            </span>
            <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-black/80 px-1 text-center opacity-0 transition-opacity group-hover:opacity-100">
              <span className="line-clamp-3 text-[10px] font-semibold text-white">{g.title}</span>
              {best && (
                <span className="text-xs font-bold text-best">
                  {formatTRY(best.tryAmount, locale)}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
