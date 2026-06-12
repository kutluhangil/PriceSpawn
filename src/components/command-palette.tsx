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
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      {/* Spektrum kenarlı premium kutu */}
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: 1.5, background: "linear-gradient(120deg, #ff6b6b, #ffc371, #4ade80, #38bdf8, #a78bfa)" }}
      >
        <div className="overflow-hidden rounded-[15px] bg-bg-deep">
          {/* Arama satırı */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent" aria-hidden="true">
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
              className="w-full bg-transparent text-base text-fg outline-none placeholder:text-muted"
            />
            <kbd className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted">ESC</kbd>
          </div>

          <div className="h-px bg-border" />

          {/* Sonuçlar */}
          <div className="max-h-[52vh] overflow-y-auto p-2">
            <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
              {showNav ? t.footerSite : `${results.length} ${t.resultCount}`}
            </p>

            {showNav ? (
              <ul>
                {navItems.map((n, i) => (
                  <li key={n.href}>
                    <button
                      onClick={() => go(n.href)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                        i === highlight ? "bg-(--row-hover) text-bright" : "text-fg"
                      }`}
                    >
                      <span className="text-accent">→</span> {n.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : results.length === 0 ? (
              <div className="px-1 pb-1">
                <p className="px-2 py-3 text-sm text-muted">{t.noResults}</p>
                <MissingGame query={query.trim()} />
              </div>
            ) : (
              <ul>
                {results.map((g, i) => {
                  const best = bestPrice(g);
                  return (
                    <li key={g.slug}>
                      <Link
                        href={`/oyun/${g.slug}`}
                        onClick={() => setOpen(false)}
                        onMouseEnter={() => setHighlight(i)}
                        className={`flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${
                          i === highlight ? "bg-(--row-hover)" : ""
                        }`}
                      >
                        <CoverImage src={g.coverUrl} title={g.title} className="h-9 w-[78px] shrink-0 rounded-md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-bright">{g.title}</span>
                          <span className="block truncate text-[11px] text-muted">{g.genres.join(", ")}</span>
                        </span>
                        {best && (
                          <span className="flex shrink-0 flex-col items-end">
                            <PriceTag rp={best} locale={locale} size="sm" />
                            <span className="flex items-center gap-1 text-[10px] text-muted">
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
    </div>
  );
}
