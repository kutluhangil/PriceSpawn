"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers";
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
    <header className="sticky top-0 z-50 border-b border-border bg-bg/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-[min(100%-2rem,74rem)] items-center justify-between gap-4">
        <Link href="/" className="font-display shrink-0 text-[15px] font-bold tracking-tight text-bright">
          price<span className="spectrum-text font-extrabold">spawn</span>
        </Link>

        {!isHome && (
          <div className="hidden max-w-xs flex-1 sm:block">
            <SearchBar variant="nav" />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {(["tr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                locale === l
                  ? "bg-accent/20 text-bright"
                  : "text-muted hover:text-fg"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={toggleTheme}
            aria-label={t.themeToggle}
            className="ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors cursor-pointer hover:text-bright"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}
