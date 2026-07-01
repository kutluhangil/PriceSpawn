"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/components/providers";

const CONSENT_KEY = "pricespawn-consent";

/** Lightweight KVKK/cookie consent bar. Shows once until a choice is stored. */
export function CookieConsent() {
  const { t } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    try {
      if (!localStorage.getItem(CONSENT_KEY)) {
        timer = window.setTimeout(() => setShow(true), 0);
      }
    } catch {
      /* storage blocked — stay hidden */
    }
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  function choose(value: "all" | "essential") {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label={t.cookieText}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl sm:bottom-4"
    >
      <div className="panel-strong flex flex-col gap-3 rounded-2xl p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        {/* Spektrum marka ipliği */}
        <span
          className="hidden h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-accent to-best sm:block"
          aria-hidden="true"
        />
        <p className="flex-1 text-xs leading-relaxed text-fg sm:text-sm">
          {t.cookieText}{" "}
          <Link href="/gizlilik" className="font-semibold text-accent underline-offset-2 hover:underline">
            {t.cookieMore}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose("essential")}
            className="rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-muted transition-colors hover:text-bright cursor-pointer"
          >
            {t.cookieReject}
          </button>
          <button
            onClick={() => choose("all")}
            className="rounded-full bg-accent-strong px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.03] cursor-pointer"
          >
            {t.cookieAccept}
          </button>
        </div>
      </div>
    </div>
  );
}
