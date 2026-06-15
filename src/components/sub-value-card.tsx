"use client";

import Link from "next/link";
import type { SubscriptionId } from "@/lib/subscriptions";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { GAMES } from "@/data/games";
import { subscriptionValue } from "@/lib/sub-value";
import { formatTRY } from "@/lib/format";
import { CoverImage } from "@/components/cover-image";
import { SubLogo } from "@/components/store-logo";
import { useApp } from "@/components/providers";

export function SubValueCard({ id }: { id: SubscriptionId }) {
  const { t, locale, priceLoaded } = useApp();
  const sub = SUBSCRIPTIONS[id];
  const v = subscriptionValue(id, GAMES);
  const preview = v.games.slice(0, 8);

  return (
    <div className="panel-strong overflow-hidden rounded-2xl">
      {/* Başlık bandı: abonelik adı net + marka rengi */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ background: `linear-gradient(90deg, ${sub.accent}22, transparent)` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${sub.accent}1f` }}
          >
            <SubLogo id={id} size={24} />
          </span>
          <div>
            <a
              href={sub.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-display text-lg font-bold text-bright transition-opacity hover:opacity-80"
            >
              {sub.label} ↗
            </a>
            <p className="text-xs text-muted">
              {v.count} {t.gamesWord} ·{" "}
              {priceLoaded ? formatTRY(v.totalTRY, locale) : "—"} {t.valueWorth}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-bright">
            {formatTRY(v.monthlyTRY, locale)}
            <span className="text-xs font-normal text-muted">{t.perMonth}</span>
          </p>
          {sub.yearlyTRY != null && (
            <p className="text-xs text-muted">
              {formatTRY(sub.yearlyTRY, locale)}
              <span className="text-[10px]"> /{locale === "tr" ? "yıl" : "yr"}</span>
            </p>
          )}
          <p className="text-xs font-bold" style={{ color: sub.accent }}>
            {priceLoaded ? `${Math.round(v.ratio)}×` : "—"} {t.valueWorth}
          </p>
        </div>
      </div>

      {/* Planlar / kademeler */}
      {sub.plans && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          {sub.plans.map((plan) => (
            <span
              key={plan.name}
              className="inline-flex items-baseline gap-1.5 rounded-full border border-border bg-(--row) px-3 py-1 text-xs"
            >
              <span className="font-bold text-bright">{plan.name}</span>
              <span className="font-semibold tabular-nums" style={{ color: sub.accent }}>
                {formatTRY(plan.monthlyTRY, locale)}
              </span>
              <span className="text-muted">· {plan.games}</span>
            </span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5 p-3 sm:grid-cols-8">
        {preview.map((g) => (
          <Link
            key={g.slug}
            href={`/oyun/${g.slug}`}
            title={g.title}
            className="overflow-hidden rounded-md transition-transform hover:scale-105"
          >
            <CoverImage src={g.coverUrl} title={g.title} className="aspect-[460/215] w-full" />
          </Link>
        ))}
      </div>
    </div>
  );
}
