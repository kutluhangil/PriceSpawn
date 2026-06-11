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

export function GameDetail({ game }: { game: Game }) {
  const { locale, t } = useApp();
  const prices = sortedPrices(game);
  const cheapestTRY = prices[0]?.tryAmount ?? 1;

  return (
    <div className="mx-auto w-[min(100%-2rem,60rem)] pt-8">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-fg"
      >
        <span aria-hidden="true">←</span> {t.backHome}
      </Link>

      {/* Başlık bandı */}
      <section className="surface reveal relative overflow-hidden rounded-xl">
        {game.coverUrl && (
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-25 blur-3xl"
            style={{ backgroundImage: `url(${game.coverUrl})` }}
            aria-hidden="true"
          />
        )}
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
          <CoverImage
            src={game.coverUrl}
            title={game.title}
            className="aspect-[460/215] w-full shrink-0 rounded-lg sm:w-80"
          />
          <div className="flex min-w-0 flex-col gap-2.5">
            <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              {game.title}
            </h1>
            <p className="text-sm text-muted">
              {game.releaseYear} · {game.genres.join(" · ")}
            </p>
            <p className="flex items-center gap-2 text-xs font-bold">
              <span className="discount-chip rounded px-1.5 py-0.5">{game.score}</span>
              <span className="text-muted">{t.scoreLabel}</span>
            </p>
            <SubBadges ids={game.subscriptions} size="md" />
          </div>
        </div>
      </section>

      {/* Fiyatlar */}
      <section className="reveal mt-8" style={{ animationDelay: "0.1s" }}>
        <h2 className="font-display mb-3 text-lg font-extrabold">
          {t.allPrices}{" "}
          <span className="text-sm font-normal text-muted">
            ({prices.length} {t.storesCount})
          </span>
        </h2>
        <ul className="surface divide-y divide-border overflow-hidden rounded-xl">
          {prices.map((rp, i) => {
            const store = STORES[rp.price.store];
            const isBest = i === 0;
            const barPct = Math.round((cheapestTRY / rp.tryAmount) * 100);
            return (
              <li
                key={rp.price.store}
                className="relative flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
                style={isBest ? { background: "var(--best-soft)" } : undefined}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: store.accent }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-bold">{store.label}</span>
                  {isBest && (
                    <span className="shrink-0 rounded bg-best px-1.5 py-0.5 font-display text-[10px] font-extrabold text-black">
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

                {/* Göreli fiyat çubuğu: tam çubuk = en ucuz */}
                <span
                  className="absolute bottom-0 left-0 h-[3px] transition-all"
                  style={{
                    width: `${barPct}%`,
                    background: isBest ? "var(--best)" : "var(--accent)",
                    opacity: isBest ? 0.9 : 0.3,
                  }}
                  aria-hidden="true"
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Abonelikler */}
      {game.subscriptions.length > 0 && (
        <section className="reveal mt-8" style={{ animationDelay: "0.18s" }}>
          <h2 className="font-display mb-3 text-lg font-extrabold">{t.includedIn}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {game.subscriptions.map((id) => {
              const sub = SUBSCRIPTIONS[id];
              return (
                <li
                  key={id}
                  className="surface flex items-center justify-between rounded-xl px-4 py-3.5 sm:px-5"
                >
                  <span className="text-sm font-bold" style={{ color: sub.accent }}>
                    {sub.label}
                  </span>
                  <span className="font-display text-sm font-bold tabular-nums">
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
