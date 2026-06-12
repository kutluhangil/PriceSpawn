"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addWatch,
  removeWatch,
  isWatched,
  setTarget,
  type WatchItem,
} from "@/lib/watchlist";

const KEY = "pricespawn-watch";

export function useWatchlist() {
  const [list, setList] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setList(JSON.parse(raw));
    } catch {
      // localStorage unavailable (private mode) — feature silently disabled
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: WatchItem[]) => {
    setList(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore write failures
    }
  }, []);

  const toggle = useCallback(
    (slug: string) =>
      persist(isWatched(list, slug) ? removeWatch(list, slug) : addWatch(list, slug)),
    [list, persist]
  );

  const setTargetFor = useCallback(
    (slug: string, target: number | null) => persist(setTarget(list, slug, target)),
    [list, persist]
  );

  const watched = useCallback((slug: string) => isWatched(list, slug), [list]);

  return { list, ready, toggle, setTargetFor, watched };
}
