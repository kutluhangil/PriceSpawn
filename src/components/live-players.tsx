"use client";

import { useEffect, useState } from "react";
import type { PlayersPayload } from "@/app/api/players/route";
import { useApp } from "@/components/providers";

/** Live Steam concurrent-player count — social proof pill on the detail page. */
export function LivePlayers({ appid }: { appid: string }) {
  const { t, locale } = useApp();
  const [players, setPlayers] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!/^\d+$/.test(appid)) return;
    fetch(`/api/players?appid=${appid}`)
      .then((r) => r.json())
      .then((d: PlayersPayload) => {
        if (!cancelled) setPlayers(d.players);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [appid]);

  // Hide unless there's a meaningful live audience (avoids "3 playing" noise).
  if (players === null || players < 50) return null;
  const fmt = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(players);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-best opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-best" />
      </span>
      <span className="font-bold text-bright tabular-nums">{fmt}</span>
      <span className="text-muted">{t.playingNow}</span>
    </span>
  );
}
