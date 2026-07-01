"use client";

import { useEffect, useState } from "react";
import type { SpecialsPayload, SteamSpecial } from "@/app/api/steam-specials/route";
import { formatTRY } from "@/lib/format";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Steam's front-page specials — a live discovery row sourced straight from Steam. */
export function SteamSpecials() {
  const { t, locale } = useApp();
  const [items, setItems] = useState<SteamSpecial[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/steam-specials")
      .then((r) => r.json())
      .then((d: SpecialsPayload) => {
        if (!cancelled) setItems(d.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold text-bright">
        <StoreLogo id="steam" size={18} /> {t.steamSpecials}
      </h2>
      <div className="row-scroll -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
        {items === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[460/215] w-[280px] shrink-0 animate-shimmer rounded-[var(--radius-card)]" />
            ))
          : items.map((it) => (
              <a
                key={it.appid}
                href={`https://store.steampowered.com/app/${it.appid}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${it.name} — Steam ↗`}
                className="group block w-[280px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60"
              >
                <div className="relative aspect-[460/215] overflow-hidden">
                  {it.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                  )}
                  <span className="discount-chip absolute bottom-2 left-2 rounded-[3px] px-1.5 py-0.5 text-xs shadow-lg">
                    -%{it.discountPercent}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <h3 className="truncate text-sm font-bold text-bright">{it.name}</h3>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="text-[10px] text-muted line-through">
                      {formatTRY(it.originalTRY, locale)}
                    </span>
                    <span className="text-sm font-bold text-best">{formatTRY(it.finalTRY, locale)}</span>
                  </span>
                </div>
              </a>
            ))}
      </div>
    </section>
  );
}
