"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Game } from "@/data/games";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

/** Steam "öne çıkanlar" tarzı karusel: büyük kapak + mağaza fiyat çubukları */
export function Spotlight({ games }: { games: Game[] }) {
  const { locale, t } = useApp();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || games.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % games.length), 6000);
    return () => clearInterval(id);
  }, [paused, games.length]);

  if (games.length === 0) return null;
  const game = games[index];
  const prices = sortedPrices(game).slice(0, 4);
  const cheapestTRY = prices[0]?.tryAmount ?? 1;

  return (
    <section
      className="surface overflow-hidden rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="grid md:grid-cols-[1.55fr_1fr]">
        {/* Kapak — crossfade */}
        <Link href={`/oyun/${game.slug}`} className="relative block aspect-[460/215] md:aspect-auto md:min-h-[290px]">
          {games.map((g, i) => (
            <div
              key={g.slug}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== index}
            >
              <CoverImage src={g.coverUrl} title={g.title} className="h-full w-full" />
            </div>
          ))}
        </Link>

        {/* Bilgi paneli */}
        <div className="flex flex-col gap-3 p-5 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
            {t.featured}
          </p>
          <h2 className="font-display text-xl font-extrabold leading-tight sm:text-2xl">
            {game.title}
          </h2>
          <SubBadges ids={game.subscriptions} size="md" />

          {/* Mağaza fiyat çubukları: uzun çubuk = daha iyi fiyat */}
          <div className="mt-1 flex flex-col gap-2">
            {prices.map((rp, i) => (
              <div key={rp.price.store} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 truncate text-muted">
                  {STORES[rp.price.store].label}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((cheapestTRY / rp.tryAmount) * 100)}%`,
                      background: i === 0 ? "var(--best)" : "var(--accent)",
                      opacity: i === 0 ? 1 : 0.45,
                    }}
                  />
                </span>
                <span
                  className={`w-20 shrink-0 text-right font-bold tabular-nums ${
                    i === 0 ? "text-best" : "text-muted"
                  }`}
                >
                  {formatTRY(rp.tryAmount, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-2">
            {prices[0] && <PriceTag rp={prices[0]} locale={locale} size="lg" highlight />}
            <Link
              href={`/oyun/${game.slug}`}
              className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {t.viewPrices}
            </Link>
          </div>
        </div>
      </div>

      {/* Noktalar */}
      {games.length > 1 && (
        <div className="flex justify-center gap-1.5 border-t border-border py-2.5">
          {games.map((g, i) => (
            <button
              key={g.slug}
              onClick={() => setIndex(i)}
              aria-label={g.title}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                i === index ? "w-6 bg-accent" : "w-3 bg-surface-2 hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
