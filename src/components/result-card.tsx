import Link from "next/link";
import type { SearchResult } from "@/app/api/search/route";
import type { BrowseItem } from "@/app/api/catalog-browse/route";
import { formatTRY } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";

/** Lightweight result card (DB browse + search) — no per-card live fetch. */
export function ResultCard({ r, locale, freeLabel }: { r: BrowseItem | SearchResult; locale: "tr" | "en"; freeLabel: string }) {
  const discount = "discount" in r ? r.discount : null;
  return (
    <Link
      href={`/oyun/${r.slug}`}
      className="group block overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all hover:-translate-y-0.5 hover:border-accent"
    >
      <div className="relative">
        <CoverImage src={r.cover} title={r.title} className="aspect-[460/215] w-full" />
        {discount ? (
          <span className="discount-chip absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold">
            -%{discount}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-bright">{r.title}</span>
          {r.year > 0 && <span className="text-xs text-muted">{r.year}</span>}
        </span>
        {r.priceTRY !== null ? (
          <span className="shrink-0 text-sm font-bold tabular-nums text-best">{formatTRY(r.priceTRY, locale)}</span>
        ) : r.isFree ? (
          <span className="shrink-0 text-sm font-bold text-best">{freeLabel}</span>
        ) : null}
      </div>
    </Link>
  );
}
