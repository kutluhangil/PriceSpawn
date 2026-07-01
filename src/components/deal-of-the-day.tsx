"use client";

import { useEffect, useState } from "react";
import type { DealsPayload } from "@/app/api/deals/route";
import type { ItadDealItem } from "@/lib/fetchers";
import type { StoreId } from "@/lib/stores";
import { formatTRY } from "@/lib/format";
import { StoreLogo } from "@/components/store-logo";
import { DealTag } from "@/components/deal-tag";
import { useApp } from "@/components/providers";

/** Single highlighted best live deal — editorial hero. */
export function DealOfTheDay() {
  const { t, locale } = useApp();
  const [deal, setDeal] = useState<ItadDealItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/deals")
      .then((r) => r.json())
      .then((d: DealsPayload) => {
        if (cancelled) return;
        // Prefer the steepest real-money discount; fall back to the very top.
        const list = d.deals ?? [];
        setDeal(list.find((x) => x.cut >= 60 && x.priceTRY > 0) ?? list[0] ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!deal) return null;

  return (
    <a
      href={deal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="panel-strong group relative grid overflow-hidden rounded-2xl sm:grid-cols-[1.3fr_1fr]"
    >
      <div className="relative aspect-[460/215] overflow-hidden bg-(--row) sm:aspect-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={deal.cover}
          alt={deal.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3">
          <DealTag cut={deal.cut} />
        </span>
      </div>

      <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">🔥 {t.dealOfDay}</p>
        <h3 className="font-display text-xl font-bold leading-tight text-bright sm:text-2xl">{deal.title}</h3>
        <div className="flex items-center gap-2">
          {deal.store && <StoreLogo id={deal.store as StoreId} size={16} />}
          <span className="text-sm text-muted">{deal.shopName}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="font-display text-2xl font-extrabold tabular-nums text-best">
            {deal.priceTRY === 0 ? t.freeNow : formatTRY(deal.priceTRY, locale)}
          </span>
          {deal.regularTRY > deal.priceTRY && (
            <span className="text-sm text-muted line-through">{formatTRY(deal.regularTRY, locale)}</span>
          )}
        </div>
        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-accent-strong px-4 py-2 text-sm font-bold text-white transition-transform group-hover:scale-[1.03]">
          {t.viewPrices} ↗
        </span>
      </div>
    </a>
  );
}
