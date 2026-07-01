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
const H = 180;
const PAD_L = 46; // sol: y-ekseni fiyat etiketleri
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 20; // alt: tarih etiketleri

export function PriceChart({ game }: { game: Game }) {
  const { t, locale } = useApp();
  const [hist, setHist] = useState<HistoryPayload>({ byStore: {}, days: 0 });
  const stores = sortedPrices(game).map((rp) => rp.price.store);
  // Default to the first store that actually has recorded history (some stores,
  // e.g. PlayStation, aren't tracked by ITAD); user can still pick any tab.
  const [picked, setPicked] = useState<StoreId | null>(null);
  const store = picked ?? stores.find((s) => (hist.byStore[s]?.length ?? 0) >= 2) ?? stores[0];
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
  // Pull the all-time low into the y-domain so its reference line is on-canvas.
  const min = vals.length ? Math.min(...vals, atl?.amount ?? Infinity) : 0;
  const max = vals.length ? Math.max(...vals, atl?.amount ?? -Infinity) : 1;
  const span = max - min || 1;
  const x = (i: number) => PAD_L + (i / Math.max(1, points.length - 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_T + (1 - (v - min) / span) * (H - PAD_T - PAD_B);
  // Step line: a price holds until it changes, so draw horizontal-then-vertical
  // segments (like ITAD) rather than diagonal interpolation.
  const line = points
    .map((p, i) =>
      i === 0
        ? `M${x(0).toFixed(1)},${y(p.amount).toFixed(1)}`
        : `L${x(i).toFixed(1)},${y(points[i - 1].amount).toFixed(1)} L${x(i).toFixed(1)},${y(p.amount).toFixed(1)}`,
    )
    .join(" ");
  const area =
    points.length >= 2
      ? `${line} L${x(points.length - 1).toFixed(1)},${H - PAD_B} L${x(0).toFixed(1)},${H - PAD_B} Z`
      : "";

  // Index of the lowest recorded point → green marker.
  const lowIdx = vals.length ? vals.indexOf(Math.min(...vals)) : -1;
  const lastIdx = points.length - 1;
  // Three y-axis gridlines: max, mid, min of the domain.
  const gridVals = [max, min + span / 2, min];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD_L) / (W - PAD_L - PAD_R)) * (points.length - 1));
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
              onClick={() => setPicked(s)}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                s === store ? "bg-accent-strong text-white" : "border border-border text-muted hover:text-fg"
              }`}
            >
              <StoreLogo id={s} size={13} /> {STORES[s].label}
            </button>
          ))}
        </div>
      </div>

      {enough ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full select-none"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
        >
          <defs>
            <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Yatay ızgara + y-ekseni fiyat etiketleri */}
          {gridVals.map((v, i) => (
            <g key={i}>
              <line
                x1={PAD_L}
                y1={y(v)}
                x2={W - PAD_R}
                y2={y(v)}
                stroke="var(--border)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity={i === 2 ? 0 : 0.4}
              />
              <text
                x={PAD_L - 8}
                y={y(v) + 3}
                textAnchor="end"
                fontSize="10"
                fontWeight="600"
                fill="var(--muted)"
              >
                {formatTRY(v, locale)}
              </text>
            </g>
          ))}

          {/* Gradyan dolgu + adım çizgisi */}
          <path d={area} fill="url(#pc-fill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Tüm zamanların en düşüğü referans çizgisi + yeşil nokta */}
          {atl && y(atl.amount) >= PAD_T && y(atl.amount) <= H - PAD_B && (
            <line
              x1={PAD_L}
              y1={y(atl.amount)}
              x2={W - PAD_R}
              y2={y(atl.amount)}
              stroke="var(--best)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              vectorEffect="non-scaling-stroke"
              opacity="0.85"
            />
          )}
          {lowIdx >= 0 && (
            <circle cx={x(lowIdx)} cy={y(vals[lowIdx])} r="4" fill="var(--best)" stroke="var(--bg)" strokeWidth="1.5" />
          )}

          {/* Güncel fiyat noktası (son kayıt) */}
          {lastIdx >= 0 && lastIdx !== lowIdx && (
            <circle cx={x(lastIdx)} cy={y(points[lastIdx].amount)} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="1.5" />
          )}

          {/* Hover: dikey kılavuz + nokta + yüzen etiket */}
          {hp && (
            <>
              <line
                x1={x(hover!)}
                y1={PAD_T}
                x2={x(hover!)}
                y2={H - PAD_B}
                stroke="var(--muted)"
                strokeWidth="1"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
                opacity="0.6"
              />
              <circle cx={x(hover!)} cy={y(hp.amount)} r="4.5" fill="var(--bright)" stroke="var(--accent)" strokeWidth="2" />
              {(() => {
                const label = formatTRY(hp.amount, locale);
                const bw = Math.max(58, label.length * 8 + 16);
                const bx = Math.min(Math.max(x(hover!) - bw / 2, PAD_L), W - PAD_R - bw);
                const by = Math.max(y(hp.amount) - 30, 2);
                return (
                  <g pointerEvents="none">
                    <rect x={bx} y={by} width={bw} height={22} rx="6" fill="var(--bg)" stroke="var(--border)" strokeWidth="1" />
                    <text x={bx + bw / 2} y={by + 15} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--bright)">
                      {label}
                    </text>
                  </g>
                );
              })()}
            </>
          )}

          {/* İlk / son tarih ekseni */}
          {points[0] && (
            <text x={PAD_L} y={H - 5} fontSize="9.5" fontWeight="600" fill="var(--muted)">
              {points[0].date}
            </text>
          )}
          {points[lastIdx] && (
            <text x={W - PAD_R} y={H - 5} textAnchor="end" fontSize="9.5" fontWeight="600" fill="var(--muted)">
              {points[lastIdx].date}
            </text>
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

      {/* Alt özet: ATL rozeti + hover tarihi */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2.5 text-xs">
        <span className="text-muted">
          {hp
            ? hp.date
            : atl
              ? `${t.allTimeLowFull} · ${atl.shop}${atl.day ? ` · ${atl.day}` : ""}`
              : ""}
        </span>
        {atl && (
          <span className="inline-flex items-center gap-1.5 font-bold text-best">
            <span className="h-2 w-2 rounded-full bg-best" />
            {formatTRY(atl.amount, locale)}
          </span>
        )}
      </div>
    </div>
  );
}
