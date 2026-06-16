"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { notFound } from "next/navigation";
import { GAMES, type Game } from "@/data/games";
import type { CatalogGamePayload } from "@/app/api/catalog-game/route";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { StoreLogo, SubLogo } from "@/components/store-logo";
import { StoreLink } from "@/components/store-link";
import { DealTag, StoreDot } from "@/components/deal-tag";
import { AtlBadge } from "@/components/atl-badge";
import { DealVerdict } from "@/components/deal-verdict";
import { RelatedGames } from "@/components/related-games";
import { ReviewScores } from "@/components/review-scores";
import { GameBundles } from "@/components/game-bundles";
import { CountUp } from "@/components/count-up";
import { WatchButton } from "@/components/watch-button";
import { PriceChart } from "@/components/price-chart";
import { StickyCta } from "@/components/sticky-cta";
import { GameMedia } from "@/components/game-media";
import { GameAbout } from "@/components/game-about";
import { useGameExtra } from "@/hooks/use-game-extra";
import { useApp } from "@/components/providers";
import type { Dict } from "@/i18n";

function reviewText(score: number, t: Dict): string {
  if (score >= 90) return t.reviewOverwhelming;
  if (score >= 80) return t.reviewVeryPositive;
  if (score >= 70) return t.reviewMostlyPositive;
  return t.reviewMixed;
}

export function GameDetail({ slug }: { slug: string }) {
  // priceVersion in useApp() makes this re-render when live prices apply.
  const { locale, t, priceLoaded } = useApp();
  const priceListRef = useRef<HTMLElement | null>(null);

  // Catalog-resident games come from the bundled GAMES (live prices via applyLive);
  // others (bulk-imported, DB-only) are fetched on demand from /api/catalog-game.
  const inCatalog = useMemo(() => GAMES.find((g) => g.slug === slug), [slug]);
  const [dbGame, setDbGame] = useState<Game | null>(null);
  const [dbResolved, setDbResolved] = useState(false);

  useEffect(() => {
    if (inCatalog) return;
    let cancelled = false;
    fetch(`/api/catalog-game?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d: CatalogGamePayload) => {
        if (cancelled) return;
        if (d.found && d.game) setDbGame(d.game);
        setDbResolved(true);
      })
      .catch(() => {
        if (!cancelled) setDbResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, inCatalog]);

  const game = inCatalog ?? dbGame;
  const { extra, ready: extraReady } = useGameExtra(game && /^\d+$/.test(game.id) ? game.id : null);

  if (!game) {
    if (dbResolved) notFound();
    return (
      <div className="mx-auto w-[min(100%-2rem,60rem)] py-16">
        <div className="animate-shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  // DB-only games arrive with their prices already attached.
  const pricesReady = inCatalog ? priceLoaded : true;
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
              <div className="flex flex-wrap items-center gap-2">
                <AtlBadge game={game} size="md" />
              </div>
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
              <ReviewScores reviews={extra.reviews} />
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <SubBadges ids={game.subscriptions} size="md" />
                <WatchButton slug={game.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-[min(100%-2rem,60rem)] pb-24">
        {!game.unreleased && /^\d+$/.test(game.id) && (
          <>
            <GameAbout description={extra.description} tags={extra.tags} ready={extraReady} />
            <GameMedia screenshots={extra.screenshots} ready={extraReady} />
          </>
        )}
        {game.unreleased && (
          <section className="reveal panel-strong mt-8 rounded-[var(--radius-card)] px-6 py-12 text-center">
            <p className="font-display text-3xl">🕓</p>
            <p className="mt-2 font-display text-lg font-bold text-bright">
              {t.comingSoon} · {game.releaseYear}
            </p>
            <p className="mt-1 text-sm text-muted">{t.noPriceYet}</p>
          </section>
        )}
        {/* Fiyatlar */}
        {!game.unreleased && (
        <section ref={priceListRef} className="reveal mt-8" style={{ animationDelay: "0.1s" }}>
          <h2 className="font-display mb-4 text-lg font-bold text-bright">
            {t.allPrices}{" "}
            <span className="text-sm font-normal text-muted">
              ({prices.length} {t.storesCount})
            </span>
          </h2>
          {prices.length > 0 && (
            <div className="mb-4">
              <DealVerdict game={game} variant="full" />
            </div>
          )}
          {prices.length === 0 ? (
            pricesReady ? (
              <div className="panel rounded-[var(--radius-card)] px-5 py-8 text-center text-sm text-muted">
                {t.noPriceFound}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-shimmer h-[60px] rounded-[var(--radius-card)]" />
                ))}
              </div>
            )
          ) : (
            <ul className="flex flex-col gap-2.5">
              {prices.map((rp, i) => {
                const store = STORES[rp.price.store];
                const isBest = i === 0;
                return (
                  <li key={rp.price.store}>
                    <StoreLink
                      game={game}
                      price={rp.price}
                      className={`flex w-full items-center justify-between gap-4 rounded-[var(--radius-card)] px-4 py-4 text-left transition-transform hover:scale-[1.005] sm:px-5 ${
                        isBest ? "spectrum-ring shadow-lg" : "panel"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <StoreDot store={rp.price.store} />
                        <StoreLogo id={rp.price.store} size={18} />
                        <span className="truncate text-sm font-bold text-bright">{store.label}</span>
                        {isBest && (
                          <span className="discount-chip shrink-0 rounded-full px-2 py-0.5 text-[10px]">
                            {t.cheapest}
                          </span>
                        )}
                        <span className="text-xs text-muted">↗</span>
                      </span>

                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <span className="inline-flex items-center gap-2">
                          <DealTag cut={rp.price.discountPercent ?? 0} />
                          {rp.tryOriginal !== undefined && (
                            <span className="text-xs text-muted line-through">
                              {formatTRY(rp.tryOriginal, locale)}
                            </span>
                          )}
                          {isBest ? (
                            <CountUp
                              value={rp.tryAmount}
                              locale={locale}
                              className="text-lg font-bold tabular-nums price-best"
                            />
                          ) : (
                            <PriceTag rp={rp} locale={locale} />
                          )}
                        </span>
                        {rp.price.currency === "USD" && (
                          <span className="text-[11px] text-muted">
                            ${rp.price.amount.toFixed(2)} · {t.steamNote}
                          </span>
                        )}
                      </span>
                    </StoreLink>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        )}

        {/* Fiyat geçmişi */}
        {!game.unreleased && (
        <section className="reveal mt-8" style={{ animationDelay: "0.16s" }}>
          <PriceChart game={game} />
        </section>
        )}

        {/* Abonelikler */}
        {game.subscriptions.length > 0 && (
          <section className="reveal mt-8" style={{ animationDelay: "0.22s" }}>
            <h2 className="font-display mb-4 text-lg font-bold text-bright">{t.includedIn}</h2>
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {game.subscriptions.map((id) => {
                const sub = SUBSCRIPTIONS[id];
                return (
                  <li
                    key={id}
                    className="panel flex items-center justify-between rounded-[var(--radius-card)] px-4 py-4 sm:px-5"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold" style={{ color: sub.accent }}>
                      <SubLogo id={id} size={18} /> {sub.label}
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

        {/* Şu an dahil olduğu paketler (ITAD) */}
        {!game.unreleased && <GameBundles game={game} />}

        {/* Benzer oyunlar — katalog içi keşif */}
        <RelatedGames game={game} />
      </div>

      {!game.unreleased && <StickyCta game={game} watchRef={priceListRef} />}
    </div>
  );
}
