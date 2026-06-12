"use client";

import { useEffect, useState } from "react";
import type { FreeOffer } from "@/data/free";

interface EpicFree {
  title: string;
  image: string;
  originalTRY: number;
  freeUntil: string;
  url: string;
}

/** Live Epic free games (Türkiye) → FreeOffer[]. */
export function useFreeGames() {
  const [offers, setOffers] = useState<FreeOffer[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/free");
        const data = await res.json();
        if (cancelled) return;
        const mapped: FreeOffer[] = (data.offers as EpicFree[]).map((e) => ({
          title: e.title,
          coverUrl: e.image,
          platform: "epic",
          freeUntil: e.freeUntil,
          normalTRY: e.originalTRY || 0,
          url: e.url,
        }));
        setOffers(mapped);
      } catch {
        // keep empty
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { offers, ready };
}
