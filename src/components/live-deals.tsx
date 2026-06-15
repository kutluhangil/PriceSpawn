"use client";

import { useEffect, useState } from "react";
import type { DealsPayload } from "@/app/api/deals/route";
import type { ItadDealItem } from "@/lib/fetchers";
import type { StoreId } from "@/lib/stores";
import { formatTRY } from "@/lib/format";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Live cross-store deals feed (ITAD). Covers are ITAD banners — plain <img>. */
export function LiveDeals() {
  const { t, locale } = useApp();
  const [deals, setDeals] = useState<ItadDealItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/deals")
      .then((r) => r.json())
      .then((d: DealsPayload) => {
        if (!cancelled) setDeals(d.deals ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (deals.length === 0) return null;

  return (
    <section className="reveal pt-12" style={{ animationDelay: "0.17s" }}>
      <h2 className="font-display mb-1 text-lg font-bold text-bright sm:text-xl">{t.liveDeals}</h2>
      <p className="mb-4 text-sm text-muted">{t.liveDealsNote}</p>
      <div className="row-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
        {deals.map((d) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all hover:-translate-y-0.5 hover:border-accent"
          >
            <div className="relative aspect-[460/215] overflow-hidden bg-(--row)">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={d.cover}
                alt={d.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="discount-chip absolute left-2 top-2 rounded px-1.5 py-0.5 text-xs shadow-lg">
                -%{d.cut}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              <p className="truncate text-sm font-bold text-bright">{d.title}</p>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted">
                  {d.store && <StoreLogo id={d.store as StoreId} size={12} />}
                  <span className="truncate">{d.shopName} ↗</span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-best">
                  {d.priceTRY === 0 ? t.freeNow : formatTRY(d.priceTRY, locale)}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
