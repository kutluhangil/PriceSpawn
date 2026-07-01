"use client";

import Link from "next/link";
import type { FreeOffer, FreePlatform } from "@/data/free";
import { formatTRY } from "@/lib/format";
import { endingSoon } from "@/lib/free-urgency";
import { CoverImage } from "@/components/cover-image";
import { FreeCountdown } from "@/components/free-countdown";
import { useApp } from "@/components/providers";

const PLATFORM_LABEL: Record<FreePlatform, string> = {
  epic: "Epic Games",
  psplus: "PS Plus",
  prime: "Prime Gaming",
  gog: "GOG",
};

const PLATFORM_COLOR: Record<FreePlatform, string> = {
  epic: "#a8a8b8",
  psplus: "#2e8cff",
  prime: "#00a8e1",
  gog: "#c44ccc",
};

export function FreeCard({ offer }: { offer: FreeOffer }) {
  const { t, locale } = useApp();
  const soon = endingSoon(offer, new Date());

  const inner = (
    <div className="panel-strong group block h-full overflow-hidden rounded-[var(--radius-card)] transition-all duration-300 hover:-translate-y-1 hover:border-accent/40">
      <div className="relative aspect-[460/215] overflow-hidden">
        <CoverImage
          src={offer.coverUrl}
          title={offer.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-[1.05]"
        />
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
          style={{ background: PLATFORM_COLOR[offer.platform] }}
        >
          {PLATFORM_LABEL[offer.platform]}
        </span>
        {soon && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-black">
            ⏰ {t.freeLastChance}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-bright">{offer.title}</h3>
          <p className={`text-[11px] ${soon ? "font-semibold text-amber-500" : "text-muted"}`}>
            {t.freeUntilLabel} <FreeCountdown until={offer.freeUntil} />
          </p>
        </div>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-[11px] text-muted line-through">
            {formatTRY(offer.normalTRY, locale)}
          </span>
          <span className="text-sm font-extrabold text-best">{t.freeNow}</span>
        </span>
      </div>
    </div>
  );

  if (offer.url) {
    return (
      <a href={offer.url} target="_blank" rel="noopener noreferrer" aria-label={offer.title}>
        {inner}
      </a>
    );
  }
  return offer.slug ? (
    <Link href={`/oyun/${offer.slug}`} aria-label={offer.title}>
      {inner}
    </Link>
  ) : (
    inner
  );
}
