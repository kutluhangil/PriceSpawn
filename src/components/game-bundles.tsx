"use client";

import { useEffect, useState } from "react";
import type { Game } from "@/data/games";
import { useApp } from "@/components/providers";

interface Bundle {
  title: string;
  page: string;
  url: string;
  expiry: string | null;
}

/** "This game is in a bundle right now" — live from ITAD (Humble/Fanatical/etc.). */
export function GameBundles({ game }: { game: Game }) {
  const { t, locale } = useApp();
  const [bundles, setBundles] = useState<Bundle[]>([]);

  useEffect(() => {
    if (!/^\d+$/.test(game.id)) return;
    let cancelled = false;
    fetch(`/api/bundles?appid=${game.id}`)
      .then((r) => r.json())
      .then((d: { bundles?: Bundle[] }) => {
        if (!cancelled) setBundles(d.bundles ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [game.id]);

  if (bundles.length === 0) return null;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
      day: "numeric",
      month: "short",
    });

  return (
    <section className="reveal mt-8">
      <h2 className="font-display mb-4 text-lg font-bold text-bright">📦 {t.inBundles}</h2>
      <ul className="flex flex-col gap-2.5">
        {bundles.map((b, i) => (
          <li key={i}>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="panel-strong flex items-center gap-3 rounded-[var(--radius-card)] px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--accent-soft) text-lg">
                📦
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-bright">{b.title}</p>
                <p className="text-xs text-muted">
                  {b.page}
                  {" · "}
                  {b.expiry ? `${t.bundleEnds} ${fmt(b.expiry)}` : t.bundleOngoing}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
