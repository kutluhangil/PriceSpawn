"use client";

import Link from "next/link";
import { CoverImage } from "@/components/cover-image";
import { HeatButton } from "@/components/heat-button";
import { useApp } from "@/components/providers";

export interface HotItem {
  slug: string;
  title: string;
  cover: string;
  count: number;
}

export function HotDealsContent({ items }: { items: HotItem[] }) {
  const { t } = useApp();

  return (
    <>
      <header className="mb-7">
        <h1 className="font-display text-3xl font-extrabold text-bright">
          🔥 {t.hotDealsPage}
        </h1>
        <p className="mt-1.5 text-sm text-muted">{t.hotDealsNote}</p>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-(--panel) px-5 py-10 text-center text-sm text-muted">
          {t.hotDealsEmpty}
        </p>
      ) : (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <li key={item.slug}>
              <Link
                href={`/oyun/${item.slug}`}
                className="group flex items-center gap-3 overflow-hidden rounded-xl border border-border bg-(--panel-strong) p-2.5 transition-all hover:-translate-y-0.5 hover:border-accent/60"
              >
                <span className="w-6 shrink-0 text-center font-display text-lg font-extrabold tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="relative aspect-[460/215] h-12 shrink-0 overflow-hidden rounded-md">
                  <CoverImage src={item.cover} title={item.title} className="h-full w-full" sizes="120px" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-bright">{item.title}</span>
                  <span className="text-xs text-muted">
                    {item.count} {t.hotDealsHeat}
                  </span>
                </span>
                <span className="shrink-0">
                  <HeatButton slug={item.slug} compact />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
