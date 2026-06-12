"use client";

import { useApp } from "@/components/providers";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t border-border bg-bg-deep">
      <div className="mx-auto flex w-[min(100%-2rem,71rem)] flex-col items-center gap-1 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-bright">
          price<span className="text-accent">spawn</span>
        </p>
        <p className="text-xs text-muted">
          {t.footerNote} · {t.demoRateNote}
        </p>
      </div>
    </footer>
  );
}
