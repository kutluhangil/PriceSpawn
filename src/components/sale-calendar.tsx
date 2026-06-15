"use client";

import { SALE_EVENTS, type SaleEvent } from "@/data/sales";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Days of look-ahead over which an upcoming sale's proximity bar fills up. */
const HORIZON = 45;

export function SaleCalendar({ limit = 8 }: { limit?: number }) {
  const { t, locale } = useApp();
  const now = new Date();
  const events = upcomingAndActive(SALE_EVENTS, now).slice(0, limit);
  if (events.length === 0) return null;

  const loc = locale === "tr" ? "tr-TR" : "en-US";
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, { day: "numeric", month: "short", timeZone: "UTC" });
  const monthLabel = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, { month: "long", year: "numeric", timeZone: "UTC" });

  // Group by the start month so it reads like a real calendar agenda.
  const groups: { key: string; label: string; items: SaleEvent[] }[] = [];
  for (const e of events) {
    const key = e.start.slice(0, 7);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: monthLabel(e.start), items: [] };
      groups.push(g);
    }
    g.items.push(e);
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.key}>
          {/* Ay başlığı */}
          <div className="mb-2.5 flex items-center gap-3">
            <h3 className="font-display text-sm font-bold uppercase tracking-wide text-bright">{group.label}</h3>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">{group.items.length}</span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {group.items.map((e) => {
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
              const countdown =
                toStart <= 0 ? t.saleStartsToday : toStart === 1 ? t.saleStartsTomorrow : null;

              // Day-of-month chip — the "calendar" anchor.
              const startDay = new Date(`${e.start}T00:00:00Z`).getUTCDate();

              return (
                <li key={e.id}>
                  <a
                    href={e.url ?? store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="panel-strong group relative flex items-center gap-3 overflow-hidden rounded-xl py-3 pl-4 pr-3 transition-all hover:-translate-y-0.5 hover:border-accent sm:gap-4 sm:pl-5 sm:pr-4"
                  >
                    <span className="absolute inset-y-0 left-0 w-1" style={{ background: barColor }} aria-hidden="true" />

                    {/* Takvim günü çipi */}
                    <span
                      className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{ background: `${accent}1f`, boxShadow: `inset 0 0 0 1px ${accent}33` }}
                    >
                      <span className="text-base font-extrabold leading-none" style={{ color: accent }}>
                        {startDay}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1">
                        <StoreLogo id={e.store} size={11} />
                      </span>
                    </span>

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
                          <span className="hidden sm:inline">{t.saleActiveNow}</span>
                        </span>
                      ) : countdown ? (
                        <span className="text-xs font-bold" style={{ color: soon ? "#f59e0b" : "var(--bright)" }}>
                          {countdown}
                        </span>
                      ) : (
                        <span className="leading-none">
                          <span
                            className="text-lg font-extrabold tabular-nums sm:text-xl"
                            style={{ color: soon ? "#f59e0b" : "var(--bright)" }}
                          >
                            {toStart}
                          </span>
                          <span className="ml-1 text-[11px] font-normal text-muted sm:text-xs">{t.saleDaysLeft}</span>
                        </span>
                      )}
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
