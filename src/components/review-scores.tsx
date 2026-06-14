"use client";

import type { GameReviews } from "@/app/api/game/route";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

function metaColor(score: number): string {
  if (score >= 75) return "#15803d"; // green
  if (score >= 50) return "#b45309"; // amber
  return "#b91c1c"; // red
}

/** Steam positive-% + Metacritic badges. Hidden until review data loads. */
export function ReviewScores({ reviews }: { reviews?: GameReviews }) {
  const { t, locale } = useApp();
  if (!reviews) return null;
  const { steamPercent, steamTotal, steamDesc, metacritic, metacriticUrl } = reviews;
  const hasSteam = steamPercent >= 0 && steamTotal > 0;
  if (!hasSteam && metacritic == null) return null;

  const steamColor = steamPercent >= 80 ? "var(--best)" : steamPercent >= 70 ? "var(--fg)" : "var(--muted)";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasSteam && (
        <span
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold"
          title={`${steamDesc} · ${steamTotal.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} ${t.reviewsWord}`}
        >
          <StoreLogo id="steam" size={14} />
          <span className="font-bold" style={{ color: steamColor }}>%{steamPercent}</span>
          <span className="text-muted">
            {steamDesc ? `${steamDesc} · ` : ""}
            {steamTotal.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} {t.reviewsWord}
          </span>
        </span>
      )}
      {metacritic != null &&
        (() => {
          const inner = (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-flex h-6 w-7 items-center justify-center rounded text-xs font-extrabold text-white"
                style={{ background: metaColor(metacritic) }}
              >
                {metacritic}
              </span>
              <span className="text-xs font-semibold text-muted">Metacritic</span>
            </span>
          );
          return metacriticUrl ? (
            <a
              href={metacriticUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border px-2 py-1 transition-colors hover:border-accent"
            >
              {inner}
            </a>
          ) : (
            <span className="rounded-lg border border-border px-2 py-1">{inner}</span>
          );
        })()}
    </div>
  );
}
