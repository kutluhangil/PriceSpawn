"use client";

import { SALE_EVENTS } from "@/data/sales";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Days of look-ahead over which an upcoming sale's proximity bar fills up. */
const HORIZON = 45;

export function SaleCalendar({ limit = 5 }: { limit?: number }) {
  const { t, locale } = useApp();
  const now = new Date();
  const events = upcomingAndActive(SALE_EVENTS, now).slice(0, limit);
  if (events.length === 0) return null;

  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  return (
    <ul className="flex flex-col gap-3">
      {events.map((e) => {
        const status = saleStatus(e, now);
        const store = STORES[e.store];
        const accent = store.accent;

        const toStart = daysUntil(e.start, now); // days until it begins
        const toEnd = daysUntil(e.end, now); // days until it ends
        const span = Math.max(1, daysUntil(e.end, new Date(`${e.start}T00:00:00Z`)));

        // Progress bar: active → elapsed share of the sale; upcoming → proximity.
        const progress =
          status === "active"
            ? Math.min(1, Math.max(0, (span - toEnd) / span))
            : Math.min(1, Math.max(0, 1 - toStart / HORIZON));

        // Urgency: live = green, ≤3 days out = amber, otherwise brand accent.
        const soon = status === "upcoming" && toStart <= 3;
        const barColor = status === "active" ? "var(--best)" : soon ? "#f59e0b" : accent;

        const countdown =
          toStart <= 0
            ? t.saleStartsToday
            : toStart === 1
              ? t.saleStartsTomorrow
              : null;

        return (
          <li key={e.id}>
            <a
              href={e.url ?? store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="panel-strong group relative flex items-center gap-4 overflow-hidden rounded-xl py-3.5 pl-5 pr-4 transition-all hover:-translate-y-0.5 hover:border-accent"
            >
              {/* Mağaza rengi sol şerit */}
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ background: barColor }}
                aria-hidden="true"
              />

              {/* İkon kutusu */}
              <span
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105"
                style={{ background: `${accent}1f`, color: accent, borderColor: "transparent", boxShadow: `inset 0 0 0 1px ${accent}33` }}
              >
                <StoreLogo id={e.store} size={22} />
              </span>

              {/* Ad + tarih + ilerleme çubuğu */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bright">{e.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {fmt(e.start)} – {fmt(e.end)}
                </p>
                <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-(--row-hover)">
                  <span
                    className="block h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${Math.round(progress * 100)}%`, background: barColor }}
                  />
                </span>
              </div>

              {/* Durum */}
              <div className="shrink-0 text-right">
                {status === "active" ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ background: accent }}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                    {t.saleActiveNow}
                  </span>
                ) : countdown ? (
                  <span
                    className="text-xs font-bold"
                    style={{ color: soon ? "#f59e0b" : "var(--bright)" }}
                  >
                    {countdown}
                  </span>
                ) : (
                  <span className="leading-none">
                    <span
                      className="text-xl font-extrabold tabular-nums"
                      style={{ color: soon ? "#f59e0b" : "var(--bright)" }}
                    >
                      {toStart}
                    </span>
                    <span className="ml-1 text-xs font-normal text-muted">{t.saleDaysLeft}</span>
                  </span>
                )}
                {status === "active" && (
                  <p className="mt-1.5 text-[11px] text-muted">
                    {t.saleEndsIn} <span className="font-semibold text-fg">{toEnd}</span> {t.saleDayUnit}
                  </p>
                )}
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
