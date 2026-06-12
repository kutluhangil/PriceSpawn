"use client";

import type { Game } from "@/data/games";
import { isAllTimeLow } from "@/lib/history";
import { useApp } from "@/components/providers";

export function AtlBadge({ game, size = "sm" }: { game: Game; size?: "sm" | "md" }) {
  const { t } = useApp();
  if (!isAllTimeLow(game)) return null;
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
