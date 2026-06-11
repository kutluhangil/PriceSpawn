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
      ? "px-1.5 py-0.5 text-[10px] rounded-md"
      : "px-2.5 py-1 text-xs rounded-lg";
  return (
    <span className="flex flex-wrap gap-1">
      {ids.map((id) => {
        const sub = SUBSCRIPTIONS[id];
        return (
          <span
            key={id}
            title={sub.label}
            className={`${cls} font-semibold tracking-wide border`}
            style={{
              color: sub.accent,
              borderColor: `${sub.accent}55`,
              background: `${sub.accent}1a`,
            }}
          >
            {sub.label}
          </span>
        );
      })}
    </span>
  );
}
