"use client";

import Link from "next/link";

// Common TR genres present across the catalog → quick browse shortcuts.
const GENRES = ["Aksiyon", "RPG", "Açık Dünya", "Macera", "Strateji", "Yarış", "FPS", "Bağımsız Yapımcı"];

/** Genre quick-chips for fast discovery into /oyunlar?g=. */
export function GenreChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {GENRES.map((g) => (
        <Link
          key={g}
          href={`/oyunlar?g=${encodeURIComponent(g)}`}
          className="rounded-full border border-border bg-(--row) px-3.5 py-1.5 text-xs font-semibold text-muted transition-all hover:-translate-y-0.5 hover:border-accent hover:text-bright"
        >
          {g}
        </Link>
      ))}
    </div>
  );
}
