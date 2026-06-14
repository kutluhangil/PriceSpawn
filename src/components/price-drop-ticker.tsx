"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Auto-scrolling strip of the biggest live price drops. Pauses on hover. */
export function PriceDropTicker({ games }: { games: Game[] }) {
  const { t, locale } = useApp();

  const items = games
    .map((g) => ({ g, best: bestPrice(g) }))
    // Real paid drops read better than a wall of 100%-off ₺0 freebies.
    .filter((x) => {
      const d = x.best?.price.discountPercent;
      return d !== undefined && d > 0 && d < 100 && (x.best?.tryAmount ?? 0) > 0;
    })
    .slice(0, 16);

  // Need a few to make the marquee read as a feed, not a glitch.
  if (items.length < 4) return null;
  const loop = [...items, ...items];

  return (
    <div className="ticker-wrap panel-strong flex items-stretch overflow-hidden rounded-full">
      <div className="flex shrink-0 items-center gap-1.5 rounded-l-full bg-(--row) px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
        <span aria-hidden="true">🔥</span>
        <span className="hidden sm:inline">{t.tickerLabel}</span>
      </div>
      <div className="ticker-mask relative min-w-0 flex-1">
        <div className="ticker-track flex items-center gap-7 py-2.5 pl-6">
          {loop.map(({ g, best }, i) => (
            <Link
              key={`${g.slug}-${i}`}
              href={`/oyun/${g.slug}`}
              className="group flex shrink-0 items-center gap-2 text-sm"
              aria-hidden={i >= items.length}
              tabIndex={i >= items.length ? -1 : undefined}
            >
              <span className="discount-chip rounded px-1.5 py-0.5 text-[11px]">
                -%{best!.price.discountPercent}
              </span>
              <span className="font-semibold text-fg transition-colors group-hover:text-bright">
                {g.title}
              </span>
              <span className="inline-flex items-center gap-1 font-bold tabular-nums text-best">
                <StoreLogo id={best!.price.store} size={12} />
                {formatTRY(best!.tryAmount, locale)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
