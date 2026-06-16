"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SearchResult } from "@/app/api/search/route";
import { GAMES } from "@/data/games";
import { filterSortGames } from "@/lib/filters";
import { formatTRY } from "@/lib/format";
import { GameCard } from "@/components/game-card";
import { CoverImage } from "@/components/cover-image";
import { GameArt } from "@/components/game-art";
import { FilterBar } from "@/components/filter-bar";
import { useGameFilters } from "@/hooks/use-game-filters";
import { parseOpts, serializeOpts } from "@/lib/filter-url";
import { useApp } from "@/components/providers";

export function BrowseContent() {
  const { t, locale } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initial = useMemo(() => parseOpts(new URLSearchParams(params.toString())), []); // eslint-disable-line react-hooks/exhaustive-deps
  const f = useGameFilters(initial);
  const query = f.opts.query.trim();

  // Reflect filter state back into the URL (shareable, back/forward works).
  useEffect(() => {
    const qs = serializeOpts(f.opts);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [f.opts, pathname, router]);

  // With a text query, search the full DB catalog (server) so results match the
  // hero search bar. Without one, browse/filter the curated bundled GAMES.
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

  const filtered = filterSortGames(GAMES, f.opts);
  const count = query ? (searchResults?.length ?? 0) : filtered.length;

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-5 text-2xl font-bold text-bright sm:text-3xl">{t.allGamesPage}</h1>

      <FilterBar
        opts={f.opts}
        toggleGenre={f.toggleGenre}
        toggleStore={f.toggleStore}
        toggleSub={f.toggleSub}
        setQuery={f.setQuery}
        setOnlyDiscounted={f.setOnlyDiscounted}
        setMin={f.setMin}
        setMax={f.setMax}
        setSort={f.setSort}
        reset={f.reset}
      />

      <p className="mb-4 mt-5 text-sm text-muted">
        {count} {t.resultCount}
      </p>

      {count === 0 ? (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">
          <GameArt className="mx-auto mb-3 w-52" />
          {t.noResults}
        </div>
      ) : query ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(searchResults ?? []).map((r) => (
            <Link
              key={r.slug}
              href={`/oyun/${r.slug}`}
              className="group block overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all hover:-translate-y-0.5 hover:border-accent"
            >
              <CoverImage src={r.cover} title={r.title} className="aspect-[460/215] w-full" />
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-bright">{r.title}</span>
                  {r.year > 0 && <span className="text-xs text-muted">{r.year}</span>}
                </span>
                {r.priceTRY !== null && (
                  <span className="shrink-0 text-sm font-bold tabular-nums text-best">{formatTRY(r.priceTRY, locale)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
