"use client";

import { useEffect, useRef, useState } from "react";
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

const trailerUrl = (id: string) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/microtrailer.webm`;

// Hover-trailer ile paylaşılan appid → movie-id çözümleme önbelleği ("" = yok).
const movieCache = new Map<string, string>();

/** Maks. parallax kayması (px) — her eksende. */
const PARALLAX_MAX = 10;
/** Aktif slide'da otomatik fragman oynatmaya başlamadan önceki bekleme (ms). */
const TRAILER_DWELL_MS = 1200;

/**
 * The billboard renders ~760 CSS px wide (≈1520px on retina), so the 460px
 * `header.jpg` / 616px capsule look soft. Steam's 1920px `library_hero.jpg`
 * lives at the canonical app path (`apps/<appid>/library_hero.jpg`) — note the
 * hash-dir cover URLs in our data DON'T carry it, so we build it from the
 * Steam appid (game.id) directly. Falls back to the stored cover, then gradient.
 */
function heroArt(game: Game): { src: string; fallback: string[] } {
  if (/^\d+$/.test(game.id)) {
    return {
      src: `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.id}/library_hero.jpg`,
      fallback: [game.coverUrl],
    };
  }
  return { src: game.coverUrl, fallback: [] };
}

/** Steam-style featured showcase: large clear image left, info panel right. */
export function Billboard({ games }: { games: Game[] }) {
  const { locale, t } = useApp();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [movieId, setMovieId] = useState<string>("");
  const [playTrailer, setPlayTrailer] = useState(false);
  const reducedMotionRef = useRef(false);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  useEffect(() => {
    if (paused || games.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % games.length), 7000);
    return () => clearInterval(id);
  }, [paused, games.length]);

  const game = games[index];

  // Slide değişince fragmanı sıfırla ve aktif oyun için movie-id'yi çöz.
  useEffect(() => {
    if (!game) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlayTrailer(false);
    setMovieId(game.trailerId ?? "");

    if (reducedMotionRef.current) return;
    if (game.trailerId || !/^\d+$/.test(game.id)) return;

    const cached = movieCache.get(game.id);
    if (cached !== undefined) {
      if (cached) setMovieId(cached);
      return;
    }
    let cancelled = false;
    fetch(`/api/trailer?appid=${game.id}`)
      .then((res) => res.json())
      .then((data) => {
        const id = data?.id ?? "";
        movieCache.set(game.id, id);
        if (!cancelled && id) setMovieId(id);
      })
      .catch(() => movieCache.set(game.id, ""));
    return () => {
      cancelled = true;
    };
  }, [game]);

  // ~1.2s dwell sonrası aktif slide'da fragmanı otomatik oynat (azaltılmış hareket hariç).
  useEffect(() => {
    if (reducedMotionRef.current || paused || !movieId) return;
    const id = setTimeout(() => setPlayTrailer(true), TRAILER_DWELL_MS);
    return () => clearTimeout(id);
  }, [movieId, paused, index]);

  if (!game) return null;
  const prices = sortedPrices(game).slice(0, 4);
  const best = prices[0];
  const prev = () => setIndex((i) => (i - 1 + games.length) % games.length);
  const next = () => setIndex((i) => (i + 1) % games.length);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reducedMotionRef.current) return;
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: px * 2 * PARALLAX_MAX, y: py * 2 * PARALLAX_MAX });
  }

  function onPointerLeave() {
    // Pause is owned solely by the section's onMouseEnter/onMouseLeave; only
    // reset parallax here (leaving the image for the info panel must NOT unpause).
    setParallax({ x: 0, y: 0 });
  }

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
        <div
          ref={imgWrapRef}
          className="group/img relative aspect-[616/353] overflow-hidden"
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <Link href={`/oyun/${game.slug}`} className="block h-full w-full">
            <div
              className="h-full w-full transition-transform duration-300 ease-out"
              style={{ transform: `translate3d(${parallax.x}px, ${parallax.y}px, 0)` }}
            >
              <CoverImage
                key={game.slug}
                src={heroArt(game).src}
                fallbackSrc={heroArt(game).fallback}
                title={game.title}
                sizes="(max-width: 768px) 100vw, 800px"
                quality={90}
                className="billboard-fade h-full w-full scale-[1.06] transition-transform duration-700 ease-out group-hover/img:scale-[1.1]"
              />
            </div>
          </Link>

          {/* Otomatik sessiz fragman (Steam microtrailer) — sadece aktif slide */}
          {playTrailer && movieId && (
            <video
              key={movieId}
              src={trailerUrl(movieId)}
              autoPlay
              muted
              loop
              playsInline
              onError={() => setPlayTrailer(false)}
              className="trailer-fade-in pointer-events-none absolute inset-0 h-full w-full object-cover"
              aria-hidden="true"
            />
          )}

          {/* Sinematik alt-sol gradyan perde + üst bindirme başlık */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div
            className="pointer-events-none absolute bottom-0 left-0 max-w-[85%] p-4 transition-transform duration-300 ease-out sm:p-6"
            style={{ transform: `translate3d(${-parallax.x * 0.4}px, ${-parallax.y * 0.4}px, 0)` }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {t.featured}
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] sm:text-5xl">
              {game.title}
            </h2>
            <p className="mt-1 text-xs text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] sm:text-sm">
              {game.releaseYear} · {game.genres.join(" · ")}
            </p>
          </div>

          {best?.price.discountPercent !== undefined ? (
            <span
              className="discount-chip pointer-events-none absolute left-4 top-4 rounded-lg px-2.5 py-1 text-sm shadow-lg transition-transform duration-300 ease-out"
              style={{ transform: `translate3d(${-parallax.x * 0.6}px, ${-parallax.y * 0.6}px, 0)` }}
            >
              -%{best.price.discountPercent}
            </span>
          ) : game.unreleased ? (
            <span
              className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg bg-bg/75 px-2.5 py-1 text-xs font-bold text-bright shadow-lg backdrop-blur transition-transform duration-300 ease-out"
              style={{ transform: `translate3d(${-parallax.x * 0.6}px, ${-parallax.y * 0.6}px, 0)` }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t.comingSoon} · {game.releaseYear}
            </span>
          ) : null}

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
          <SubBadges ids={game.subscriptions} size="md" />

          {/* Mağaza fiyat satırları (yayımlanmamış oyunlarda gizli) */}
          {prices.length > 0 ? (
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
          ) : game.unreleased ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">{t.unreleasedNote}</p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
            {best ? (
              <PriceTag rp={best} locale={locale} size="lg" highlight />
            ) : (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-bright">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t.comingSoon}
              </span>
            )}
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
