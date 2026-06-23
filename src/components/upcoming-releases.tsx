"use client";

import { useEffect, useState } from "react";
import type { UpcomingPayload } from "@/app/api/upcoming/route";
import type { SteamUpcoming } from "@/lib/fetchers";
import { formatTRY } from "@/lib/format";
import { useApp } from "@/components/providers";

/** Tam günlük (UTC) çözünürlükte "bugünden X gün sonra". */
function daysUntilISO(iso: string, now: Date): number {
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

/** Önümüzdeki aylarda çıkacak oyunlar — compact poster grid (Steam, canlı). */
export function UpcomingReleases() {
  const { t, locale } = useApp();
  const [items, setItems] = useState<SteamUpcoming[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/upcoming")
      .then((r) => r.json())
      .then((d: UpcomingPayload) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const loc = locale === "tr" ? "tr-TR" : "en-US";
  const fmtShort = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "UTC" });

  if (items.length === 0) return null;
  const list = items.slice(0, 12);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {list.map((it) => {
        const d = daysUntilISO(it.date, now);
        const soon = d <= 7;
        const badgeBg = soon ? "#f59e0b" : "color-mix(in srgb, var(--accent) 88%, black)";

        return (
          <a
            key={it.appid}
            href={it.url}
            target="_blank"
            rel="noopener noreferrer"
            className="panel-strong group relative flex flex-col overflow-hidden rounded-xl transition-all hover:-translate-y-1 hover:border-accent"
          >
            <div className="relative aspect-[460/215] overflow-hidden bg-(--row)">
              {it.cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.cover}
                  alt={it.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              {/* Geri sayım rozeti — ilk bakışta "ne zaman" */}
              <span
                className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm"
                style={{ background: badgeBg }}
              >
                {d <= 0 ? t.upcomingReleaseToday : `${d} ${t.saleDaysLeft}`}
              </span>
            </div>

            <div className="flex min-w-0 flex-1 flex-col p-2.5">
              <p className="truncate text-sm font-bold text-bright">{it.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {fmtShort(it.date)}
                {it.free ? (
                  <span className="font-semibold text-best"> · {t.upcomingFree}</span>
                ) : it.priceTRY ? (
                  <span> · {formatTRY(it.priceTRY, locale)}</span>
                ) : null}
              </p>
            </div>
          </a>
        );
      })}
    </div>
  );
}
