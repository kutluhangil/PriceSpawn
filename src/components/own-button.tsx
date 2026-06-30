"use client";

import { useCollection } from "@/hooks/use-collection";
import { useApp } from "@/components/providers";

function LibraryIcon({ filled }: { filled: boolean }) {
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
      <path d="M4 4h4v16H4zM10 4h4v16h-4z" />
      <path d="m17 5 4 1-3 14-4-1z" />
    </svg>
  );
}

/** "I own it" toggle — adds a game to the user's local collection. */
export function OwnButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { t } = useApp();
  const { owned, toggle } = useCollection();
  const on = owned(slug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
  }

  if (compact) {
    return (
      <button
        onClick={onClick}
        aria-pressed={on}
        aria-label={on ? t.ownOwned : t.ownAdd}
        title={t.ownHint}
        className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur transition-colors ${
          on ? "bg-best text-black" : "bg-black/45 text-white/85 hover:text-white"
        }`}
      >
        <LibraryIcon filled={on} />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      title={t.ownHint}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        on ? "bg-best text-black" : "border border-border text-fg hover:text-bright"
      }`}
    >
      <LibraryIcon filled={on} />
      {on ? t.ownOwned : t.ownAdd}
    </button>
  );
}
