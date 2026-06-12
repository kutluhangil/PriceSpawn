"use client";

import { FreeCard } from "@/components/free-card";
import { useFreeGames } from "@/hooks/use-free-games";
import { useApp } from "@/components/providers";

export function FreeContent() {
  const { t } = useApp();
  const { offers, ready } = useFreeGames();

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">
        {t.freePage}
      </h1>
      <p className="mb-6 text-sm text-muted">{t.freeEpicNote}</p>

      {ready && offers.length === 0 ? (
        <div className="panel-strong rounded-[var(--radius-card)] px-6 py-12 text-center text-sm text-muted">
          {t.freeEmpty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((o) => (
            <FreeCard key={o.title} offer={o} />
          ))}
        </div>
      )}
    </div>
  );
}
