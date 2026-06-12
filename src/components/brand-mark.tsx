"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHJKMNPQRSTUVWXYZ023456789$₺#%&@!?";
const BRAND = "pricespawn";
const SPLIT = 5; // "price" | "spawn"

/**
 * Matrix tarzı marka yazısı: harfler rastgele karakterlerle karışır,
 * soldan sağa kilitlenerek tekrar "pricespawn"a oturur.
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
    <span className={`font-display ${className}`} aria-label={BRAND}>
      <span aria-hidden="true" className="text-bright">
        {display.slice(0, SPLIT)}
      </span>
      <span aria-hidden="true" className="spectrum-text font-extrabold">
        {display.slice(SPLIT)}
      </span>
    </span>
  );
}
