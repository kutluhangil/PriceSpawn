"use client";

import { useEffect, useState } from "react";
import type { GameExtra } from "@/app/api/game/route";

const EMPTY: GameExtra = { description: "", screenshots: [], tags: [] };

/** Steam media (screenshots/description/tags) for a numeric appid. */
export function useGameExtra(appid: string | null) {
  const [extra, setExtra] = useState<GameExtra>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!appid || !/^\d+$/.test(appid)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return () => {
        cancelled = true;
      };
    }
    fetch(`/api/game?appid=${appid}`)
      .then((r) => r.json())
      .then((d: GameExtra) => {
        if (!cancelled) setExtra(d);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [appid]);

  return { extra, ready };
}
