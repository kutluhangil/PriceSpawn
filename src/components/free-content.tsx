"use client";

import { FREE_OFFERS } from "@/data/free";
import { FreeCard } from "@/components/free-card";
import { useApp } from "@/components/providers";

/** Offers still active (freeUntil today or later). */
function activeOffers() {
  const today = new Date().toISOString().slice(0, 10);
  return FREE_OFFERS.filter((o) => o.freeUntil >= today);
}

export function FreeContent() {
  const { t } = useApp();
  const offers = activeOffers();

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-bright sm:text-3xl">
        {t.freePage}
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {offers.map((o) => (
          <FreeCard key={o.title} offer={o} />
        ))}
      </div>
    </div>
  );
}
