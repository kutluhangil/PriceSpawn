"use client";

import { GAMES } from "@/data/games";
import { STORES } from "@/lib/stores";
import { currentRate } from "@/lib/exchange";
import { useApp } from "@/components/providers";

/** Hero stat strip: catalog scale + live deal count + FX — instant credibility. */
export function StatBar({ catalogTotal, dealCount }: { catalogTotal: number; dealCount: number }) {
  const { t, locale } = useApp();
  const loc = locale === "tr" ? "tr-TR" : "en-US";
  const games = (catalogTotal || GAMES.length).toLocaleString(loc);
  const stores = Object.keys(STORES).length;
  const fx = currentRate().toLocaleString(loc, { maximumFractionDigits: 2 });

  const Dot = () => <span className="text-border" aria-hidden="true">•</span>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-sm text-muted">
      <span>
        <b className="font-bold text-bright">{games}</b> {t.gamesWord}
      </span>
      <Dot />
      <span>
        <b className="font-bold text-bright">{stores}</b> {t.storesCount}
      </span>
      {dealCount > 0 && (
        <>
          <Dot />
          <span>
            <b className="font-bold text-best">{dealCount}</b> {t.nowOnSale}
          </span>
        </>
      )}
      <Dot />
      <span>
        $1 ≈ <b className="font-semibold text-fg">₺{fx}</b>
      </span>
    </div>
  );
}
