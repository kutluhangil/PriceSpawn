"use client";

import { useEffect, useRef, useState } from "react";
import { formatTRY } from "@/lib/format";
import type { Locale } from "@/i18n";

export function CountUp({
  value,
  locale,
  className = "",
  duration = 600,
}: {
  value: number;
  locale: Locale;
  className?: string;
  duration?: number;
}) {
  const [current, setCurrent] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 0 : duration;
    const start = performance.now();
    const tick = (now: number) => {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setCurrent(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span className={className}>{formatTRY(current, locale)}</span>;
}
