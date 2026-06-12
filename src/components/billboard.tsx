"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Game } from "@/data/games";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { StoreLogo } from "@/components/store-logo";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

/** Upgrade a Steam header.jpg to the larger, sharper capsule when possible. */
function bigCover(url: string): string {
  return /\/apps\/\d+\/header\.jpg$/.test(url)
    ? url.replace(/header\.jpg$/, "capsule_616x353.jpg")
    : url;
}

/** Steam-style featured showcase: large clear image left, info panel right. */
export function Billboard({ games }: { games: Game[] }) {
  const { locale, t } = useApp();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || games.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % games.length), 7000);
    return () => clearInterval(id);
  }, [paused, games.length]);

  if (games.length === 0) return null;
  const game = games[index];
  const prices = sortedPrices(game).slice(0, 4);
  const best = prices[0];
  const prev = () => setIndex((i) => (i - 1 + games.length) % games.length);
  const next = () => setIndex((i) => (i + 1) % games.length);

  return (
    <section
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={t.featured}
    >
      <div className="panel-strong grid overflow-hidden rounded-2xl md:grid-cols-[1.7fr_1fr]">
        {/* Büyük net görsel */}
        <Link href={`/oyun/${game.slug}`} className="group relative block aspect-[616/353] overflow-hidden">
          <CoverImage
            key={game.slug}
            src={bigCover(game.coverUrl)}
            title={game.title}
            className="billboard-fade h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
          {best?.price.discountPercent !== undefined && (
            <span className="discount-chip absolute left-4 top-4 rounded-lg px-2.5 py-1 text-sm shadow-lg">
              -%{best.price.discountPercent}
            </span>
          )}
        </Link>

        {/* Bilgi paneli */}
        <div className="flex flex-col gap-3 bg-(--row) p-5 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
            {t.featured}
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-bright">
            {game.title}
          </h2>
          <p className="text-xs text-muted">
            {game.releaseYear} · {game.genres.join(" · ")}
          </p>
          <SubBadges ids={game.subscriptions} size="md" />

          {/* Mağaza fiyat satırları */}
          <div className="mt-1 flex flex-col divide-y divide-border">
            {prices.map((rp, i) => (
              <div key={rp.price.store} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="flex items-center gap-2 text-muted">
                  <StoreLogo id={rp.price.store} size={15} />
                  {STORES[rp.price.store].label}
                </span>
                <span className={`font-semibold tabular-nums ${i === 0 ? "text-best" : "text-muted"}`}>
                  {formatTRY(rp.tryAmount, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            {best && <PriceTag rp={best} locale={locale} size="lg" highlight />}
            <Link
              href={`/oyun/${game.slug}`}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
            >
              {t.viewPrices}
            </Link>
          </div>
        </div>
      </div>

      {/* Oklar + noktalar */}
      {games.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous"
            className="absolute -left-3 top-1/3 hidden h-14 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/80 text-xl text-fg backdrop-blur transition-colors hover:text-bright md:flex cursor-pointer"
          >
            ‹
          </button>
          <button
            onClick={next}
            aria-label="Next"
            className="absolute -right-3 top-1/3 hidden h-14 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-bg/80 text-xl text-fg backdrop-blur transition-colors hover:text-bright md:flex cursor-pointer"
          >
            ›
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {games.map((g, i) => (
              <button
                key={g.slug}
                onClick={() => setIndex(i)}
                aria-label={g.title}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? "w-8 bg-accent" : "w-4 bg-(--row-hover) hover:bg-muted"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
