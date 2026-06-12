"use client";

import { useState } from "react";
import type { Game } from "@/data/games";
import { priceHistory, allTimeLow } from "@/lib/history";
import { sortedPrices } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES, type StoreId } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

const W = 600;
const H = 200;
const PAD = 8;

export function PriceChart({ game }: { game: Game }) {
  const { t, locale } = useApp();
  const stores = sortedPrices(game).map((rp) => rp.price.store);
  const [store, setStore] = useState<StoreId>(stores[0]);
  const [hover, setHover] = useState<number | null>(null);

  const points = priceHistory(game, store, 90);
  const vals = points.map((p) => p.tryAmount);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;

  const x = (i: number) => PAD + (i / (points.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - 2 * PAD);

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.tryAmount).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`;
  const atl = allTimeLow(game);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD) / (W - 2 * PAD)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="panel-strong rounded-2xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-bright">
          {t.priceHistory} <span className="font-normal text-muted">· {t.days90}</span>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {stores.map((s) => (
            <button
              key={s}
              onClick={() => setStore(s)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                s === store ? "bg-accent text-white" : "border border-border text-muted hover:text-fg"
              }`}
            >
              <StoreLogo id={s} size={13} /> {STORES[s].label}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
      >
        <path d={area} fill="var(--accent)" opacity="0.12" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {/* discount dips */}
        {points.map((p, i) =>
          p.tryAmount < min + span * 0.18 ? (
            <circle key={i} cx={x(i)} cy={y(p.tryAmount)} r="2.5" fill="var(--best)" />
          ) : null
        )}
        {hp && (
          <>
            <line x1={x(hover!)} y1={PAD} x2={x(hover!)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
            <circle cx={x(hover!)} cy={y(hp.tryAmount)} r="3.5" fill="var(--bright)" />
          </>
        )}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted">
          {hp ? `${hp.date} · ${formatTRY(hp.tryAmount, locale)}` : `${t.allTimeLowFull}: ${formatTRY(atl.tryAmount, locale)}`}
        </span>
        <span className="font-bold text-best">{formatTRY(atl.tryAmount, locale)}</span>
      </div>
    </div>
  );
}
