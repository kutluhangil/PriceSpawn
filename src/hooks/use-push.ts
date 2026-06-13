"use client";

import { useCallback, useEffect, useState } from "react";
import type { WatchItem } from "@/lib/watchlist";
import { urlBase64ToUint8Array, pushSupported } from "@/lib/push-client";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

async function getReg(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing ?? (await navigator.serviceWorker.register("/sw.js"));
}

export function usePush(list: WatchItem[]) {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const ok = pushSupported();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(ok);
    if (!ok) return;
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setEnabled(!!sub && Notification.permission === "granted");
    });
  }, []);

  const sync = useCallback(async (watches: WatchItem[]) => {
    if (!pushSupported()) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) return;
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), watches }),
    });
  }, []);

  const enable = useCallback(async () => {
    if (!pushSupported() || !PUBLIC_KEY) return false;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return false;
    const reg = await getReg();
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) as BufferSource,
      }));
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub.toJSON(), watches: list }),
    });
    setEnabled(true);
    return true;
  }, [list]);

  const disable = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub) {
      await fetch("/api/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setEnabled(false);
  }, []);

  // Keep server watches in sync whenever the wishlist changes while enabled.
  useEffect(() => {
    if (enabled) sync(list);
  }, [list, enabled, sync]);

  return { enabled, supported, enable, disable };
}
