"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/skeleton";
import { useApp } from "@/components/providers";

export function GameMedia({ screenshots, ready }: { screenshots: string[]; ready: boolean }) {
  const { t } = useApp();
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % screenshots.length));
      if (e.key === "ArrowLeft")
        setOpen((i) => (i === null ? null : (i - 1 + screenshots.length) % screenshots.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, screenshots.length]);

  if (!ready) {
    return (
      <section className="mt-8">
        <Skeleton className="aspect-[16/6] w-full rounded-[var(--radius-card)]" />
      </section>
    );
  }
  if (screenshots.length === 0) return null;

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

      {open !== null && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div className="relative h-[80vh] w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <Image src={screenshots[open]} alt="" fill sizes="90vw" className="object-contain" />
          </div>
          <button
            onClick={() => setOpen(null)}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white backdrop-blur hover:bg-white/20"
          >
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
