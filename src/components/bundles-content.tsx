"use client";

import { useEffect, useState } from "react";
import type { BundleListPayload } from "@/app/api/bundles-list/route";
import type { ItadActiveBundle } from "@/lib/fetchers";
import { daysUntil } from "@/lib/sales";
import { useApp } from "@/components/providers";

/** Provider-branded theme for the designed cover band (no fake artwork). */
function providerTheme(page: string): { color: string } {
  const p = page.toLowerCase();
  if (p.includes("humble")) return { color: "#cc2929" };
  if (p.includes("fanatical")) return { color: "#ff5a00" };
  if (p.includes("greenman") || p.includes("green man")) return { color: "#16a34a" };
  if (p.includes("indiegala") || p.includes("indie gala")) return { color: "#7c3aed" };
  if (p.includes("gog")) return { color: "#a855f7" };
  if (p.includes("steam")) return { color: "#1b9cd8" };
  if (p.includes("groupees")) return { color: "#f59e0b" };
  if (p.includes("itch")) return { color: "#fa5c5c" };
  if (p.includes("dlgamer") || p.includes("gamersgate")) return { color: "#0ea5e9" };
  return { color: "var(--accent)" };
}

export function BundlesContent() {
  const { t, locale } = useApp();
  const [bundles, setBundles] = useState<ItadActiveBundle[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/bundles-list")
      .then((r) => r.json())
      .then((d: BundleListPayload) => {
        if (!cancelled) setBundles(d.bundles ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "short" });

  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">{t.bundlesPage}</h1>
      <p className="mb-5 max-w-2xl text-sm text-muted">{t.bundlesNote}</p>

      {/* Açıklama — aktif paket nedir? */}
      <div className="mb-7 flex gap-3 rounded-2xl border border-border bg-(--row) p-4 sm:p-5">
        <span
          aria-hidden="true"
          className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12v10H4V12" />
            <path d="M2 7h20v5H2z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </span>
        <div>
          <h2 className="font-display text-sm font-bold text-bright">{t.bundlesIntroTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{t.bundlesIntroBody}</p>
        </div>
      </div>

      {ready && bundles.length === 0 ? (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">{t.bundlesEmpty}</div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {bundles.map((b) => {
            const left = b.expiry ? daysUntil(b.expiry.slice(0, 10), now) : null;
            const soon = left !== null && left <= 3;
            const theme = providerTheme(b.page);
            const initial = (b.page || "?").trim().charAt(0).toUpperCase();
            return (
              <li key={b.id}>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ "--p": theme.color } as React.CSSProperties}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-deep transition-all hover:-translate-y-1 hover:border-(--p) hover:shadow-[0_16px_36px_-14px_var(--p)]"
                >
                  {/* Designed provider cover band */}
                  <div
                    className="relative flex h-24 items-end overflow-hidden p-4"
                    style={{
                      background:
                        "radial-gradient(110% 130% at 100% 0%, color-mix(in srgb, var(--p) 40%, transparent), transparent 60%), linear-gradient(150deg, color-mix(in srgb, var(--p) 28%, var(--bg-deep)), var(--bg-deep))",
                    }}
                  >
                    {/* big faded provider initial */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-2 -top-5 select-none font-display font-black leading-none opacity-15"
                      style={{ fontSize: 120, color: "var(--p)" }}
                    >
                      {initial}
                    </span>
                    <span
                      className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
                      style={{ background: "color-mix(in srgb, var(--p) 80%, black)" }}
                    >
                      {b.page}
                    </span>
                    {left !== null && (
                      <span
                        className="absolute right-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm"
                        style={{ color: soon ? "#fbbf24" : "#fff" }}
                      >
                        {left} {t.saleDaysLeft}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <p className="font-display text-base font-bold leading-snug text-bright group-hover:text-(--p)">
                      {b.title}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted">
                      <span>{b.games > 0 ? `${b.games} ${t.gamesWord}` : ""}</span>
                      <span className="font-semibold">
                        {b.expiry ? `${t.bundleEnds} ${fmt(b.expiry)}` : t.bundleOngoing} ↗
                      </span>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
