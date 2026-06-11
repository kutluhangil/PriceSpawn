"use client";

import type { SubscriptionId } from "@/lib/subscriptions";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";

export function SubBadges({
  ids,
  size = "sm",
}: {
  ids: SubscriptionId[];
  size?: "sm" | "md";
}) {
  if (ids.length === 0) return null;
  const cls =
    size === "sm"
      ? "px-1.5 py-px text-[10px] rounded"
      : "px-2 py-0.5 text-xs rounded-md";
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => {
        const sub = SUBSCRIPTIONS[id];
        return (
          <span
            key={id}
            title={sub.label}
            className={`${cls} font-bold tracking-wide`}
            style={{
              color: sub.accent,
              background: `${sub.accent}1f`,
            }}
          >
            {sub.label}
          </span>
        );
      })}
    </span>
  );
}
