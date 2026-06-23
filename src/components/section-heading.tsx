"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers";

/**
 * Section title — büyük Sora display, spektrum sol bar + scroll'da soldan
 * çizilen spektrum alt çizgisi. Görünür alana girince yükselerek belirir
 * (IntersectionObserver). prefers-reduced-motion'da statik gösterilir.
 */
export function SectionHeading({
  title,
  sub,
  note,
  href,
  id,
}: {
  title: string;
  sub?: string;
  /** Başlık altındaki açıklama satırı (ör. "Oyuncuların en çok takibe aldığı oyunlar."). */
  note?: string;
  href?: string;
  id?: string;
}) {
  const { t } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div id={id} ref={ref} className={`sec-head mb-5 scroll-mt-20${shown ? " is-in" : ""}`}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display flex items-center gap-3 text-[1.55rem] font-black leading-[1.04] tracking-[-0.032em] text-bright sm:text-[2.05rem]">
          <span
            className="sec-head-bar h-9 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-accent via-accent to-best sm:h-11"
            aria-hidden="true"
          />
          <span className="sec-head-title relative">
            {title}
            <span className="sec-head-line" aria-hidden="true" />
          </span>
          {sub && <span className="text-sm font-normal tracking-normal text-muted">{sub}</span>}
        </h2>
        {href && (
          <Link href={href} className="shrink-0 text-xs font-semibold text-accent transition-colors hover:text-bright">
            {t.seeAll} →
          </Link>
        )}
      </div>
      {note && <p className="mt-2 text-sm text-muted">{note}</p>}
    </div>
  );
}
