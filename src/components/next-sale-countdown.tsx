"use client";

import { SALE_EVENTS } from "@/data/sales";
import { upcomingAndActive, saleStatus, daysUntil } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Companion to the calendar: a big countdown to the next real discount sale. */
export function NextSaleCountdown() {
  const { t, locale } = useApp();
  const now = new Date();
  const events = upcomingAndActive(SALE_EVENTS, now);
  // Prefer a real discount event over "Next Fest" (which is demos, not deals).
  const pick = events.find((e) => !/next fest/i.test(e.name)) ?? events[0];
  if (!pick) return null;

  const status = saleStatus(pick, now);
  const days = Math.max(0, daysUntil(pick.start, now));
  const toEnd = Math.max(0, daysUntil(pick.end, now));
  const store = STORES[pick.store];
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    });

  const active = status === "active";
  const big = active ? toEnd : days;

  return (
    <div
      className="panel-strong relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5"
      style={{ background: `radial-gradient(120% 120% at 0% 0%, ${store.accent}22, transparent 60%)` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${store.accent}1f` }}
        >
          <StoreLogo id={pick.store} size={20} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          {t.nextSaleTitle}
        </span>
      </div>

      <div className="my-4">
        <p className="font-display text-xl font-bold leading-tight text-bright">{pick.name}</p>
        <p className="mt-1 text-xs text-muted">
          {fmt(pick.start)} – {fmt(pick.end)}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        {active ? (
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold text-white"
            style={{ background: store.accent }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            {t.saleActiveNow}
          </span>
        ) : (
          <p className="leading-none">
            <span className="text-xs text-muted">{t.nextSaleStarts}</span>
            <br />
            <span className="font-display text-4xl font-extrabold tabular-nums text-bright">{big}</span>
            <span className="ml-1.5 text-sm font-semibold text-muted">{t.saleDaysLeft}</span>
          </p>
        )}
        {active && (
          <p className="text-right text-xs text-muted">
            {t.saleEndsIn} <span className="font-bold text-bright">{toEnd}</span> {t.saleDayUnit}
          </p>
        )}
      </div>
    </div>
  );
}
