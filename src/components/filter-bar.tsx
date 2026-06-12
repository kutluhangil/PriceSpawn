"use client";

import type { FilterOpts, SortKey } from "@/lib/filters";
import { allGenres } from "@/lib/filters";
import { GAMES } from "@/data/games";
import { STORES, type StoreId } from "@/lib/stores";
import { SUBSCRIPTIONS, type SubscriptionId } from "@/lib/subscriptions";
import { StoreLogo, SubLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

const GENRES = allGenres(GAMES);

export function FilterBar({
  opts,
  toggleGenre,
  toggleStore,
  toggleSub,
  setOnlyDiscounted,
  setMin,
  setMax,
  setSort,
  reset,
}: {
  opts: FilterOpts;
  toggleGenre: (g: string) => void;
  toggleStore: (s: StoreId) => void;
  toggleSub: (s: SubscriptionId) => void;
  setOnlyDiscounted: (v: boolean) => void;
  setMin: (v: number | null) => void;
  setMax: (v: number | null) => void;
  setSort: (s: SortKey) => void;
  reset: () => void;
}) {
  const { t } = useApp();

  const sorts: { key: SortKey; label: string }[] = [
    { key: "discount", label: t.sortDiscount },
    { key: "priceAsc", label: t.sortPriceAsc },
    { key: "priceDesc", label: t.sortPriceDesc },
    { key: "score", label: t.sortScore },
    { key: "year", label: t.sortYear },
    { key: "name", label: t.sortName },
  ];

  const chip = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
      active ? "bg-accent text-white" : "border border-border text-muted hover:text-fg"
    }`;

  return (
    <div className="panel-strong flex flex-col gap-4 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-bright">{t.filters}</h2>
        <button onClick={reset} className="text-xs font-semibold text-accent hover:underline">
          {t.clearFilters}
        </button>
      </div>

      {/* Sort + onlyDiscounted */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-muted">
          {t.sortBy}
          <select
            value={opts.sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-md border border-border bg-bg-deep px-2 py-1.5 text-fg outline-none focus:border-accent"
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setOnlyDiscounted(!opts.onlyDiscounted)}
          className={chip(opts.onlyDiscounted)}
        >
          {t.onlyDiscounted}
        </button>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          {t.priceRange}
          <input
            type="number"
            placeholder="min"
            min={0}
            value={opts.minTRY ?? ""}
            onChange={(e) => setMin(e.target.value ? Number(e.target.value) : null)}
            className="w-20 rounded-md border border-border bg-bg-deep px-2 py-1.5 text-fg outline-none focus:border-accent"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="max"
            min={0}
            value={opts.maxTRY ?? ""}
            onChange={(e) => setMax(e.target.value ? Number(e.target.value) : null)}
            className="w-20 rounded-md border border-border bg-bg-deep px-2 py-1.5 text-fg outline-none focus:border-accent"
          />
        </label>
      </div>

      {/* Stores */}
      <div className="flex flex-wrap gap-2">
        {Object.values(STORES).map((s) => (
          <button key={s.id} onClick={() => toggleStore(s.id)} className={chip(opts.stores.includes(s.id))}>
            <StoreLogo id={s.id} size={14} /> {s.label}
          </button>
        ))}
      </div>

      {/* Subscriptions */}
      <div className="flex flex-wrap gap-2">
        {Object.values(SUBSCRIPTIONS).map((s) => (
          <button
            key={s.id}
            onClick={() => toggleSub(s.id)}
            className={chip(opts.subscriptions.includes(s.id))}
          >
            <SubLogo id={s.id} size={14} /> {s.label}
          </button>
        ))}
      </div>

      {/* Genres */}
      <div className="flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button key={g} onClick={() => toggleGenre(g)} className={chip(opts.genres.includes(g))}>
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
