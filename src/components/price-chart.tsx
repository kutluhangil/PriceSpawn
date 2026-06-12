"use client";

import { useEffect, useMemo, useState } from "react";
import type { Game } from "@/data/games";
import { sortedPrices } from "@/lib/price";
import { realAtl } from "@/lib/live";
import { formatTRY } from "@/lib/format";
import { STORES, type StoreId } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";
import type { HistoryPayload } from "@/app/api/history/route";

const W = 600;
const H = 200;
const PAD = 8;

export function PriceChart({ game }: { game: Game }) {
  const { t, locale } = useApp();
  const [hist, setHist] = useState<HistoryPayload>({ byStore: {}, days: 0 });
  const stores = sortedPrices(game).map((rp) => rp.price.store);
  const [store, setStore] = useState<StoreId>(stores[0]);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?slug=${encodeURIComponent(game.slug)}`)
      .then((r) => r.json())
      .then((d: HistoryPayload) => {
        if (!cancelled) setHist(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [game.slug]);

  const points = useMemo(() => hist.byStore[store] ?? [], [hist, store]);
  const atl = realAtl(game.slug);

  const vals = points.map((p) => p.amount);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const span = max - min || 1;
  const x = (i: number) => PAD + (i / Math.max(1, points.length - 1)) * (W - 2 * PAD);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - 2 * PAD);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.amount).toFixed(1)}`).join(" ");
  const area = points.length >= 2 ? `${line} L${x(points.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z` : "";

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD) / (W - 2 * PAD)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }
  const hp = hover !== null ? points[hover] : null;
  const enough = points.length >= 2;

  return (
    <div className="panel-strong rounded-[var(--radius-card)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-bright">{t.priceHistory}</h3>
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

      {enough ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img">
          <path d={area} fill="var(--accent)" opacity="0.12" />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {hp && (
            <>
              <line x1={x(hover!)} y1={PAD} x2={x(hover!)} y2={H - PAD} stroke="var(--border)" strokeWidth="1" />
              <circle cx={x(hover!)} cy={y(hp.amount)} r="3.5" fill="var(--bright)" />
            </>
          )}
        </svg>
      ) : (
        <div className="flex h-[120px] flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm font-semibold text-fg">{t.historyBuilding}</p>
          <p className="text-xs text-muted">
            {hist.days} {t.recordedDays}
            {points[0] ? ` · ${STORES[store].label} ${formatTRY(points[0].amount, locale)}` : ""}
          </p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted">
          {hp
            ? `${hp.date} · ${formatTRY(hp.amount, locale)}`
            : atl
              ? `${t.allTimeLowFull}: ${formatTRY(atl.amount, locale)} · ${atl.shop}${atl.day ? ` · ${atl.day}` : ""}`
              : ""}
        </span>
        {atl && <span className="font-bold text-best">{formatTRY(atl.amount, locale)}</span>}
      </div>
    </div>
  );
}
