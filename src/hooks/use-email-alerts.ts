"use client";

import { useCallback, useEffect, useState } from "react";
import type { WatchItem } from "@/lib/watchlist";

const EMAIL_KEY = "pricespawn-email";
const DIGEST_KEY = "pricespawn-digest";
type Status = "idle" | "saving" | "saved" | "error";

function read(): string {
  try {
    return localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

function readDigest(): boolean {
  try {
    return localStorage.getItem(DIGEST_KEY) !== "0"; // default on
  } catch {
    return true;
  }
}

/** Email price alerts: stores the address locally, syncs watches + digest pref to the server. */
export function useEmailAlerts(list: WatchItem[]) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [digest, setDigestState] = useState(true);

  useEffect(() => {
    const e = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setEmail(e);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDigestState(readDigest());
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
          body: JSON.stringify({ email: clean, watches: list, digest }),
        });
        setStatus(res.ok ? "saved" : "error");
      } catch {
        setStatus("error");
      }
    },
    [list, digest],
  );

  const setDigest = useCallback(
    (v: boolean) => {
      setDigestState(v);
      try {
        localStorage.setItem(DIGEST_KEY, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      const e = read();
      if (!e) return;
      // Send the current watch set (NOT empty) so toggling digest never wipes alarms.
      fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, watches: list, silent: true, digest: v }),
      }).catch(() => {});
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

  return { email, status, save, digest, setDigest };
}
