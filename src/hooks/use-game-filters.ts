"use client";

import { useState } from "react";
import type { FilterOpts, SortKey } from "@/lib/filters";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

function emptyOpts(): FilterOpts {
  return {
    genres: [],
    stores: [],
    subscriptions: [],
    onlyDiscounted: false,
    minTRY: null,
    maxTRY: null,
    sort: "discount",
  };
}

export function useGameFilters(initial?: Partial<FilterOpts>) {
  const [opts, setOpts] = useState<FilterOpts>({ ...emptyOpts(), ...initial });

  const toggleIn = <T,>(key: "genres" | "stores" | "subscriptions", value: T) =>
    setOpts((o) => {
      const arr = o[key] as T[];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...o, [key]: next };
    });

  return {
    opts,
    toggleGenre: (g: string) => toggleIn("genres", g),
    toggleStore: (s: StoreId) => toggleIn("stores", s),
    toggleSub: (s: SubscriptionId) => toggleIn("subscriptions", s),
    setOnlyDiscounted: (v: boolean) => setOpts((o) => ({ ...o, onlyDiscounted: v })),
    setMin: (v: number | null) => setOpts((o) => ({ ...o, minTRY: v })),
    setMax: (v: number | null) => setOpts((o) => ({ ...o, maxTRY: v })),
    setSort: (s: SortKey) => setOpts((o) => ({ ...o, sort: s })),
    reset: () => setOpts(emptyOpts()),
  };
}
