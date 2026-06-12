"use client";

import { useApp } from "@/components/providers";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex w-[min(100%-2rem,74rem)] flex-col items-center gap-1 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-display text-xs font-bold text-bright">
          price<span className="spectrum-text font-extrabold">spawn</span>
        </p>
        <p className="text-xs text-muted">
          {t.footerNote} · {t.demoRateNote}
        </p>
      </div>
    </footer>
  );
}
