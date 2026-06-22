"use client";

import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { SubLogo } from "@/components/store-logo";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { useApp } from "@/components/providers";
import type { SubChangeSummaryEntry } from "@/lib/sub-changes";

export function SubChangeSummary({ summary }: { summary: SubChangeSummaryEntry[] }) {
  const { t } = useApp();
  const active = summary.filter((s) => s.added + s.removed > 0 && SUBSCRIPTIONS[s.subId]);
  if (active.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-bright">{t.subActivity}</h2>
          <p className="text-xs text-muted">{t.subLast30}</p>
        </div>
        <Link href="/abonelikler/degisiklikler" className="text-xs font-semibold text-accent hover:text-bright">
          {t.subSeeAll}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {active.map((s) => {
          const sub = SUBSCRIPTIONS[s.subId];
          return (
            <Link
              key={s.subId}
              href={`/abonelikler/degisiklikler?sub=${s.subId}`}
              className="panel flex items-center justify-between gap-3 rounded-[var(--radius-card)] px-4 py-3 transition-transform hover:scale-[1.005]"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-bold" style={{ color: sub.accent }}>
                <SubLogo id={s.subId} size={18} /> <span className="truncate">{sub.label}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3 text-xs font-bold tabular-nums">
                {s.added > 0 && <span className="text-emerald-400">+{s.added} {t.subAdded}</span>}
                {s.removed > 0 && <span className="text-rose-400">−{s.removed} {t.subRemoved}</span>}
                <span className="flex -space-x-3">
                  {s.sampleCovers.slice(0, 3).map((c, i) => (
                    <CoverImage key={i} src={c} title="" className="h-8 w-14 rounded-md ring-1 ring-border" />
                  ))}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
