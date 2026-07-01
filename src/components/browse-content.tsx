"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";
import type { BrowsePayload } from "@/app/api/catalog-browse/route";
import { GameArt } from "@/components/game-art";
import { FilterBar } from "@/components/filter-bar";
import { ResultCard } from "@/components/result-card";
import { useGameFilters } from "@/hooks/use-game-filters";
import { parseOpts, serializeOpts } from "@/lib/filter-url";
import { useApp } from "@/components/providers";

const PER_PAGE = 16;

/** Compact page list: 1 … current-1 current current+1 … last */
function pagesToShow(current: number, total: number): (number | "…")[] {
  const set = new Set<number>([1, total, current, current - 1, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) out.push("…");
    out.push(nums[i]);
  }
  return out;
}

export function BrowseContent() {
  const { t, locale } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const topRef = useRef<HTMLDivElement | null>(null);

  const initial = useMemo(() => parseOpts(new URLSearchParams(params.toString())), []); // eslint-disable-line react-hooks/exhaustive-deps
  const f = useGameFilters(initial);
  const query = f.opts.query.trim();
  const optsKey = serializeOpts(f.opts);

  // Reflect filter state back into the URL (shareable, back/forward works).
  useEffect(() => {
    router.replace(optsKey ? `${pathname}?${optsKey}` : pathname, { scroll: false });
  }, [optsKey, pathname, router]);

  const [page, setPage] = useState(1);
  // Reset to page 1 whenever the filters/sort change.
  useEffect(() => setPage(1), [optsKey]);

  // Text query → full-catalog search (server). No query → paginated catalog browse.
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  useEffect(() => {
    if (!query) {
      setSearchResults(null);
      return;
    }
    let cancelled = false;
    const id = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}&limit=48`)
        .then((r) => r.json())
        .then((d: { results: SearchResult[] }) => {
          if (!cancelled) setSearchResults(d.results ?? []);
        })
        .catch(() => {});
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const [browse, setBrowse] = useState<BrowsePayload | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (query) return;
    let cancelled = false;
    setLoading(true);
    const qs = `${optsKey ? optsKey + "&" : ""}page=${page}&limit=${PER_PAGE}`;
    fetch(`/api/catalog-browse?${qs}`)
      .then((r) => r.json())
      .then((d: BrowsePayload) => {
        if (!cancelled) setBrowse(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, optsKey, page]);

  const count = query ? (searchResults?.length ?? 0) : (browse?.total ?? 0);
  const pageCount = browse?.pageCount ?? 1;

  function goto(p: number) {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div ref={topRef} className="mx-auto w-[min(100%-2rem,74rem)] scroll-mt-20 pt-8">
      <h1 className="font-display mb-5 text-2xl font-bold text-bright sm:text-3xl">{t.allGamesPage}</h1>

      <FilterBar
        opts={f.opts}
        toggleGenre={f.toggleGenre}
        toggleStore={f.toggleStore}
        toggleSub={f.toggleSub}
        setQuery={f.setQuery}
        setOnlyDiscounted={f.setOnlyDiscounted}
        setAtLow={f.setAtLow}
        setMin={f.setMin}
        setMax={f.setMax}
        setSort={f.setSort}
        reset={f.reset}
      />

      <p className="mb-4 mt-5 text-sm text-muted">
        {count.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} {t.resultCount}
        {!query && pageCount > 1 && (
          <span className="ml-2 text-muted/70">
            · {t.page} {page}/{pageCount}
          </span>
        )}
      </p>

      {count === 0 && !loading ? (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">
          <GameArt className="mx-auto mb-3 w-52" />
          {t.noResults}
        </div>
      ) : query ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(searchResults ?? []).map((r) => (
            <ResultCard key={r.slug} r={r} locale={locale} freeLabel={t.freeLabel} />
          ))}
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            {(browse?.items ?? []).map((r) => (
              <ResultCard key={r.slug} r={r} locale={locale} freeLabel={t.freeLabel} />
            ))}
          </div>

          {pageCount > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-1.5">
              <button
                onClick={() => goto(Math.max(1, page - 1))}
                disabled={page === 1}
                aria-label={t.prevPage}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] border border-border text-muted transition-colors enabled:hover:text-bright disabled:opacity-40 cursor-pointer disabled:cursor-default"
              >
                ‹
              </button>
              {pagesToShow(page, pageCount).map((p, idx) =>
                p === "…" ? (
                  <span key={`e${idx}`} className="px-1 text-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goto(p)}
                    aria-current={p === page}
                    className={`h-9 min-w-9 rounded-[var(--radius-card)] border px-2 text-sm font-semibold transition-colors cursor-pointer ${
                      p === page ? "border-accent bg-accent-strong text-white" : "border-border text-muted hover:text-bright"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goto(Math.min(pageCount, page + 1))}
                disabled={page === pageCount}
                aria-label={t.nextPage}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-card)] border border-border text-muted transition-colors enabled:hover:text-bright disabled:opacity-40 cursor-pointer disabled:cursor-default"
              >
                ›
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
