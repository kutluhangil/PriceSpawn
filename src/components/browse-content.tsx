"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { GAMES } from "@/data/games";
import { filterSortGames } from "@/lib/filters";
import { GameCard } from "@/components/game-card";
import { FilterBar } from "@/components/filter-bar";
import { useGameFilters } from "@/hooks/use-game-filters";
import { parseOpts, serializeOpts } from "@/lib/filter-url";
import { useApp } from "@/components/providers";

export function BrowseContent() {
  const { t } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Initialize once from the URL (deep-link / shared filter).
  const initial = useMemo(() => parseOpts(new URLSearchParams(params.toString())), []); // eslint-disable-line react-hooks/exhaustive-deps
  const f = useGameFilters(initial);
  const results = useMemo(() => filterSortGames(GAMES, f.opts), [f.opts]);

  // Reflect filter state back into the URL (shareable, back/forward works).
  useEffect(() => {
    const qs = serializeOpts(f.opts);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [f.opts, pathname, router]);

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-5 text-2xl font-bold text-bright sm:text-3xl">
        {t.allGamesPage}
      </h1>

      <FilterBar
        opts={f.opts}
        toggleGenre={f.toggleGenre}
        toggleStore={f.toggleStore}
        toggleSub={f.toggleSub}
        setOnlyDiscounted={f.setOnlyDiscounted}
        setMin={f.setMin}
        setMax={f.setMax}
        setSort={f.setSort}
        reset={f.reset}
      />

      <p className="mb-4 mt-5 text-sm text-muted">
        {results.length} {t.resultCount}
      </p>

      {results.length === 0 ? (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">
          {t.noResults}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      )}
    </div>
  );
}
