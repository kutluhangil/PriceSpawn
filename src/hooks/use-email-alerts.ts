"use client";

import { useCallback, useEffect, useState } from "react";
import type { WatchItem } from "@/lib/watchlist";

const EMAIL_KEY = "pricespawn-email";
type Status = "idle" | "saving" | "saved" | "error";

function read(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

/** Email price alerts: stores the address locally, syncs watches to the server. */
export function useEmailAlerts(list: WatchItem[]) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const e = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setEmail(e);
  }, []);

  const save = useCallback(
    async (addr: string) => {
      const clean = addr.trim().toLowerCase();
      setStatus("saving");
      try {
        localStorage.setItem(EMAIL_KEY, clean);
      } catch {
        /* ignore */
      }
      setEmail(clean);
      try {
        const res = await fetch("/api/email/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: clean, watches: list }),
        });
        setStatus(res.ok ? "saved" : "error");
      } catch {
        setStatus("error");
      }
    },
    [list],
  );

  // Keep server watches in sync whenever the wishlist changes (silent: no re-verify).
  useEffect(() => {
    const e = read();
    if (!e) return;
    fetch("/api/email/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: e, watches: list, silent: true }),
    }).catch(() => {});
  }, [list]);

  return { email, status, save };
}
