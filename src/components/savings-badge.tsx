"use client";

import type { ResolvedPrice } from "@/lib/price";

/** "%X tasarruf" chip — shown when the cheapest price is discounted. */
export function SavingsBadge({ rp, className = "" }: { rp: ResolvedPrice; className?: string }) {
  if (rp.tryOriginal === undefined || rp.tryOriginal <= rp.tryAmount) return null;
  const pct = Math.round((1 - rp.tryAmount / rp.tryOriginal) * 100);
  if (pct <= 0) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${className}`}
      style={{ background: "linear-gradient(135deg, #16a34a, #65a30d)", color: "#fff" }}
    >
      %{pct} tasarruf
    </span>
  );
}
