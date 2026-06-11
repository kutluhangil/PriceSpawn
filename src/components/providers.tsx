"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { tr, en, type Locale, type Dict } from "@/i18n";

type Theme = "dark" | "light";

interface AppContext {
  theme: Theme;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
}

const Ctx = createContext<AppContext | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    // Sync once after hydration with the values the inline <head> script applied;
    // SSR must render deterministic defaults, so this can't be a lazy initializer.
    const t = (document.documentElement.dataset.theme as Theme) || "dark";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(t);
    const l = (localStorage.getItem("hdu-locale") as Locale) || "tr";
    setLocaleState(l);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("hdu-theme", next);
      return next;
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("hdu-locale", l);
    document.documentElement.lang = l;
  }, []);

  return (
    <Ctx.Provider
      value={{ theme, toggleTheme, locale, setLocale, t: locale === "tr" ? tr : en }}
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
