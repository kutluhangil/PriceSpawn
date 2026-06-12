"use client";

import type { Game } from "@/data/games";
import { priceHistory, sparklinePath } from "@/lib/history";
import { bestPrice } from "@/lib/price";

export function Sparkline({ game, className = "" }: { game: Game; className?: string }) {
  const best = bestPrice(game);
  if (!best) return null;
  const points = priceHistory(game, best.price.store, 90);
  if (points.length < 2) return null;

  const path = sparklinePath(points, 100, 28);
  const falling = points[points.length - 1].tryAmount <= points[0].tryAmount;
  const stroke = falling ? "var(--best)" : "var(--muted)";

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className={`h-7 w-full ${className}`}
      aria-hidden="true"
    >
      <path d={`${path} L100,28 L0,28 Z`} fill={stroke} opacity="0.12" />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
