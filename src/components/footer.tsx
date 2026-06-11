"use client";

import { useApp } from "@/components/providers";
import { SITE_NAME } from "@/lib/site";

export function Footer() {
  const { t } = useApp();
  return (
    <footer className="mx-auto mt-16 w-[min(100%-2rem,72rem)] pb-8">
      <div className="glass flex flex-col items-center gap-1.5 rounded-2xl px-6 py-5 text-center">
        <p className="font-display text-xs font-semibold tracking-wide">
          <span className="gradient-text">{SITE_NAME}</span>
        </p>
        <p className="text-xs text-muted">{t.footerNote}</p>
        <p className="text-[11px] text-muted/80">{t.demoRateNote}</p>
      </div>
    </footer>
  );
}
