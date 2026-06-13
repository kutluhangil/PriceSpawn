"use client";

import { useApp } from "@/components/providers";

export function GameAbout({
  description,
  tags,
  ready,
}: {
  description: string;
  tags: string[];
  ready: boolean;
}) {
  const { t } = useApp();
  if (!ready) {
    return (
      <section className="mt-8">
        <div className="animate-shimmer h-20 rounded-[var(--radius-card)]" />
      </section>
    );
  }
  if (!description && tags.length === 0) return null;

  return (
    <section className="reveal mt-8">
      <h2 className="font-display mb-3 text-lg font-bold text-bright">{t.aboutGame}</h2>
      {description && <p className="max-w-3xl text-sm leading-relaxed text-fg">{description}</p>}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-[3px] bg-(--row-hover) px-2 py-0.5 text-[11px] font-medium text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
