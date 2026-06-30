"use client";

import { useHeat } from "@/hooks/use-heat";
import { useApp } from "@/components/providers";

/** 🔥 vote button — anonymous community heat for a game's current deal. */
export function HeatButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { t } = useApp();
  const { count, voted, toggle } = useHeat(slug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        aria-pressed={voted}
        aria-label={t.heatVote}
        title={t.heatHint}
        className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold backdrop-blur transition-colors ${
          voted ? "bg-accent text-white" : "bg-black/45 text-white/85 hover:text-white"
        }`}
      >
        <span aria-hidden="true">🔥</span>
        {count > 0 && <span className="tabular-nums">{count}</span>}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={voted}
      title={t.heatHint}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        voted ? "bg-accent text-white" : "border border-border text-fg hover:text-bright"
      }`}
    >
      <span aria-hidden="true">🔥</span>
      {voted ? t.heatVoted : t.heatVote}
      {count > 0 && <span className="tabular-nums opacity-90">· {count}</span>}
    </button>
  );
}
