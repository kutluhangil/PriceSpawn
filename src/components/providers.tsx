"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { tr, en, type Locale, type Dict } from "@/i18n";

type Theme = "dark" | "light";
type ThemePref = "dark" | "light" | "system";

const THEME_KEY = "pricespawn-theme";
const LEGACY_THEME_KEY = "hdu-theme";
const LOCALE_KEY = "hdu-locale";

interface AppContext {
  theme: Theme; // resolved effective theme
  themePref: ThemePref;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const Ctx = createContext<AppContext | null>(null);

function resolve(pref: ThemePref): Theme {
  if (pref === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return pref;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [themePref, setThemePref] = useState<ThemePref>("dark");
  const [theme, setTheme] = useState<Theme>("dark");
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    const stored =
      (localStorage.getItem(THEME_KEY) as ThemePref | null) ??
      (localStorage.getItem(LEGACY_THEME_KEY) as ThemePref | null) ??
      "system";
    setThemePref(stored);
    setTheme(resolve(stored));
    const l = (localStorage.getItem(LOCALE_KEY) as Locale) || "tr";
    setLocaleState(l);
  }, []);

  // Follow OS changes while in "system" mode.
  useEffect(() => {
    if (themePref !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => {
      const next = resolve("system");
      setTheme(next);
      document.documentElement.dataset.theme = next;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themePref]);

  const toggleTheme = useCallback(() => {
    setThemePref((prev) => {
      const order: ThemePref[] = ["dark", "light", "system"];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      localStorage.setItem(THEME_KEY, next);
      const eff = resolve(next);
      setTheme(eff);
      document.documentElement.dataset.theme = eff;
      return next;
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(LOCALE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  return (
    <Ctx.Provider
      value={{
        theme,
        themePref,
        toggleTheme,
        locale,
        setLocale,
        t: locale === "tr" ? tr : en,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside Providers");
  return ctx;
}
