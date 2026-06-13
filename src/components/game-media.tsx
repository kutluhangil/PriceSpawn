"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Skeleton } from "@/components/skeleton";
import { useApp } from "@/components/providers";

export function GameMedia({ screenshots, ready }: { screenshots: string[]; ready: boolean }) {
  const { t } = useApp();
  const [open, setOpen] = useState<number | null>(null);
  const n = screenshots.length;

  const close = () => setOpen(null);
  const go = (d: number) => setOpen((i) => (i === null ? null : (i + d + n) % n));

  useEffect(() => {
    if (open === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, n]);

  if (!ready) {
    return (
      <section className="mt-8">
        <Skeleton className="aspect-[16/6] w-full rounded-[var(--radius-card)]" />
      </section>
    );
  }
  if (n === 0) return null;

  const lightbox =
    open !== null && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition-colors hover:bg-white/25 sm:left-6 cursor-pointer"
            >
              ‹
            </button>
            <div
              className="relative h-[85vh] w-[92vw] max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={screenshots[open]} alt="" fill sizes="92vw" className="object-contain" priority />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white backdrop-blur transition-colors hover:bg-white/25 sm:right-6 cursor-pointer"
            >
              ›
            </button>
            <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white">
              {open + 1} / {n}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                close();
              }}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur hover:bg-white/25 cursor-pointer"
            >
              ✕
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="reveal mt-8">
      <h2 className="font-display mb-4 text-lg font-bold text-bright">{t.screenshotsLabel}</h2>
      <div className="row-scroll -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-3">
        {screenshots.map((src, i) => (
          <button
            key={src}
            onClick={() => setOpen(i)}
            className="relative aspect-[16/9] w-[300px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border border-border transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <Image src={src} alt="" fill sizes="300px" className="object-cover" />
          </button>
        ))}
      </div>
      {lightbox}
    </section>
  );
}
