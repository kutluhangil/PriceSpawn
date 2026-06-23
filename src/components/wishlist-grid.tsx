"use client";

import { useMemo, useState } from "react";
import {
  filterItems,
  sortItems,
  bulkAlarmTarget,
  type WishlistItem,
  type WishlistSummary,
  type WishlistSort,
} from "@/lib/wishlist";
import { useApp } from "@/components/providers";
import { useWatchlist } from "@/hooks/use-watchlist";
import { ResultCard } from "@/components/result-card";
import { formatTRY } from "@/lib/format";

export function WishlistGrid({
  items,
  summary,
  steamid,
}: {
  items: WishlistItem[];
  summary: WishlistSummary;
  steamid: string;
}) {
  const { t, locale } = useApp();
  const { addManyWithTargets } = useWatchlist();
  const [sort, setSort] = useState<WishlistSort>("discount");
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [store, setStore] = useState<string | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  const stores = useMemo(
    () => Array.from(new Set(items.map((i) => i.store).filter((s): s is string => !!s))).sort(),
    [items],
  );

  const shown = useMemo(
    () => filterItems(items, { onlyDiscount, store }).slice().sort(sortItems(sort)),
    [items, onlyDiscount, store, sort],
  );

  function bulkAdd() {
    const entries = shown
      .filter((i) => i.priceTRY != null)
      .map((i) => ({ slug: i.slug, targetTRY: bulkAlarmTarget(i.priceTRY as number) }));
    setAdded(addManyWithTargets(entries));
  }

  return (
    <div data-steamid={steamid}>
      {/* Summary band */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-bold text-bright">
          {summary.matched} {t.wlMatched}
        </span>
        <span className="text-muted">
          · {summary.onSale} {t.wlOnSale}
        </span>
        {summary.cheapestCartTRY > 0 && (
          <span className="text-muted">
            · {t.wlCart}:{" "}
            <span className="font-bold text-best">{formatTRY(summary.cheapestCartTRY, locale)}</span>
          </span>
        )}
        {summary.untracked > 0 && (
          <span className="text-muted">
            · {summary.untracked} {t.wlUntracked}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5 text-muted">
          {t.wlSortLabel}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as WishlistSort)}
            className="rounded-md border border-border bg-transparent px-2 py-1 text-bright"
          >
            <option value="discount">{t.wlSortDiscount}</option>
            <option value="priceAsc">{t.wlSortPriceAsc}</option>
            <option value="priceDesc">{t.wlSortPriceDesc}</option>
            <option value="savings">{t.wlSortSavings}</option>
            <option value="name">{t.wlSortName}</option>
          </select>
        </label>

        {stores.length > 1 && (
          <label className="flex items-center gap-1.5 text-muted">
            {t.wlStoreLabel}
            <select
              value={store ?? ""}
              onChange={(e) => setStore(e.target.value || null)}
              className="rounded-md border border-border bg-transparent px-2 py-1 text-bright"
            >
              <option value="">{t.wlStoreAll}</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-1.5 text-muted">
          <input
            type="checkbox"
            checked={onlyDiscount}
            onChange={(e) => setOnlyDiscount(e.target.checked)}
          />
          {t.wlOnlyDiscount}
        </label>

        <button
          onClick={bulkAdd}
          className="ml-auto cursor-pointer rounded-full border border-accent px-3 py-1 font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
        >
          {t.wlBulkAlarm}
        </button>
      </div>

      {added !== null && (
        <p className="mb-4 text-sm text-best">
          {added} {t.wlBulkAlarmDone}
        </p>
      )}

      {/* Grid — reuse the lightweight catalog card */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((i) => (
          <ResultCard key={i.slug} r={i} locale={locale} freeLabel={t.freeLabel} />
        ))}
      </div>
    </div>
  );
}
