"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="mx-auto flex w-[min(100%-2rem,30rem)] flex-col items-center pt-24 text-center">
      <div className="surface flex w-full flex-col items-center gap-3 rounded-xl px-8 py-12">
        <p className="font-display text-5xl font-extrabold text-accent">404</p>
        <h1 className="font-display text-lg font-extrabold">{t.notFoundTitle}</h1>
        <p className="text-sm text-muted">{t.notFoundBody}</p>
        <Link
          href="/"
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          {t.backHome}
        </Link>
      </div>
    </div>
  );
}
