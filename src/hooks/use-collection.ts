"use client";

import { useCallback, useEffect, useState } from "react";
import { isOwned, toggleOwned } from "@/lib/collection";

const KEY = "pricespawn-owned";

export function useCollection() {
  const [list, setList] = useState<string[]>([]);
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

  const persist = useCallback((next: string[]) => {
    setList(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // ignore write failures
    }
  }, []);

  const toggle = useCallback((slug: string) => persist(toggleOwned(list, slug)), [list, persist]);
  const owned = useCallback((slug: string) => isOwned(list, slug), [list]);

  return { list, ready, owned, toggle };
}
