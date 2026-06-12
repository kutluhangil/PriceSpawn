"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers";
import { SearchBar } from "@/components/search-bar";
import { BrandMark } from "@/components/brand-mark";

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

function AutoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function openPalette() {
  window.dispatchEvent(new CustomEvent("open-palette"));
}

export function Navbar() {
  const { themePref, toggleTheme, locale, setLocale, t } = useApp();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const links = [
    { href: "/oyunlar", label: t.allGamesPage },
    { href: "/ucretsiz", label: t.freePage },
    { href: "/abonelikler", label: t.subsPage },
    { href: "/takip", label: t.watchPage },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-[min(100%-2rem,74rem)] items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="shrink-0">
            <BrandMark className="text-[15px] font-bold tracking-tight" />
          </Link>
          <div className="hidden items-center gap-4 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-[13px] font-semibold transition-colors ${
                  pathname === l.href ? "text-bright" : "text-muted hover:text-fg"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {!isHome && (
          <button
            onClick={openPalette}
            className="hidden max-w-xs flex-1 items-center gap-2 rounded-full border border-border bg-bg-deep px-3.5 py-1.5 text-xs text-muted transition-colors hover:text-fg sm:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            {t.searchPlaceholder}
            <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px]">⌘K</kbd>
          </button>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {(["tr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              aria-pressed={locale === l}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                locale === l ? "bg-accent/20 text-bright" : "text-muted hover:text-fg"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={toggleTheme}
            aria-label={t.themeToggle}
            title={themePref === "system" ? t.themeSystem : themePref}
            className="ml-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted transition-colors cursor-pointer hover:text-bright"
          >
            {themePref === "dark" ? <MoonIcon /> : themePref === "light" ? <SunIcon /> : <AutoIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}
