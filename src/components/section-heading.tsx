"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";

/** Section title with a spectrum accent bar + optional "see all" link. */
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
  return (
    <div id={id} className="mb-4 scroll-mt-20">
      <div className="flex items-end justify-between gap-3">
        <h2 className="font-display flex items-center gap-3 text-xl font-extrabold tracking-tight text-bright sm:text-2xl">
          <span className="h-7 w-1 shrink-0 rounded-full bg-gradient-to-b from-accent to-best" aria-hidden="true" />
          {title}
          {sub && <span className="text-sm font-normal text-muted">{sub}</span>}
        </h2>
        {href && (
          <Link href={href} className="shrink-0 text-xs font-semibold text-accent transition-colors hover:text-bright">
            {t.seeAll} →
          </Link>
        )}
      </div>
      {note && <p className="mt-1.5 text-sm text-muted">{note}</p>}
    </div>
  );
}
