"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { GAMES } from "@/data/games";
import { STORES } from "@/lib/stores";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";
import { BrandMark } from "@/components/brand-mark";

export function Footer() {
  const { t } = useApp();
  const storeCount = Object.keys(STORES).length;
  const subCount = Object.keys(SUBSCRIPTIONS).length;

  return (
    <footer className="mt-20 border-t border-border bg-bg-deep">
      <div className="mx-auto grid w-[min(100%-2rem,74rem)] gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Marka */}
        <div className="flex flex-col gap-3">
          <BrandMark className="text-lg font-bold" />
          <p className="max-w-xs text-sm leading-relaxed text-muted">{t.footerTagline}</p>
          <p className="text-xs font-semibold text-fg">
            <span className="text-best">{GAMES.length}</span> {t.gamesWord} ·{" "}
            <span className="text-accent">{storeCount}</span> {t.storesCount} ·{" "}
            <span className="text-accent">{subCount}</span> {t.subsWord}
          </p>
        </div>

        {/* Mağazalar */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-bright">
            {t.footerStores}
          </h3>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted">
            {Object.values(STORES).map((store) => (
              <li key={store.id} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: store.accent }}
                  aria-hidden="true"
                />
                {store.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Abonelikler */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-bright">
            {t.footerSubs}
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-muted">
            {Object.values(SUBSCRIPTIONS).map((sub) => (
              <li key={sub.id} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: sub.accent }}
                  aria-hidden="true"
                />
                {sub.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Keşfet */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-bright">
            {t.footerSite}
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <Link href="/" className="text-muted transition-colors hover:text-bright">
                {t.footerHome}
              </Link>
            </li>
            <li>
              <Link href="/#deals" className="text-muted transition-colors hover:text-bright">
                {t.todaysDeals}
              </Link>
            </li>
            <li>
              <Link href="/#new" className="text-muted transition-colors hover:text-bright">
                {t.tabNew}
              </Link>
            </li>
            <li>
              <Link href="/#popular" className="text-muted transition-colors hover:text-bright">
                {t.popularGames}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-[min(100%-2rem,74rem)] flex-col items-center gap-1 py-5 text-center text-xs text-muted sm:flex-row sm:justify-between sm:text-left">
          <p>© 2026 pricespawn</p>
          <p>
            {t.footerNote} · {t.demoRateNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
