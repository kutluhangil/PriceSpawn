"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/85 backdrop-blur-md">
      <nav className="mx-auto flex h-14 w-[min(100%-2rem,76rem)] items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display shrink-0 text-[15px] font-extrabold tracking-tight"
        >
          {SITE_SHORT}
          <span className="text-accent">.com</span>
        </Link>

        {!isHome && (
          <div className="hidden max-w-xs flex-1 sm:block">
            <SearchBar variant="nav" />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <div className="surface-flat flex overflow-hidden rounded-md text-[11px] font-bold">
            {(["tr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={`px-2.5 py-1.5 uppercase transition-colors cursor-pointer ${
                  locale === l
                    ? "bg-accent text-white"
                    : "text-muted hover:text-fg"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            aria-label={t.themeToggle}
            className="surface-flat flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors cursor-pointer hover:text-fg"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}
