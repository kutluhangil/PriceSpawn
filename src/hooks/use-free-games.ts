"use client";

import { useEffect, useState } from "react";
import type { FreeOffer } from "@/data/free";
import { LUNA_FREE } from "@/data/luna";
import { activeLunaGames } from "@/lib/luna";

interface EpicFree {
  title: string;
  image: string;
  originalTRY: number;
  freeUntil: string;
  url: string;
}

function lunaOffers(): FreeOffer[] {
  return activeLunaGames(LUNA_FREE, new Date()).map((g) => ({
    title: g.title,
    coverUrl: g.coverUrl,
    platform: "prime",
    freeUntil: g.validUntil,
    normalTRY: 0,
    url: g.claimUrl,
  }));
}

/** Live Epic free games (Türkiye) + curated Amazon Luna monthly games. */
export function useFreeGames() {
  const [offers, setOffers] = useState<FreeOffer[]>(lunaOffers());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/free");
        const data = await res.json();
        if (cancelled) return;
        const epic: FreeOffer[] = (data.offers as EpicFree[]).map((e) => ({
          title: e.title,
          coverUrl: e.image,
          platform: "epic",
          freeUntil: e.freeUntil,
          normalTRY: e.originalTRY || 0,
          url: e.url,
        }));
        setOffers([...epic, ...lunaOffers()]);
      } catch {
        // keep Luna-only offers
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
