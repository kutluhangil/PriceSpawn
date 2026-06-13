"use client";

import { useMemo } from "react";
import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { GameCard } from "@/components/game-card";
import { useApp } from "@/components/providers";

export function BiggestDiscounts({ limit = 8 }: { limit?: number }) {
  const { priceLoaded, priceVersion } = useApp();
  const top = useMemo(() => {
    return GAMES.map((g) => ({ g, d: bestPrice(g)?.price.discountPercent ?? 0 }))
      .filter((x) => x.d > 0)
      .sort((a, b) => b.d - a.d)
      .slice(0, limit)
      .map((x) => x.g);
    // priceVersion bump means live prices changed → recompute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, priceVersion]);

  if (!priceLoaded || top.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {top.map((g) => (
        <GameCard key={g.slug} game={g} />
      ))}
    </div>
  );
}
