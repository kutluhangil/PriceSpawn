"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { SITE_SHORT } from "@/lib/site";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function Navbar() {
  const { theme, toggleTheme, locale, setLocale, t } = useApp();

  return (
    <header className="sticky top-4 z-50 mx-auto w-[min(100%-2rem,72rem)]">
      <nav className="glass flex items-center justify-between rounded-2xl px-4 py-2.5 sm:px-6">
        <Link href="/" className="font-display text-sm sm:text-base font-bold tracking-tight">
          <span className="gradient-text">{SITE_SHORT}</span>
          <span className="text-muted">.com</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="glass flex overflow-hidden rounded-full text-xs font-semibold">
            {(["tr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-3 py-1.5 uppercase transition-colors cursor-pointer ${
                  locale === l ? "bg-accent/25 text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            aria-label={t.themeToggle}
            className="glass glass-hover flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-fg cursor-pointer"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}
