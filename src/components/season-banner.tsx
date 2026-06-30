"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { SALE_EVENTS } from "@/data/sales";
import { activeSeason, type SeasonTheme } from "@/lib/season";
import { daysUntil } from "@/lib/sales";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

const SEASON_ACCENT: Record<SeasonTheme, string> = {
  summer: "#ff9d4d",
  autumn: "#e0792f",
  winter: "#5eb3ff",
  spring: "#5fd38a",
};

const SEASON_NAME_KEY: Record<SeasonTheme, "seasonSummer" | "seasonAutumn" | "seasonWinter" | "seasonSpring"> = {
  summer: "seasonSummer",
  autumn: "seasonAutumn",
  winter: "seasonWinter",
  spring: "seasonSpring",
};

const DISMISS_EVENT = "season-banner-dismiss";

function subscribeDismiss(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(DISMISS_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Slim site-wide strip shown only while a real seasonal sale is live (driven by
 * the curated sale calendar). Pairs with the [data-season] palette shift in
 * globals.css. Dismissible per-event so it never nags.
 */
export function SeasonBanner() {
  const { t, locale } = useApp();

  const now = new Date();
  const season = activeSeason(SALE_EVENTS, now);
  const key = season ? `season-dismissed-${season.id}` : null;

  // External store: server snapshot is always "not dismissed" so the banner is
  // server-rendered (no layout shift). On the client the snapshot reads
  // localStorage, so a previously dismissed event stays hidden — without the
  // hydration mismatch a useState/useEffect read would cause.
  const dismissed = useSyncExternalStore(
    subscribeDismiss,
    () => {
      if (!key) return false;
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  if (!season || dismissed) return null;

  const event = SALE_EVENTS.find((e) => e.id === season.id);
  if (!event) return null;
  const store = STORES[event.store];
  const accent = SEASON_ACCENT[season.theme];
  const toEnd = Math.max(0, daysUntil(season.end, now));
  const seasonName = t[SEASON_NAME_KEY[season.theme]];

  function dismiss() {
    if (!key) return;
    try {
      localStorage.setItem(key, "1");
    } catch {
      // ignore (private mode / storage disabled)
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <div
      className="relative border-b border-border/70"
      style={{ background: `linear-gradient(90deg, ${accent}26, ${accent}0d 55%, transparent)` }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${accent}26`, boxShadow: `inset 0 0 0 1px ${accent}40` }}
        >
          <StoreLogo id={event.store} size={14} />
        </span>

        <p className="min-w-0 flex-1 truncate">
          <span aria-hidden="true">🔥 </span>
          <span className="font-semibold text-bright">
            {store.label} {seasonName}
          </span>{" "}
          <span className="text-muted">{t.seasonStarted}</span>
          <span className="hidden text-muted sm:inline">
            {" · "}
            {t.saleEndsIn} <span className="font-semibold text-bright">{toEnd}</span> {t.saleDayUnit}
          </span>
        </p>

        <Link
          href="/oyunlar"
          className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: accent }}
        >
          {t.seasonCta} →
        </Link>

        <button
          type="button"
          onClick={dismiss}
          aria-label={locale === "tr" ? "Kapat" : "Dismiss"}
          className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-bright"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
