"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { GAMES } from "@/data/games";
import { STORES } from "@/lib/stores";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { currentRate } from "@/lib/exchange";
import { BrandMark } from "@/components/brand-mark";

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-bright">
      <span className="h-3 w-[3px] rounded-full bg-gradient-to-b from-accent to-best" aria-hidden="true" />
      {children}
    </h3>
  );
}

const linkClass =
  "inline-flex items-center gap-2 text-muted transition-all hover:translate-x-0.5 hover:text-bright";

export function Footer() {
  const { t, liveUpdatedAt } = useApp();
  const storeCount = Object.keys(STORES).length;
  const subCount = Object.keys(SUBSCRIPTIONS).length;
  const rateText = `$1 ≈ ₺${currentRate().toLocaleString("tr-TR", { maximumFractionDigits: 2 })}`;
  const note = liveUpdatedAt ? `${t.liveNote} · ${rateText}` : `${t.footerNote} · ${t.demoRateNote}`;

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-border bg-bg-deep">
      {/* Spektrum marka ipliği */}
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-60"
        aria-hidden="true"
      />

      <div className="mx-auto grid w-[min(100%-2rem,74rem)] gap-x-8 gap-y-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        {/* Marka */}
        <div className="flex flex-col gap-4">
          <BrandMark className="text-xl font-bold" />
          <p className="max-w-xs text-sm leading-relaxed text-muted">{t.footerTagline}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            <span className="rounded-full border border-border bg-(--row) px-3 py-1 text-xs font-semibold text-fg">
              <span className="text-best">{GAMES.length}</span> {t.gamesWord}
            </span>
            <span className="rounded-full border border-border bg-(--row) px-3 py-1 text-xs font-semibold text-fg">
              <span className="text-accent">{storeCount}</span> {t.storesCount}
            </span>
            <span className="rounded-full border border-border bg-(--row) px-3 py-1 text-xs font-semibold text-fg">
              <span className="text-accent">{subCount}</span> {t.subsWord}
            </span>
          </div>
        </div>

        {/* Mağazalar */}
        <div>
          <ColHeading>{t.footerStores}</ColHeading>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm sm:grid-cols-1">
            {Object.values(STORES).map((store) => (
              <li key={store.id}>
                <a href={store.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: store.accent }}
                    aria-hidden="true"
                  />
                  {store.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Abonelikler */}
        <div>
          <ColHeading>{t.footerSubs}</ColHeading>
          <ul className="flex flex-col gap-2.5 text-sm">
            {Object.values(SUBSCRIPTIONS).map((sub) => (
              <li key={sub.id}>
                <a href={sub.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: sub.accent }}
                    aria-hidden="true"
                  />
                  {sub.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Keşfet */}
        <div>
          <ColHeading>{t.footerSite}</ColHeading>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/" className={linkClass}>
                {t.footerHome}
              </Link>
            </li>
            <li>
              <Link href="/#deals" className={linkClass}>
                {t.todaysDeals}
              </Link>
            </li>
            <li>
              <Link href="/#new" className={linkClass}>
                {t.tabNew}
              </Link>
            </li>
            <li>
              <Link href="/#popular" className={linkClass}>
                {t.popularGames}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <nav className="mx-auto flex w-[min(100%-2rem,74rem)] flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-5 text-xs font-medium sm:justify-start">
          <Link href="/hakkinda" className="text-muted transition-colors hover:text-bright">
            {t.footerAbout}
          </Link>
          <Link href="/gizlilik" className="text-muted transition-colors hover:text-bright">
            {t.footerPrivacy}
          </Link>
          <Link href="/kullanim-sartlari" className="text-muted transition-colors hover:text-bright">
            {t.footerTerms}
          </Link>
        </nav>
        <div className="mx-auto flex w-[min(100%-2rem,74rem)] flex-col items-center gap-2 py-5 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
          <p className="inline-flex items-center gap-2">
            <span>© 2026 pricespawn</span>
            {liveUpdatedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-(--best-soft) px-2 py-0.5 font-semibold text-best">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-best opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-best" />
                </span>
                {t.liveBadge}
              </span>
            )}
          </p>
          <p>{note}</p>
        </div>
      </div>
    </footer>
  );
}
