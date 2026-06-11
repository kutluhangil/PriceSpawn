"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="mx-auto flex w-[min(100%-2rem,32rem)] flex-col items-center pt-24 text-center">
      <div className="glass flex flex-col items-center gap-4 rounded-3xl px-8 py-12">
        <p className="font-display text-5xl font-bold gradient-text">404</p>
        <h1 className="font-display text-lg font-bold">{t.notFoundTitle}</h1>
        <p className="text-sm text-muted">{t.notFoundBody}</p>
        <Link
          href="/"
          className="glass glass-hover mt-2 rounded-full px-5 py-2.5 text-sm font-semibold text-accent"
        >
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}
