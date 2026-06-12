"use client";

import Link from "next/link";
import type { Game } from "@/data/games";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";
import type { Dict } from "@/i18n";

function reviewText(score: number, t: Dict): string {
  if (score >= 90) return t.reviewOverwhelming;
  if (score >= 80) return t.reviewVeryPositive;
  if (score >= 70) return t.reviewMostlyPositive;
  return t.reviewMixed;
}

export function GameDetail({ game }: { game: Game }) {
  const { locale, t } = useApp();
  const prices = sortedPrices(game);

  return (
    <div>
      {/* Sinematik başlık: ambiyans + içerik */}
      <section className="relative overflow-hidden border-b border-border">
        {game.coverUrl && (
          <div
            className="ambient absolute inset-0 scale-125 bg-cover bg-center blur-3xl"
            style={{ backgroundImage: `url(${game.coverUrl})` }}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: "linear-gradient(to top, var(--bg) 4%, transparent 70%)" }}
        />
        <div className="reveal relative mx-auto w-[min(100%-2rem,60rem)] pb-10 pt-8">
          <p className="mb-5 text-xs text-muted">
            <Link href="/" className="font-semibold text-accent transition-colors hover:text-bright">
              ← {t.allGames}
            </Link>
          </p>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <CoverImage
              src={game.coverUrl}
              title={game.title}
              className="aspect-[460/215] w-full shrink-0 rounded-2xl shadow-2xl sm:w-80"
            />
            <div className="flex min-w-0 flex-col gap-2.5">
              <h1 className="font-display text-3xl font-bold leading-[1.05] text-bright sm:text-4xl">
                {game.title}
              </h1>
              <p className="text-sm text-muted">
                {game.releaseYear} · {game.genres.join(" · ")}
              </p>
              <p className="text-sm">
                <span className="font-semibold text-accent">{reviewText(game.score, t)}</span>{" "}
                <span className="text-muted">· {game.score}/100</span>
              </p>
              <div className="mt-1">
                <SubBadges ids={game.subscriptions} size="md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-[min(100%-2rem,60rem)]">
        {/* Fiyatlar */}
        <section className="reveal mt-8" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display mb-4 text-lg font-bold text-bright">
            {t.allPrices}{" "}
            <span className="text-sm font-normal text-muted">
              ({prices.length} {t.storesCount})
            </span>
          </h2>
          <ul className="flex flex-col gap-2.5">
            {prices.map((rp, i) => {
              const store = STORES[rp.price.store];
              const isBest = i === 0;
              return (
                <li
                  key={rp.price.store}
                  className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-4 sm:px-5 ${
                    isBest ? "spectrum-ring shadow-lg" : "panel"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: store.accent }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-bold text-bright">
                      {store.label}
                    </span>
                    {isBest && (
                      <span className="discount-chip shrink-0 rounded-full px-2 py-0.5 text-[10px]">
                        {t.cheapest}
                      </span>
                    )}
                  </span>

                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <PriceTag rp={rp} locale={locale} highlight={isBest} />
                    {rp.price.currency === "USD" && (
                      <span className="text-[11px] text-muted">
                        ${rp.price.amount.toFixed(2)} · {t.steamNote}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Abonelikler */}
        {game.subscriptions.length > 0 && (
          <section className="reveal mt-8" style={{ animationDelay: "0.18s" }}>
            <h2 className="font-display mb-4 text-lg font-bold text-bright">{t.includedIn}</h2>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {game.subscriptions.map((id) => {
                const sub = SUBSCRIPTIONS[id];
                return (
                  <li
                    key={id}
                    className="panel flex items-center justify-between rounded-2xl px-4 py-4 sm:px-5"
                  >
                    <span className="text-sm font-bold" style={{ color: sub.accent }}>
                      {sub.label}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-bright">
                      {formatTRY(sub.monthlyTRY, locale)}
                      <span className="text-xs font-normal text-muted">{t.perMonth}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
