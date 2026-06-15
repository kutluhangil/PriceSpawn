"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AnticipatedPayload } from "@/app/api/anticipated/route";
import type { ItadRankItem } from "@/lib/fetchers";
import { GAMES } from "@/data/games";
import { CoverImage } from "@/components/cover-image";
import { useApp } from "@/components/providers";

const ITAD_BANNER = (id: string) => `https://assets.isthereanydeal.com/${id}/banner400.jpg`;

/** Most-anticipated (most-waitlisted) games from ITAD; links to our detail when we have it. */
export function Anticipated() {
  const { t } = useApp();
  const [items, setItems] = useState<ItadRankItem[]>([]);
  const bySlug = useMemo(() => new Map(GAMES.map((g) => [g.slug, g])), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/anticipated")
      .then((r) => r.json())
      .then((d: AnticipatedPayload) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="reveal pt-12" style={{ animationDelay: "0.19s" }}>
      <h2 className="font-display mb-1 text-lg font-bold text-bright sm:text-xl">{t.anticipated}</h2>
      <p className="mb-4 text-sm text-muted">{t.anticipatedNote}</p>
      <div className="row-scroll -mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3">
        {items.map((it) => {
          const game = bySlug.get(it.slug);
          const inner = (
            <div className="group w-[200px] shrink-0 snap-start overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all hover:-translate-y-0.5 hover:border-accent">
              <div className="relative aspect-[460/215] overflow-hidden bg-(--row)">
                {game ? (
                  <CoverImage
                    src={game.coverUrl}
                    title={it.title}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ITAD_BANNER(it.id)}
                    alt={it.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="truncate p-3 text-sm font-bold text-bright">{it.title}</p>
            </div>
          );
          return game ? (
            <Link key={it.id} href={`/oyun/${it.slug}`}>
              {inner}
            </Link>
          ) : (
            <a key={it.id} href={`https://isthereanydeal.com/game/${it.slug}/info/`} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          );
        })}
      </div>
    </section>
  );
}
