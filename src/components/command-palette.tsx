"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES } from "@/data/games";
import { searchGames } from "@/lib/search";
import { bestPrice } from "@/lib/price";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { PriceTag } from "@/components/price-tag";
import { StoreLogo } from "@/components/store-logo";
import { MissingGame } from "@/components/missing-game";
import { useApp } from "@/components/providers";

export function CommandPalette() {
  const { t, locale } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navItems = useMemo(
    () => [
      { label: t.allGamesPage, href: "/oyunlar" },
      { label: t.freePage, href: "/ucretsiz" },
      { label: t.subsPage, href: "/abonelikler" },
      { label: t.watchPage, href: "/takip" },
    ],
    [t]
  );

  const results = useMemo(() => searchGames(query, GAMES, 7), [query]);
  const showNav = query.trim().length === 0;
  const rows = showNav ? navItems.length : results.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setQuery("");
      setHighlight(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % Math.max(1, rows));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + rows) % Math.max(1, rows));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showNav) go(navItems[highlight]?.href ?? "/oyunlar");
      else if (results[highlight]) go(`/oyun/${results[highlight].slug}`);
    }
  }

  if (!open) return null;

  return (
    <div
      className="spotlight-overlay fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[16vh]"
      onClick={() => setOpen(false)}
    >
      {/* Apple Spotlight: buzlu cam, kenarsız, yumuşak */}
      <div
        className="spotlight-panel w-full max-w-[34rem] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arama satırı — büyük, çerçevesiz */}
        <div className="flex items-center gap-3.5 px-5 py-4">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={t.searchPlaceholder}
            className="no-focus-ring w-full bg-transparent text-lg text-fg outline-none placeholder:text-muted"
          />
          <kbd className="rounded-md bg-(--row-hover) px-1.5 py-0.5 text-[10px] font-semibold text-muted">esc</kbd>
        </div>

        {(showNav || results.length > 0 || query.trim().length > 0) && (
          <div className="mx-3 h-px bg-border" />
        )}

        {/* Sonuçlar */}
        <div className="max-h-[54vh] overflow-y-auto px-2 py-2">
          <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {showNav ? t.footerSite : `${results.length} ${t.resultCount}`}
          </p>

          {showNav ? (
            <ul>
              {navItems.map((n, i) => (
                <li key={n.href}>
                  <button
                    onClick={() => go(n.href)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      i === highlight ? "bg-accent text-white" : "text-fg"
                    }`}
                  >
                    <span className={i === highlight ? "text-white" : "text-muted"}>→</span>
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <div className="px-1 pb-1">
              <p className="px-3 py-3 text-sm text-muted">{t.noResults}</p>
              <MissingGame query={query.trim()} />
            </div>
          ) : (
            <ul>
              {results.map((g, i) => {
                const best = bestPrice(g);
                const active = i === highlight;
                return (
                  <li key={g.slug}>
                    <Link
                      href={`/oyun/${g.slug}`}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${
                        active ? "bg-accent" : ""
                      }`}
                    >
                      <CoverImage src={g.coverUrl} title={g.title} className="h-9 w-[78px] shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-semibold ${active ? "text-white" : "text-bright"}`}>
                          {g.title}
                        </span>
                        <span className={`block truncate text-[11px] ${active ? "text-white/70" : "text-muted"}`}>
                          {g.genres.join(", ")}
                        </span>
                      </span>
                      {best && (
                        <span className="flex shrink-0 flex-col items-end">
                          {active ? (
                            <span className="text-sm font-bold tabular-nums text-white">
                              {/* keep price readable on accent */}
                              <PriceTag rp={best} locale={locale} size="sm" />
                            </span>
                          ) : (
                            <PriceTag rp={best} locale={locale} size="sm" />
                          )}
                          <span className={`flex items-center gap-1 text-[10px] ${active ? "text-white/70" : "text-muted"}`}>
                            <StoreLogo id={best.price.store} size={11} /> {STORES[best.price.store].label}
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
      </div>
    </div>
  );
}
