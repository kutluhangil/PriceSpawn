"use client";

import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { realAtl } from "@/lib/live";
import { dealVerdict, type VerdictLevel } from "@/lib/deal-verdict";
import { useApp } from "@/components/providers";

const STYLE: Record<VerdictLevel, { bg: string; fg: string; icon: string }> = {
  "buy-low": { bg: "var(--best)", fg: "#06270f", icon: "🔥" },
  buy: { bg: "var(--best)", fg: "#06270f", icon: "↓" },
  ok: { bg: "#f59e0b", fg: "#241a02", icon: "✓" },
  wait: { bg: "var(--row-hover)", fg: "var(--fg)", icon: "⏳" },
};

/**
 * Buy/Wait verdict pill. `compact` for cards, `full` for the detail page
 * (adds the one-line reason + how far the price sits above the all-time low).
 */
export function DealVerdict({
  game,
  variant = "compact",
}: {
  game: Game;
  variant?: "compact" | "full";
}) {
  // priceVersion from context re-renders this when live prices/ATL arrive.
  const { t } = useApp();
  const best = bestPrice(game);
  const atl = realAtl(game.slug);
  const v = dealVerdict({
    bestTRY: best?.tryAmount,
    atlTRY: atl?.amount,
    discountPercent: best?.price.discountPercent,
  });
  if (!v) return null;

  const label = { "buy-low": t.verdictBuyLow, buy: t.verdictBuy, ok: t.verdictOk, wait: t.verdictWait }[v.level];
  const hint = {
    "buy-low": t.verdictBuyLowHint,
    buy: t.verdictBuyHint,
    ok: t.verdictOkHint,
    wait: t.verdictWaitHint,
  }[v.level];
  const s = STYLE[v.level];

  if (variant === "compact") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide"
        style={{ background: s.bg, color: s.fg }}
        title={hint}
      >
        <span aria-hidden="true">{s.icon}</span> {label}
      </span>
    );
  }

  return (
    <div className="panel-strong flex items-center gap-3 rounded-[var(--radius-card)] p-3">
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-extrabold uppercase tracking-wide"
        style={{ background: s.bg, color: s.fg }}
      >
        <span aria-hidden="true">{s.icon}</span> {label}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-bright">{hint}</p>
        {v.abovePct !== undefined && v.abovePct > 0 && (
          <p className="text-xs text-muted">
            {t.verdictVsLow} <span className="font-semibold text-fg">+%{v.abovePct}</span> {t.verdictAbove}
          </p>
        )}
      </div>
    </div>
  );
}
