"use client";

import { SALE_EVENTS } from "@/data/sales";
import { saleStatus, daysUntil, upcomingAndActive } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

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
    <ul className="flex flex-col gap-2">
      {events.map((e) => {
        const status = saleStatus(e, now);
        const left = daysUntil(e.start, now);
        const store = STORES[e.store];
        return (
          <li key={e.id}>
            <a
              href={e.url ?? store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="panel-strong flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:border-accent"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${store.accent}1f` }}
              >
                <StoreLogo id={e.store} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bright">{e.name}</p>
                <p className="text-xs text-muted">
                  {fmt(e.start)} – {fmt(e.end)}
                </p>
              </div>
              {status === "active" ? (
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
                  style={{ background: store.accent }}
                >
                  ● {t.saleActiveNow}
                </span>
              ) : (
                <span className="shrink-0 text-right text-xs font-bold text-bright">
                  {left} <span className="font-normal text-muted">{t.saleDaysLeft}</span>
                </span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
