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

/** Steam "Öne Çıkanlar ve Önerilenler" karuseli */
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
  const prev = () => setIndex((i) => (i - 1 + games.length) % games.length);
  const next = () => setIndex((i) => (i + 1) % games.length);

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="panel-strong grid overflow-hidden rounded shadow-lg md:grid-cols-[1.7fr_1fr]">
        {/* Büyük kapak — crossfade */}
        <Link
          href={`/oyun/${game.slug}`}
          className="relative block aspect-[460/215] md:aspect-auto md:min-h-[300px]"
        >
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

        {/* Sağ bilgi sütunu */}
        <div className="flex flex-col gap-3 p-5">
          <h3 className="text-xl font-extrabold leading-tight text-bright sm:text-2xl">
            {game.title}
          </h3>
          <p className="text-xs text-muted">
            {game.releaseYear} · {game.genres.join(" · ")}
          </p>
          <SubBadges ids={game.subscriptions} />

          <div className="mt-1 flex flex-col gap-1.5">
            {prices.map((rp, i) => (
              <div key={rp.price.store} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 truncate text-muted">
                  {STORES[rp.price.store].label}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/25">
                  <span
                    className="block h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((cheapestTRY / rp.tryAmount) * 100)}%`,
                      background: i === 0 ? "var(--best)" : "var(--accent)",
                      opacity: i === 0 ? 1 : 0.4,
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

          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            {prices[0] && <PriceTag rp={prices[0]} locale={locale} size="lg" highlight />}
            <Link
              href={`/oyun/${game.slug}`}
              className="rounded bg-gradient-to-r from-[#75b022] to-[#588a1b] px-4 py-2 text-sm font-bold text-white shadow transition-opacity hover:opacity-90"
            >
              {t.viewPrices}
            </Link>
          </div>
        </div>
      </div>

      {/* Oklar */}
      {games.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="carousel-arrow absolute -left-3 top-1/2 hidden h-16 w-9 -translate-y-1/2 items-center justify-center rounded text-2xl font-bold md:flex cursor-pointer"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="carousel-arrow absolute -right-3 top-1/2 hidden h-16 w-9 -translate-y-1/2 items-center justify-center rounded text-2xl font-bold md:flex cursor-pointer"
          >
            ›
          </button>
          <div className="mt-3 flex justify-center gap-1.5">
            {games.map((g, i) => (
              <button
                key={g.slug}
                onClick={() => setIndex(i)}
                aria-label={g.title}
                aria-current={i === index}
                className={`h-2.5 w-4 rounded-sm transition-colors cursor-pointer ${
                  i === index ? "bg-accent" : "bg-row-hover hover:bg-muted"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
