"use client";

import Link from "next/link";
import { STORES, type StoreId } from "@/lib/stores";
import { GAMES } from "@/data/games";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

const ORDER: StoreId[] = [
  "steam",
  "epic",
  "xbox",
  "playstation",
  "gog",
  "ubisoft",
  "ea",
  "humble",
];

function countFor(store: StoreId): number {
  return GAMES.filter((g) => g.prices.some((p) => p.store === store)).length;
}

export function PlatformTiles() {
  const { t } = useApp();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ORDER.map((id) => {
        const s = STORES[id];
        const n = countFor(id);
        return (
          <Link
            key={id}
            href={`/oyunlar?store=${id}`}
            aria-label={s.label}
            className="group relative flex h-28 flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-border p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            style={{ background: `linear-gradient(135deg, ${s.accent}26, ${s.accent}0a)` }}
          >
            {/* büyük arka plan logosu */}
            <span
              className="pointer-events-none absolute -bottom-4 -right-3 opacity-15 transition-all duration-300 group-hover:scale-110 group-hover:opacity-25"
              style={{ color: s.accent }}
            >
              <StoreLogo id={id} size={92} />
            </span>
            <StoreLogo id={id} size={26} />
            <div className="relative">
              <p className="font-display text-sm font-bold text-bright">{s.label}</p>
              <p className="text-xs text-muted">
                {n} {t.gamesWord}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
