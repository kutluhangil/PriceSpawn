"use client";

import { useState } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useApp } from "@/components/providers";

function BellIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function WatchButton({
  slug,
  compact = false,
}: {
  slug: string;
  compact?: boolean;
}) {
  const { t } = useApp();
  const { watched, toggle } = useWatchlist();
  const [toast, setToast] = useState(false);
  const on = watched(slug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!on) {
      setToast(true);
      setTimeout(() => setToast(false), 1600);
    }
    toggle(slug);
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        aria-pressed={on}
        aria-label={on ? t.watching : t.watch}
        className={`relative flex h-7 w-7 items-center justify-center rounded-full backdrop-blur transition-colors ${
          on ? "bg-accent text-white" : "bg-black/40 text-white/80 hover:text-white"
        }`}
      >
        <BellIcon filled={on} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        on ? "bg-accent text-white" : "border border-border text-fg hover:text-bright"
      }`}
    >
      <BellIcon filled={on} />
      {on ? t.watching : t.watch}
      {toast && (
        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-best px-2 py-1 text-xs font-bold text-black shadow-lg">
          {t.watchAdded}
        </span>
      )}
    </button>
  );
}
