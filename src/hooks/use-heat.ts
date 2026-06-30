"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { HeatGetPayload, HeatPostPayload } from "@/app/api/heat/route";

interface HeatState {
  count: number;
  voted: boolean;
  loaded: boolean;
}

const EMPTY: HeatState = { count: 0, voted: false, loaded: false };

const cache = new Map<string, HeatState>();
const subs = new Map<string, Set<() => void>>();
let pending = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function notify(slug: string) {
  subs.get(slug)?.forEach((fn) => fn());
}

function deviceId(): string {
  try {
    let id = localStorage.getItem("heat-device");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("heat-device", id);
    }
    return id;
  } catch {
    return "";
  }
}

// Coalesce every slug requested in one render burst into a single GET, so a list
// of 40 cards costs one round-trip, not 40.
function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(flush, 60);
}

async function flush() {
  timer = null;
  const slugs = [...pending];
  pending = new Set();
  if (slugs.length === 0) return;
  const device = deviceId();
  try {
    const qs = `slugs=${slugs.map(encodeURIComponent).join(",")}&device=${encodeURIComponent(device)}`;
    const res = await fetch(`/api/heat?${qs}`);
    const data = (await res.json()) as HeatGetPayload;
    for (const slug of slugs) {
      cache.set(slug, { count: data.counts[slug] ?? 0, voted: data.voted[slug] ?? false, loaded: true });
      notify(slug);
    }
  } catch {
    for (const slug of slugs) {
      if (!cache.has(slug)) {
        cache.set(slug, { count: 0, voted: false, loaded: true });
        notify(slug);
      }
    }
  }
}

function ensureRequested(slug: string) {
  if (cache.has(slug)) return;
  pending.add(slug);
  scheduleFlush();
}

async function toggleHeat(slug: string) {
  const device = deviceId();
  if (!device) return;
  const cur = cache.get(slug) ?? { count: 0, voted: false, loaded: true };
  // optimistic flip
  cache.set(slug, { count: Math.max(0, cur.count + (cur.voted ? -1 : 1)), voted: !cur.voted, loaded: true });
  notify(slug);
  try {
    const res = await fetch("/api/heat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, device }),
    });
    if (res.ok) {
      const d = (await res.json()) as HeatPostPayload;
      cache.set(slug, { count: d.count, voted: d.voted, loaded: true });
    } else {
      cache.set(slug, cur); // rollback
    }
  } catch {
    cache.set(slug, cur); // rollback
  }
  notify(slug);
}

/** Live heat for one game: count, whether this device voted, and a toggle. */
export function useHeat(slug: string) {
  const subscribe = useCallback(
    (cb: () => void) => {
      let set = subs.get(slug);
      if (!set) {
        set = new Set();
        subs.set(slug, set);
      }
      set.add(cb);
      ensureRequested(slug);
      return () => {
        set!.delete(cb);
      };
    },
    [slug],
  );
  const getSnapshot = useCallback(() => cache.get(slug) ?? EMPTY, [slug]);
  const state = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const toggle = useCallback(() => toggleHeat(slug), [slug]);
  return { ...state, toggle };
}
