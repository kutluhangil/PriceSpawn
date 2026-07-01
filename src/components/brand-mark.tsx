"use client";

import { useEffect, useState } from "react";

const GLYPHS = "abcdefghijkmnopqrstuvwxyz0123456789";
const BRAND = "pricespawn";
const SPLIT = 5; // "price" | "spawn"

/**
 * Matrix-style brand mark: letters scramble then lock back to "pricespawn".
 * The animated text is absolutely positioned over an invisible static sizer,
 * so its changing width never reflows neighbouring nav items.
 */
export function BrandMark({ className = "" }: { className?: string }) {
  const [display, setDisplay] = useState(BRAND);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tick: ReturnType<typeof setInterval> | null = null;

    const scramble = () => {
      let frame = 0;
      const total = 26;
      if (tick) clearInterval(tick);
      tick = setInterval(() => {
        frame++;
        const locked = Math.floor((frame / total) * BRAND.length);
        setDisplay(
          BRAND.split("")
            .map((ch, i) =>
              i < locked ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
            )
            .join("")
        );
        if (frame >= total) {
          if (tick) clearInterval(tick);
          setDisplay(BRAND);
        }
      }, 45);
    };

    scramble();
    const loop = setInterval(scramble, 8000);
    return () => {
      clearInterval(loop);
      if (tick) clearInterval(tick);
    };
  }, []);

  return (
    <span className={`relative inline-block font-display ${className}`} role="img" aria-label={BRAND}>
      {/* invisible sizer reserves the final width so nav never shifts */}
      <span aria-hidden="true" className="invisible font-extrabold">
        {BRAND}
      </span>
      <span aria-hidden="true" className="absolute inset-0 flex items-center whitespace-nowrap">
        <span className="text-bright">{display.slice(0, SPLIT)}</span>
        <span className="spectrum-text font-extrabold">{display.slice(SPLIT)}</span>
      </span>
    </span>
  );
}
