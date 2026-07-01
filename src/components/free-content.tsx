"use client";

import { FreeCard } from "@/components/free-card";
import { FreeCountdown } from "@/components/free-countdown";
import { CoverImage } from "@/components/cover-image";
import { useFreeGames } from "@/hooks/use-free-games";
import { sortBySoonest, endingSoon } from "@/lib/free-urgency";
import { useApp } from "@/components/providers";

export function FreeContent() {
  const { t } = useApp();
  const { offers, ready } = useFreeGames();

  const now = new Date();
  const sorted = sortBySoonest(offers);
  const soon = sorted.filter((o) => endingSoon(o, now));

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">
        {t.freePage}
      </h1>
      <p className="mb-6 text-sm text-muted">{t.freeEpicNote}</p>

      {/* Aciliyet şeridi: 48 saat içinde kapananlar */}
      {soon.length > 0 && (
        <div
          className="mb-6 rounded-2xl border border-amber-500/30 p-4"
          style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.14), transparent 70%)" }}
        >
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-bright">
            <span aria-hidden="true">⏰</span> {t.freeEndingSoonTitle}
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {soon.map((o) => (
              <a
                key={o.title}
                href={o.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-border bg-(--panel-strong) p-2 transition-all hover:-translate-y-0.5 hover:border-accent/60"
              >
                <span className="relative aspect-[460/215] h-12 shrink-0 overflow-hidden rounded-md">
                  <CoverImage src={o.coverUrl} title={o.title} className="h-full w-full" sizes="120px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-bright">{o.title}</span>
                  <span className="text-xs font-semibold text-amber-500">
                    {t.freeUntilLabel} <FreeCountdown until={o.freeUntil} />
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-black">
                  {t.freeClaim}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {ready && offers.length === 0 ? (
        <div className="panel-strong rounded-[var(--radius-card)] px-6 py-12 text-center text-sm text-muted">
          {t.freeEmpty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((o) => (
            <FreeCard key={o.title} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}
