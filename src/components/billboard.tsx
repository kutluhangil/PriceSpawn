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

/** Sinematik vitrin: bulanık oyun ambiyansı + sol bilgi, sağ yüzen kapak */
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
  const prices = sortedPrices(game).slice(0, 3);
  const best = prices[0];

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-border"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={t.featured}
    >
      {/* Ambiyans: kapağın kendisi atmosfer olur */}
      {games.map((g, i) => (
        <div
          key={g.slug}
          aria-hidden="true"
          className={`ambient absolute inset-0 scale-125 bg-cover bg-center blur-3xl transition-opacity duration-1000 ${
            i === index ? "" : "!opacity-0"
          }`}
          style={g.coverUrl ? { backgroundImage: `url(${g.coverUrl})` } : { background: "var(--accent-soft)" }}
        />
      ))}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{ background: "linear-gradient(100deg, var(--bg) 8%, transparent 60%)" }}
      />

      <div
        key={game.slug}
        className="billboard-fade relative grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:p-12"
      >
        {/* Sol: bilgi */}
        <div className="flex min-w-0 flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            {t.featured}
          </p>
          <h2 className="font-display text-3xl font-bold leading-[1.05] text-bright sm:text-4xl">
            {game.title}
          </h2>
          <p className="text-sm text-muted">
            {game.releaseYear} · {game.genres.join(" · ")}
          </p>
          <SubBadges ids={game.subscriptions} size="md" />

          <div className="mt-1 flex max-w-sm flex-col gap-1">
            {prices.map((rp, i) => (
              <div
                key={rp.price.store}
                className="flex items-baseline justify-between gap-4 text-sm"
              >
                <span className={i === 0 ? "font-semibold text-fg" : "text-muted"}>
                  {STORES[rp.price.store].label}
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    i === 0 ? "text-best" : "text-muted"
                  }`}
                >
                  {formatTRY(rp.tryAmount, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4">
            {best && <PriceTag rp={best} locale={locale} size="lg" highlight />}
            <Link
              href={`/oyun/${game.slug}`}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
            >
              {t.viewPrices}
            </Link>
          </div>
        </div>

        {/* Sağ: yüzen kapak */}
        <Link
          href={`/oyun/${game.slug}`}
          className="group relative hidden lg:block"
          tabIndex={-1}
          aria-hidden="true"
        >
          <CoverImage
            src={game.coverUrl}
            title={game.title}
            className="aspect-[460/215] w-full rotate-[1.2deg] rounded-2xl shadow-2xl transition-transform duration-500 group-hover:rotate-0 group-hover:scale-[1.02]"
          />
        </Link>
      </div>

      {/* İlerleme çizgileri */}
      {games.length > 1 && (
        <div className="relative flex justify-center gap-2 pb-5">
          {games.map((g, i) => (
            <button
              key={g.slug}
              onClick={() => setIndex(i)}
              aria-label={g.title}
              aria-current={i === index}
              className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                i === index
                  ? "w-10 bg-gradient-to-r from-[#ff6b6b] via-[#4ade80] to-[#a78bfa]"
                  : "w-5 bg-(--row-hover) hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
