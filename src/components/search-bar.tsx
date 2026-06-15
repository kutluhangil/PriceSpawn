"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/data/games";
import { searchGames } from "@/lib/search";
import { bestPrice } from "@/lib/price";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { SubBadges } from "@/components/sub-badges";
import { PriceTag } from "@/components/price-tag";
import { MissingGame } from "@/components/missing-game";
import { useApp } from "@/components/providers";

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "nav" }) {
  const { locale, t } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const results = useMemo(() => searchGames(query, GAMES, 8), [query]);
  const showDropdown = open && query.trim().length > 0;
  const isHero = variant === "hero";
  const trimmedQuery = query.trim();

  function browseHref() {
    const params = new URLSearchParams({ q: trimmedQuery });
    return `/oyunlar?${params.toString()}`;
  }

  function goToResults() {
    if (!trimmedQuery) return;
    setOpen(false);
    router.push(browseHref());
  }

  function goToGame(slug: string) {
    setOpen(false);
    router.push(`/oyun/${slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      goToResults();
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative z-40 w-full ${isHero ? "mx-auto max-w-2xl" : ""}`}
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div
        className={
          isHero
            ? "aurora rounded-full"
            : "rounded-full border border-border transition-shadow focus-within:shadow-[0_0_0_3px_var(--accent-soft)]"
        }
      >
        <div
          className={`flex items-center gap-3 rounded-full bg-bg-deep ${
            isHero ? "px-5 py-4 sm:px-6" : "px-3.5 py-1.5"
          }`}
        >
          <svg
            width={isHero ? 19 : 14}
            height={isHero ? 19 : 14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0 text-muted"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            enterKeyHint="search"
            autoComplete="off"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            aria-activedescendant={
              showDropdown && results[highlight] ? `${listboxId}-${results[highlight].slug}` : undefined
            }
            className={`no-focus-ring w-full bg-transparent text-fg outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden ${
              isHero ? "text-base sm:text-lg" : "text-xs"
            }`}
          />
        </div>
      </div>

      {showDropdown && (
        <div
          className={`panel-strong absolute top-full z-50 mt-2.5 max-h-[min(62dvh,32rem)] overflow-y-auto overscroll-contain rounded-2xl ${
            isHero ? "left-0 right-0" : "right-0 w-[min(92vw,26rem)]"
          }`}
        >
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              goToResults();
            }}
            onClick={goToResults}
            className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-border px-4 py-3 text-left text-sm font-semibold text-bright transition-colors hover:bg-(--row-hover)"
          >
            <span className="min-w-0 truncate">{t.listResults}</span>
            <span className="shrink-0 text-xs text-muted">↵</span>
          </button>
          {results.length === 0 ? (
            <div className="p-2">
              <p className="px-3 py-2 text-sm text-muted">{t.noResults}</p>
              <MissingGame query={query.trim()} />
            </div>
          ) : (
            <ul id={listboxId} role="listbox" className="divide-y divide-border">
              {results.map((game, i) => {
                const best = bestPrice(game);
                return (
                  <li
                    id={`${listboxId}-${game.slug}`}
                    key={game.slug}
                    role="option"
                    aria-selected={i === highlight}
                  >
                    <Link
                      href={`/oyun/${game.slug}`}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.preventDefault();
                        goToGame(game.slug);
                      }}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex min-h-[4.5rem] items-center gap-3 px-3 py-3 transition-colors sm:min-h-0 sm:px-4 sm:py-2.5 ${
                        i === highlight ? "bg-(--row-hover)" : ""
                      }`}
                    >
                      <CoverImage
                        src={game.coverUrl}
                        title={game.title}
                        className="h-12 w-[84px] shrink-0 rounded-md sm:h-9 sm:w-[78px]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-bright">
                          {game.title}
                        </span>
                        <span className="mt-0.5 block">
                          <SubBadges ids={game.subscriptions} />
                        </span>
                      </span>
                      {best && (
                        <span className="flex shrink-0 flex-col items-end">
                          <PriceTag rp={best} locale={locale} size="sm" />
                          <span className="text-[10px] text-muted">
                            {STORES[best.price.store].label}
                          </span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
