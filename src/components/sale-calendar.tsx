"use client";

import { SALE_EVENTS } from "@/data/sales";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Days of look-ahead over which an upcoming sale's proximity bar fills up. */
const HORIZON = 45;

/** Compact grid of upcoming/active store sales — scannable at a glance. */
export function SaleCalendar({ limit = 8 }: { limit?: number }) {
  const { t, locale } = useApp();
  const now = new Date();
  const events = upcomingAndActive(SALE_EVENTS, now).slice(0, limit);
  if (events.length === 0) return null;

  const loc = locale === "tr" ? "tr-TR" : "en-US";
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "UTC" });

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {events.map((e) => {
        const status = saleStatus(e, now);
        const store = STORES[e.store];
        const accent = store.accent;
        const toStart = daysUntil(e.start, now);
        const toEnd = daysUntil(e.end, now);
        const span = Math.max(1, daysUntil(e.end, new Date(`${e.start}T00:00:00Z`)));
        const progress =
          status === "active"
            ? Math.min(1, Math.max(0, (span - toEnd) / span))
            : Math.min(1, Math.max(0, 1 - toStart / HORIZON));
        const soon = status === "upcoming" && toStart <= 3;
        const barColor = status === "active" ? "var(--best)" : soon ? "#f59e0b" : accent;
        const startDay = new Date(`${e.start}T00:00:00Z`).getUTCDate();

        return (
          <a
            key={e.id}
            href={e.url ?? store.url}
            target="_blank"
            rel="noopener noreferrer"
            className="panel-strong group relative flex items-center gap-3 overflow-hidden rounded-xl py-2.5 pl-4 pr-3 transition-all hover:-translate-y-0.5 hover:border-accent"
          >
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: barColor }} aria-hidden="true" />

            {/* Takvim günü çipi */}
            <span
              className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
              style={{ background: `${accent}1f`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
            >
              <span className="text-base font-extrabold leading-none" style={{ color: accent }}>
                {startDay}
              </span>
              <span className="mt-0.5">
                <StoreLogo id={e.store} size={11} />
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-bright">{e.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {fmt(e.start)} – {fmt(e.end)}
              </p>
              <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-(--row-hover)">
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%`, background: barColor }}
                />
              </span>
            </div>

            <div className="shrink-0 text-right">
              {status === "active" ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: accent }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: accent }} />
                </span>
              ) : (
                <span className="leading-none">
                  <span
                    className="text-base font-extrabold tabular-nums"
                    style={{ color: soon ? "#f59e0b" : "var(--bright)" }}
                  >
                    {toStart}
                  </span>
                  <span className="ml-1 text-[10px] font-normal text-muted">{t.saleDaysLeft}</span>
                </span>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}
