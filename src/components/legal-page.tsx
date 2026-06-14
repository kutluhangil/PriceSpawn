"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";

/** Shared shell for static legal/info pages: back link, title, updated date, prose. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const { t } = useApp();
  return (
    <article className="reveal mx-auto w-[min(100%-2rem,48rem)] py-12 sm:py-16">
      <Link href="/" className="text-sm font-semibold text-accent transition-colors hover:text-bright">
        ← {t.legalBack}
      </Link>
      <h1 className="font-display mt-5 text-3xl font-bold leading-tight text-bright sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-xs text-muted">
        {t.legalUpdated}: {updated}
      </p>
      <div className="legal-prose mt-8">{children}</div>
    </article>
  );
}
