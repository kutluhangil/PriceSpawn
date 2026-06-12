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
    <div className="mx-auto w-[min(100%-2rem,60rem)] pt-5">
      {/* Steam içerik gezinme şeridi */}
      <p className="mb-3 text-xs text-muted">
        <Link href="/" className="text-accent transition-colors hover:text-bright">
          {t.allGames}
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-fg">{game.title}</span>
      </p>

      {/* Uygulama sayfası başlık bloğu */}
      <section className="panel-strong reveal relative overflow-hidden rounded">
        {game.coverUrl && (
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-2xl"
            style={{ backgroundImage: `url(${game.coverUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="relative flex flex-col gap-5 p-4 sm:flex-row sm:p-5">
          <CoverImage
            src={game.coverUrl}
            title={game.title}
            className="aspect-[460/215] w-full shrink-0 rounded-sm sm:w-80"
          />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-2xl font-extrabold leading-tight text-bright sm:text-[26px]">
              {game.title}
            </h1>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs">
              <dt className="uppercase text-muted">{t.scoreLabel}:</dt>
              <dd className="font-semibold text-accent">
                {reviewText(game.score, t)} <span className="text-muted">({game.score})</span>
              </dd>
              <dt className="uppercase text-muted">{game.releaseYear}</dt>
              <dd className="text-fg">{game.genres.join(", ")}</dd>
            </dl>
            <div className="mt-1">
              <SubBadges ids={game.subscriptions} size="md" />
            </div>
          </div>
        </div>
      </section>

      {/* Satın alma kutuları — Steam purchase box stili */}
      <section className="reveal mt-7" style={{ animationDelay: "0.1s" }}>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-bright">
          {t.allPrices}{" "}
          <span className="font-normal normal-case text-muted">
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
                className="panel relative flex items-center justify-between gap-4 rounded px-4 py-3.5 sm:px-5"
                style={
                  isBest
                    ? {
                        background: "var(--best-soft)",
                        boxShadow: "inset 0 0 0 1px var(--best), var(--shadow)",
                      }
                    : undefined
                }
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: store.accent }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-bold text-bright">{store.label}</span>
                  {isBest && (
                    <span className="shrink-0 rounded-sm bg-gradient-to-r from-[#75b022] to-[#588a1b] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
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
        <section className="reveal mt-7" style={{ animationDelay: "0.18s" }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-bright">
            {t.includedIn}
          </h2>
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {game.subscriptions.map((id) => {
              const sub = SUBSCRIPTIONS[id];
              return (
                <li
                  key={id}
                  className="panel flex items-center justify-between rounded px-4 py-3.5 sm:px-5"
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
  );
}
