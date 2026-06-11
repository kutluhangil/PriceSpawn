"use client";

import { useApp } from "@/components/providers";
import { SITE_SHORT } from "@/lib/site";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex w-[min(100%-2rem,76rem)] flex-col items-center gap-1 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-display text-xs font-extrabold">
          {SITE_SHORT}
          <span className="text-accent">.com</span>
        </p>
        <p className="text-xs text-muted">
          {t.footerNote} · {t.demoRateNote}
        </p>
      </div>
    </footer>
  );
}
