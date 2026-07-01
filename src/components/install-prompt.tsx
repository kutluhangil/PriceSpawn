"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { useApp } from "@/components/providers";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pricespawn-install-dismissed";

/** Custom PWA install card, shown when the browser offers installation. */
export function InstallPrompt() {
  const { t } = useApp();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDeferred(null);
  }

  if (!deferred) return null;

  return (
    <div className="fixed bottom-20 right-3 z-50 w-[min(20rem,calc(100vw-1.5rem))] sm:bottom-4">
      <div className="panel-strong flex flex-col gap-3 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <BrandMark className="text-base font-bold" />
          <button
            onClick={dismiss}
            aria-label={t.installDismiss}
            className="text-muted transition-colors hover:text-bright cursor-pointer"
          >
            ✕
          </button>
        </div>
        <p className="text-sm font-semibold text-bright">{t.installApp}</p>
        <p className="text-xs text-muted">{t.installHint}</p>
        <div className="flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-bright cursor-pointer"
          >
            {t.installDismiss}
          </button>
          <button
            onClick={install}
            className="flex-1 rounded-full bg-accent-strong px-3 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.03] cursor-pointer"
          >
            {t.installApp}
          </button>
        </div>
      </div>
    </div>
  );
}
