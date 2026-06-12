"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/data/games";
import { searchGames } from "@/lib/search";
import { bestPrice } from "@/lib/price";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { PriceTag } from "@/components/price-tag";
import { useApp } from "@/components/providers";

export function SearchBar({ variant = "nav" }: { variant?: "hero" | "nav" }) {
  const { locale, t } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchGames(query, GAMES, 8), [query]);
  const showDropdown = open && query.trim().length > 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showDropdown || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlight] ?? results[0];
      if (target) {
        setOpen(false);
        router.push(`/oyun/${target.slug}`);
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      {/* Steam arama kutusu: girdi + sağda mavi büyüteç bloğu */}
      <div className="search-premium flex items-center overflow-hidden rounded">
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
          placeholder={t.searchPlaceholder}
          aria-label={t.searchPlaceholder}
          className={`w-full bg-transparent outline-none placeholder:text-(--search-fg)/55 [&::-webkit-search-cancel-button]:hidden ${
            variant === "hero" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs"
          }`}
        />
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className="flex h-full items-center self-stretch bg-black/15 px-2.5 text-accent"
        >
          <svg
            width={variant === "hero" ? 18 : 14}
            height={variant === "hero" ? 18 : 14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>

      {showDropdown && (
        <div className="panel-strong absolute right-0 top-full z-50 mt-1.5 w-[min(92vw,26rem)] overflow-hidden rounded border border-border">
          {results.length === 0 ? (
            <p className="px-4 py-3.5 text-sm text-muted">{t.noResults}</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((game, i) => {
                const best = bestPrice(game);
                return (
                  <li key={game.slug}>
                    <Link
                      href={`/oyun/${game.slug}`}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex items-center gap-3 px-3 py-2 transition-colors ${
                        i === highlight ? "bg-row-hover" : ""
                      }`}
                    >
                      <CoverImage
                        src={game.coverUrl}
                        title={game.title}
                        className="h-8 w-[70px] shrink-0 rounded-sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-bright">
                          {game.title}
                        </span>
                        <span className="block truncate text-[11px] text-muted">
                          {game.genres.join(", ")}
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
