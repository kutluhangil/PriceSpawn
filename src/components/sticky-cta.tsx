"use client";

import { useEffect, useRef, useState } from "react";
import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { formatTRY } from "@/lib/format";
import { STORES } from "@/lib/stores";
import { StoreLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

/** Sticky bottom bar showing the cheapest price once `watchRef` scrolls out of view. */
export function StickyCta({
  game,
  watchRef,
}: {
  game: Game;
  watchRef: React.RefObject<HTMLElement | null>;
}) {
  const { t, locale } = useApp();
  const [show, setShow] = useState(false);
  const best = bestPrice(game);
  const seen = useRef(false);

  useEffect(() => {
    const el = watchRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) seen.current = true;
        // only show after the price list has been seen and is now out of view
        setShow(seen.current && !entry.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [watchRef]);

  if (!best) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 backdrop-blur-xl transition-transform duration-300 sm:bottom-0 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex w-[min(100%-2rem,60rem)] items-center justify-between gap-4 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <StoreLogo id={best.price.store} size={18} />
          <span className="truncate text-sm font-semibold text-fg">{game.title}</span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="text-right">
            <span className="block text-[10px] uppercase text-muted">
              {t.cheapestAt} {STORES[best.price.store].label}
            </span>
            <span className="font-display text-lg font-bold text-best">
              {formatTRY(best.tryAmount, locale)}
            </span>
          </span>
        </span>
      </div>
    </div>
  );
}
