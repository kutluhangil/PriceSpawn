"use client";

import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { realAtl } from "@/lib/live";
import { useApp } from "@/components/providers";

/** Shown only when the current cheapest price is at/below the real all-time low. */
export function AtlBadge({ game, size = "sm" }: { game: Game; size?: "sm" | "md" }) {
  const { t } = useApp();
  const atl = realAtl(game.slug);
  const best = bestPrice(game);
  if (!atl || !best) return null;
  if (best.tryAmount > atl.amount * 1.02) return null; // not at the historic low

  const cls =
    size === "md" ? "px-2 py-1 text-xs gap-1" : "px-1.5 py-0.5 text-[10px] gap-0.5";
  return (
    <span
      className={`inline-flex items-center rounded font-extrabold ${cls}`}
      style={{ background: "var(--best)", color: "#06270f" }}
      title={t.allTimeLowFull}
    >
      🔥 {t.allTimeLow}
    </span>
  );
}
