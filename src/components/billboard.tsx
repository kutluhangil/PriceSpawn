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
import { StoreLink } from "@/components/store-link";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

/**
 * Steam serves a `capsule_616x353.jpg` next to every `header.jpg` — it matches
 * the billboard's exact aspect ratio and is far more reliable than
 * `library_hero.jpg` (which 404s for many older/indie titles). We fall back to
 * the original header art if the capsule is missing.
 */
function bigCover(url: string): string {
  return url.replace(/header\.jpg(\?.*)?$/, "capsule_616x353.jpg$1");
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
      <div className="panel-strong grid overflow-hidden rounded-[var(--radius-card)] md:grid-cols-[1.7fr_1fr]">
        {/* Büyük net görsel + gezinme okları */}
        <div className="group/img relative aspect-[616/353] overflow-hidden">
          <Link href={`/oyun/${game.slug}`} className="block h-full w-full">
            <CoverImage
              key={game.slug}
              src={bigCover(game.coverUrl)}
              fallbackSrc={game.coverUrl}
              title={game.title}
              sizes="(max-width: 768px) 100vw, 760px"
              quality={90}
              className="billboard-fade h-full w-full transition-transform duration-700 group-hover/img:scale-[1.04]"
            />
          </Link>

          {best?.price.discountPercent !== undefined && (
            <span className="discount-chip pointer-events-none absolute left-4 top-4 rounded-lg px-2.5 py-1 text-sm shadow-lg">
              -%{best.price.discountPercent}
            </span>
          )}

          {/* Premium gezinme okları — görselin içinde, dikey ortalı */}
          {games.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous"
                className="nav-arrow absolute left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/img:opacity-100 focus-visible:opacity-100"
              >
                <ChevronLeft />
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="nav-arrow absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/img:opacity-100 focus-visible:opacity-100"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

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
              <StoreLink
                key={rp.price.store}
                game={game}
                price={rp.price}
                className="flex w-full items-center justify-between gap-3 py-1.5 text-left text-sm transition-colors hover:text-bright"
              >
                <span className="flex items-center gap-2 text-muted">
                  <StoreLogo id={rp.price.store} size={15} />
                  {STORES[rp.price.store].label} ↗
                </span>
                <span className={`font-semibold tabular-nums ${i === 0 ? "text-best" : "text-muted"}`}>
                  {formatTRY(rp.tryAmount, locale)}
                </span>
              </StoreLink>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
            {best && <PriceTag rp={best} locale={locale} size="lg" highlight />}
            <Link
              href={`/oyun/${game.slug}`}
              className="shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
            >
              {t.viewPrices}
            </Link>
          </div>
        </div>
      </div>

      {/* Sayfa noktaları */}
      {games.length > 1 && (
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
      )}
    </section>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
