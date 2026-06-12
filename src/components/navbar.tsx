"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { SITE_SHORT } from "@/lib/site";
import { SearchBar } from "@/components/search-bar";

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function Navbar() {
  const { theme, toggleTheme, locale, setLocale, t } = useApp();

  return (
    <header className="sticky top-0 z-50">
      {/* Üst bar — Steam'in #171a21 global nav'ı */}
      <div className="bg-bg-deep">
        <div className="mx-auto flex h-12 w-[min(100%-2rem,71rem)] items-center justify-between">
          <Link
            href="/"
            className="text-base font-extrabold uppercase tracking-[0.18em] text-bright"
          >
            price<span className="text-accent">spawn</span>
          </Link>

          <div className="flex items-center gap-1 text-[11px] font-bold uppercase">
            {(["tr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  locale === l ? "text-bright" : "text-muted hover:text-fg"
                }`}
              >
                {l}
              </button>
            ))}
            <button
              onClick={toggleTheme}
              aria-label={t.themeToggle}
              className="ml-2 flex h-7 w-7 items-center justify-center rounded text-muted transition-colors cursor-pointer hover:text-bright"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mağaza barı — gezinme + premium arama */}
      <div className="border-b border-border bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-11 w-[min(100%-2rem,71rem)] items-center justify-between gap-4">
          <nav className="flex items-center gap-1 text-[12px] font-semibold uppercase tracking-wide">
            <Link href="/" className="px-2 py-1.5 text-fg transition-colors hover:text-bright">
              {t.allGames}
            </Link>
            <Link href="/#offers" className="px-2 py-1.5 text-fg transition-colors hover:text-bright">
              {t.specialOffers}
            </Link>
          </nav>
          <div className="w-full max-w-[15rem] sm:max-w-xs">
            <SearchBar variant="nav" />
          </div>
        </div>
      </div>
    </header>
  );
}
