"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Live ticking countdown to an ISO end date. Renders nothing until mounted
 * (avoids SSR/hydration mismatch on time). Shows whole days when far out,
 * switches to HH:MM:SS in the final stretch.
 */
export function FreeCountdown({ until, className = "" }: { until: string; className?: string }) {
  const { t, locale } = useApp();
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setMs(Date.parse(until) - Date.now()), 1000);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMs(Date.parse(until) - Date.now());
    return () => clearInterval(id);
  }, [until]);

  if (ms === null) return null;
  if (ms <= 0) return <span className={className}>{locale === "tr" ? "Bitti" : "Ended"}</span>;

  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  const text =
    d >= 2
      ? `${d} ${t.daysLeft}`
      : `${d > 0 ? `${d}${locale === "tr" ? "g" : "d"} ` : ""}${pad(h)}:${pad(m)}:${pad(sec)}`;

  return <span className={`tabular-nums ${className}`}>{text}</span>;
}
