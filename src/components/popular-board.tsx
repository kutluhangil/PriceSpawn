"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PopularPayload } from "@/app/api/popular/route";
import type { ItadRankItem } from "@/lib/fetchers";
import { GAMES } from "@/data/games";
import { CoverImage } from "@/components/cover-image";
import { SectionHeading } from "@/components/section-heading";
import { useApp } from "@/components/providers";

const ITAD_BANNER = (id: string) => `https://assets.isthereanydeal.com/${id}/banner400.jpg`;

function RankGrid({ items }: { items: ItadRankItem[] }) {
  const bySlug = useMemo(() => new Map(GAMES.map((g) => [g.slug, g])), []);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((it, idx) => {
        const game = bySlug.get(it.slug);
        const inner = (
          <div className="group relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-(--panel-strong) transition-all hover:-translate-y-0.5 hover:border-accent">
            <span className="absolute left-2 top-2 z-10 rounded-full bg-black/65 px-2 py-0.5 text-xs font-black tabular-nums text-white">
              #{idx + 1}
            </span>
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
          <a
            key={it.id}
            href={`https://isthereanydeal.com/game/${it.slug}/info/`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {inner}
          </a>
        );
      })}
    </div>
  );
}

/** Popularity leaderboards (most-waitlisted + most-popular) from ITAD. */
export function PopularBoard() {
  const { t } = useApp();
  const [data, setData] = useState<PopularPayload>({ waitlisted: [], popular: [] });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/popular")
      .then((r) => r.json())
      .then((d: PopularPayload) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-10">
      {data.waitlisted.length > 0 && (
        <section>
          <SectionHeading title={t.popularWaitlisted} note={t.popularWaitlistedNote} />
          <RankGrid items={data.waitlisted} />
        </section>
      )}
      {data.popular.length > 0 && (
        <section>
          <SectionHeading title={t.popularMost} note={t.popularMostNote} />
          <RankGrid items={data.popular} />
        </section>
      )}
      {data.waitlisted.length === 0 && data.popular.length === 0 && (
        <p className="py-16 text-center text-sm text-muted">{t.popularEmpty}</p>
      )}
    </div>
  );
}
