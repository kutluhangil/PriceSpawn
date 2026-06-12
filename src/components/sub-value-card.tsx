"use client";

import Link from "next/link";
import type { SubscriptionId } from "@/lib/subscriptions";
import { GAMES } from "@/data/games";
import { subscriptionValue } from "@/lib/sub-value";
import { formatTRY } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";
import { SubLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

export function SubValueCard({ id }: { id: SubscriptionId }) {
  const { t, locale } = useApp();
  const v = subscriptionValue(id, GAMES);
  const preview = v.games.slice(0, 8);

  return (
    <div className="panel-strong flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <SubLogo id={id} size={28} />
        <div>
          <h2 className="text-lg font-bold text-bright">
            {v.count} {t.gamesWord}
          </h2>
          <p className="text-xs text-muted">
            {formatTRY(v.totalTRY, locale)} {t.valueWorth}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm font-extrabold text-bright">
            {formatTRY(v.monthlyTRY, locale)}
            <span className="text-xs font-normal text-muted">{t.perMonth}</span>
          </p>
          <p className="text-xs font-bold text-best">{Math.round(v.ratio)}× {t.valueWorth}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
        {preview.map((g) => (
          <Link
            key={g.slug}
            href={`/oyun/${g.slug}`}
            title={g.title}
            className="overflow-hidden rounded-md transition-transform hover:scale-105"
          >
            <CoverImage
              src={g.coverUrl}
              title={g.title}
              className="aspect-[460/215] w-full"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
