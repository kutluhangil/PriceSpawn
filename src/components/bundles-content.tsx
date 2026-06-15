"use client";

import { useEffect, useState } from "react";
import type { BundleListPayload } from "@/app/api/bundles-list/route";
import type { ItadActiveBundle } from "@/lib/fetchers";
import { daysUntil } from "@/lib/sales";
import { useApp } from "@/components/providers";

export function BundlesContent() {
  const { t, locale } = useApp();
  const [bundles, setBundles] = useState<ItadActiveBundle[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bundles-list")
      .then((r) => r.json())
      .then((d: BundleListPayload) => {
        if (!cancelled) setBundles(d.bundles ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" });

  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">{t.bundlesPage}</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">{t.bundlesNote}</p>

      {ready && bundles.length === 0 ? (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">{t.bundlesEmpty}</div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {bundles.map((b) => {
            const left = b.expiry ? daysUntil(b.expiry.slice(0, 10), now) : null;
            const soon = left !== null && left <= 3;
            return (
              <li key={b.id}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="panel-strong group flex h-full flex-col gap-3 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-(--row) px-2.5 py-1 text-[11px] font-bold text-accent">
                      📦 {b.page}
                    </span>
                    {left !== null && (
                      <span
                        className="shrink-0 text-xs font-bold"
                        style={{ color: soon ? "#f59e0b" : "var(--bright)" }}
                      >
                        {left} <span className="font-normal text-muted">{t.saleDaysLeft}</span>
                      </span>
                    )}
                  </div>
                  <p className="font-display text-base font-bold leading-snug text-bright group-hover:text-accent">
                    {b.title}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      {b.games > 0 ? `${b.games} ${t.gamesWord}` : ""}
                    </span>
                    <span>
                      {b.expiry ? `${t.bundleEnds} ${fmt(b.expiry)}` : t.bundleOngoing} ↗
                    </span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
