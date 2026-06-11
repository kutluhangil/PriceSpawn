"use client";

import type { Game } from "@/data/games";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { CoverImage } from "@/components/cover-image";
import { useApp } from "@/components/providers";

export function GameDetail({ game }: { game: Game }) {
  const { locale, t } = useApp();
  const prices = sortedPrices(game);

  return (
    <div className="mx-auto w-[min(100%-2rem,56rem)] pt-10">
      {/* Başlık paneli */}
      <section className="glass relative overflow-hidden rounded-3xl">
        {game.coverUrl && (
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-30 blur-2xl"
            style={{ backgroundImage: `url(${game.coverUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <CoverImage
            src={game.coverUrl}
            title={game.title}
            className="aspect-[460/215] w-full shrink-0 rounded-2xl sm:w-72"
          />
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-xl font-bold leading-tight sm:text-3xl">
              {game.title}
            </h1>
            <p className="text-sm text-muted">
              {game.releaseYear} · {game.genres.join(" · ")}
            </p>
            <span
              className="glass inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              title={t.scoreLabel}
            >
              <span className="h-2 w-2 rounded-full bg-best" aria-hidden="true" />
              {t.scoreLabel}: {game.score}
            </span>
          </div>
        </div>
      </section>

      {/* Fiyat listesi */}
      <section className="mt-8">
        <h2 className="font-display mb-4 text-lg font-bold">
          {t.allPrices}{" "}
          <span className="text-sm font-normal text-muted">
            ({prices.length} {t.storesCount})
          </span>
        </h2>
        <ul className="flex flex-col gap-3">
          {prices.map((rp, i) => {
            const store = STORES[rp.price.store];
            const isBest = i === 0;
            return (
              <li
                key={rp.price.store}
                className={`glass flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${
                  isBest ? "ring-2 ring-best/60" : ""
                }`}
                style={isBest ? { background: "var(--best-soft)" } : undefined}
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: store.accent }}
                    aria-hidden="true"
                  />
                  <span className="font-semibold">{store.label}</span>
                  {isBest && (
                    <span className="rounded-lg bg-best px-2 py-0.5 font-display text-[10px] font-bold text-white">
                      {t.cheapest}
                    </span>
                  )}
                </span>

                <span className="text-right">
                  <span className="flex items-baseline justify-end gap-2">
                    {rp.price.discountPercent !== undefined && (
                      <span className="rounded-md bg-danger/15 px-1.5 py-0.5 text-xs font-bold text-danger">
                        -%{rp.price.discountPercent}
                      </span>
                    )}
                    {rp.tryOriginal !== undefined && (
                      <span className="text-xs text-muted line-through">
                        {formatTRY(rp.tryOriginal, locale)}
                      </span>
                    )}
                    <span
                      className={`font-display text-lg font-bold ${
                        isBest ? "text-best" : ""
                      }`}
                    >
                      {formatTRY(rp.tryAmount, locale)}
                    </span>
                  </span>
                  {rp.price.currency === "USD" && (
                    <span className="block text-[11px] text-muted">
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
        <section className="mt-8">
          <h2 className="font-display mb-4 text-lg font-bold">{t.includedIn}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {game.subscriptions.map((id) => {
              const sub = SUBSCRIPTIONS[id];
              return (
                <li
                  key={id}
                  className="glass flex items-center justify-between rounded-2xl px-5 py-4"
                  style={{ borderColor: `${sub.accent}55` }}
                >
                  <span className="font-semibold" style={{ color: sub.accent }}>
                    {sub.label}
                  </span>
                  <span className="font-display text-sm font-bold">
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
