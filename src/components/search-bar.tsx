"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";
import { formatTRY } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";
import { MissingGame } from "@/components/missing-game";
import { useApp } from "@/components/providers";

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "nav" }) {
  const { locale, t } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const trimmedQuery = query.trim();
  const showDropdown = open && trimmedQuery.length > 0;
  const isHero = variant === "hero";

  // Debounced server-side catalog search (covers the full DB catalog).
  useEffect(() => {
    const q = trimmedQuery;
    if (!q) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { results: SearchResult[] }) => {
          if (!cancelled) {
            setResults(d.results ?? []);
            setHighlight(0);
          }
        })
        .catch(() => {});
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [trimmedQuery]);

  function browseHref() {
    return `/oyunlar?q=${encodeURIComponent(trimmedQuery)}`;
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
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Enter") {
      e.preventDefault();
      return goToResults();
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
        <div className={`flex items-center gap-3 rounded-full bg-bg-deep ${isHero ? "px-5 py-4 sm:px-6" : "px-3.5 py-1.5"}`}>
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
              <MissingGame query={trimmedQuery} />
            </div>
          ) : (
            <ul id={listboxId} role="listbox" className="divide-y divide-border">
              {results.map((game, i) => (
                <li id={`${listboxId}-${game.slug}`} key={game.slug} role="option" aria-selected={i === highlight}>
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
                    <CoverImage src={game.cover} title={game.title} className="h-12 w-[84px] shrink-0 rounded-md sm:h-9 sm:w-[78px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-bright">{game.title}</span>
                      {game.year > 0 && <span className="text-xs text-muted">{game.year}</span>}
                    </span>
                    {game.priceTRY !== null ? (
                      <span className="shrink-0 text-sm font-bold tabular-nums text-best">
                        {formatTRY(game.priceTRY, locale)}
                      </span>
                    ) : game.isFree ? (
                      <span className="shrink-0 text-sm font-bold text-best">{t.freeLabel}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
