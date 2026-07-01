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
  setQuery,
  setOnlyDiscounted,
  setAtLow,
  setMin,
  setMax,
  setSort,
  reset,
}: {
  opts: FilterOpts;
  toggleGenre: (g: string) => void;
  toggleStore: (s: StoreId) => void;
  toggleSub: (s: SubscriptionId) => void;
  setQuery: (query: string) => void;
  setOnlyDiscounted: (v: boolean) => void;
  setAtLow: (v: boolean) => void;
  setMin: (v: number | null) => void;
  setMax: (v: number | null) => void;
  setSort: (s: SortKey) => void;
  reset: () => void;
}) {
  const { t, locale } = useApp();

  // Steam-style one-tap budget shortcuts (sets max, clears min).
  const budgets = [50, 100, 200, 500];

  const sorts: { key: SortKey; label: string }[] = [
    { key: "discount", label: t.sortDiscount },
    { key: "priceAsc", label: t.sortPriceAsc },
    { key: "priceDesc", label: t.sortPriceDesc },
    { key: "score", label: t.sortScore },
    { key: "year", label: t.sortYear },
    { key: "name", label: t.sortName },
  ];

  const chip = (active: boolean) =>
    `flex min-h-10 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
      active ? "bg-accent-strong text-white" : "border border-border text-muted hover:text-fg"
    }`;

  return (
    <div className="panel-strong flex flex-col gap-4 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-bright">{t.filters}</h2>
        <button onClick={reset} className="text-xs font-semibold text-accent hover:underline">
          {t.clearFilters}
        </button>
      </div>

      <label className="flex flex-col gap-2 text-xs font-semibold text-muted">
        {t.navSearch}
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-bg-deep px-3 transition-colors focus-within:border-accent">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={opts.query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            enterKeyHint="search"
            autoComplete="off"
            className="no-focus-ring min-h-11 w-full bg-transparent text-base font-medium text-fg outline-none placeholder:text-muted sm:text-sm"
          />
          {opts.query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t.clearFilters}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-(--row-hover) hover:text-bright"
            >
              ×
            </button>
          )}
        </div>
      </label>

      {/* Sort + onlyDiscounted */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-muted">
          {t.sortBy}
          <select
            value={opts.sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-10 rounded-md border border-border bg-bg-deep px-2 py-2 text-base text-fg outline-none focus:border-accent sm:text-sm"
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
        <button onClick={() => setAtLow(!opts.atLow)} className={chip(opts.atLow)} title={t.atLowHint}>
          {t.atLow}
        </button>
        <label className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-muted">
          {t.priceRange}
          <input
            type="number"
            placeholder="min"
            min={0}
            value={opts.minTRY ?? ""}
            onChange={(e) => setMin(e.target.value ? Number(e.target.value) : null)}
            inputMode="numeric"
            className="min-h-10 w-24 rounded-md border border-border bg-bg-deep px-2 py-2 text-base text-fg outline-none focus:border-accent sm:w-20 sm:text-sm"
          />
          <span>–</span>
          <input
            type="number"
            placeholder="max"
            min={0}
            value={opts.maxTRY ?? ""}
            onChange={(e) => setMax(e.target.value ? Number(e.target.value) : null)}
            inputMode="numeric"
            className="min-h-10 w-24 rounded-md border border-border bg-bg-deep px-2 py-2 text-base text-fg outline-none focus:border-accent sm:w-20 sm:text-sm"
          />
        </label>
        {/* Hızlı bütçe kısayolları */}
        {budgets.map((n) => {
          const active = opts.maxTRY === n && opts.minTRY === null;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                setMin(null);
                setMax(active ? null : n);
              }}
              className={chip(active)}
            >
              {locale === "tr" ? `₺${n} altı` : `Under ₺${n}`}
            </button>
          );
        })}
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
