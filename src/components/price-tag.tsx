"use client";

import type { ResolvedPrice } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import type { Locale } from "@/i18n";

/** Steam tarzı fiyat bloğu: [-%50] [eski fiyat üstü çizili / yeni fiyat] */
export function PriceTag({
  rp,
  locale,
  size = "md",
  highlight = false,
}: {
  rp: ResolvedPrice;
  locale: Locale;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
}) {
  const pct = rp.price.discountPercent;
  const priceCls =
    size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  const chipCls =
    size === "lg" ? "px-2 py-1 text-base" : size === "sm" ? "px-1 py-0.5 text-[11px]" : "px-1.5 py-0.5 text-xs";

  return (
    <span className="inline-flex items-center gap-2">
      {pct !== undefined && (
        <span className={`discount-chip rounded ${chipCls}`}>-%{pct}</span>
      )}
      <span className="flex flex-col items-end leading-tight">
        {rp.tryOriginal !== undefined && (
          <span className="text-[11px] text-muted line-through">
            {formatTRY(rp.tryOriginal, locale)}
          </span>
        )}
        <span
          className={`font-display font-bold tabular-nums ${priceCls} ${
            highlight ? "text-best" : ""
          }`}
        >
          {formatTRY(rp.tryAmount, locale)}
        </span>
      </span>
    </span>
  );
}
