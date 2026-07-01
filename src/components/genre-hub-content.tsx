"use client";

import Link from "next/link";
import type { GenreHubItem } from "@/lib/genres";
import { useApp } from "@/components/providers";

export function GenreHubContent({ items }: { items: GenreHubItem[] }) {
  const { t } = useApp();

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] py-10">
      <header className="mb-7">
        <h1 className="font-display text-3xl font-extrabold text-bright">🎮 {t.genresPage}</h1>
        <p className="mt-1.5 text-sm text-muted">{t.genresNote}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((g) => (
          <Link
            key={g.label}
            href={g.href}
            className="panel-strong group flex flex-col gap-1.5 rounded-xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-accent/60"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-lg font-bold text-bright group-hover:text-accent">
                {g.label}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
                {g.count.toLocaleString("tr-TR")} {t.collectionCount}
              </span>
            </div>
            {g.blurb && <p className="line-clamp-2 text-xs text-muted">{g.blurb}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
