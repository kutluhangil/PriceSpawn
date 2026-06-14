"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { usePush } from "@/hooks/use-push";
import { useEmailAlerts } from "@/hooks/use-email-alerts";
import { useApp } from "@/components/providers";
import { GAMES } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { targetMet } from "@/lib/watchlist";
import { STORES } from "@/lib/stores";
import { CoverImage } from "@/components/cover-image";
import { PriceTag } from "@/components/price-tag";
import { StoreLogo } from "@/components/store-logo";
import { StorageNotice } from "@/components/storage-notice";

export function WatchContent() {
  const { t, locale, priceLoaded } = useApp();
  const { list, ready, setTargetFor, toggle } = useWatchlist();
  const { enabled, supported, enable, disable } = usePush(list);
  const { email, status, save } = useEmailAlerts(list);
  const [notice, setNotice] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (email) setEmailInput(email);
  }, [email]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("email");
    if (p === "verified") setFlash(t.emailVerified);
    else if (p === "unsubscribed") setFlash(t.emailUnsubscribed);
  }, [t]);

  const onToggleNotify = async () => {
    if (enabled) {
      await disable();
      return;
    }
    setNotice(true);
    await enable();
  };

  const rows = list
    .map((w) => ({ w, game: GAMES.find((g) => g.slug === w.slug) }))
    .filter((r): r is { w: typeof r.w; game: NonNullable<typeof r.game> } => !!r.game);

  return (
    <div className="mx-auto w-[min(100%-2rem,52rem)] pt-8">
      <h1 className="font-display mb-6 text-2xl font-bold text-bright sm:text-3xl">
        {t.watchPage}
      </h1>

      {flash && (
        <div className="mb-4 rounded-xl border border-best px-4 py-3 text-sm font-semibold text-best">
          {flash}
        </div>
      )}

      {ready && rows.length > 0 && (
        <div className="mb-5 flex flex-col gap-4">
          <button
            onClick={onToggleNotify}
            disabled={!supported}
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
              enabled ? "border-best text-best" : "border-border text-muted hover:text-bright"
            }`}
          >
            🔔 {!supported ? t.notifyUnsupported : enabled ? t.notifyOn : t.notifyEnable}
          </button>

          {/* E-posta alarmı */}
          <div className="panel rounded-2xl p-4">
            <p className="text-sm font-bold text-bright">✉️ {t.emailAlertTitle}</p>
            <p className="mt-0.5 text-xs text-muted">{t.emailAlertHint}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (emailInput.trim()) save(emailInput);
              }}
              className="mt-3 flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="flex-1 rounded-full border border-border bg-bg-deep px-4 py-2 text-sm text-fg outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={status === "saving"}
                className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-60 cursor-pointer"
              >
                {t.emailSave}
              </button>
            </form>
            {status === "saved" && <p className="mt-2 text-xs font-semibold text-best">{t.emailSaved}</p>}
            {status === "error" && <p className="mt-2 text-xs font-semibold text-[#fb7185]">{t.emailError}</p>}
          </div>
        </div>
      )}
      <StorageNotice show={notice} onClose={() => setNotice(false)} />

      {ready && rows.length === 0 && (
        <div className="panel-strong rounded-2xl px-6 py-12 text-center">
          <p className="text-sm text-muted">{t.emptyWatch}</p>
          <Link
            href="/oyunlar"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
          >
            {t.allGamesPage}
          </Link>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map(({ w, game }) => {
          const best = bestPrice(game);
          const met = best ? targetMet(w, game) : false;
          return (
            <li
              key={game.slug}
              className={`panel-strong flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center ${
                met ? "ring-2 ring-best" : ""
              }`}
            >
              <Link href={`/oyun/${game.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                <CoverImage
                  src={game.coverUrl}
                  title={game.title}
                  className="aspect-[460/215] w-28 shrink-0 rounded-lg"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-bright">
                    {game.title}
                  </span>
                  {best ? (
                    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <StoreLogo id={best.price.store} size={14} />
                      {STORES[best.price.store].label}
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-muted">
                      {priceLoaded ? t.noPriceFound : t.loadingPrice}
                    </span>
                  )}
                </span>
              </Link>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="flex flex-col items-end">
                  {met && (
                    <span className="mb-0.5 text-[11px] font-bold text-best">
                      🎯 {t.targetReached}
                    </span>
                  )}
                  {best ? (
                    <PriceTag rp={best} locale={locale} highlight={met} />
                  ) : !priceLoaded ? (
                    <span className="h-5 w-20 animate-pulse rounded bg-border" />
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </span>
                <label className="flex flex-col text-[10px] uppercase text-muted">
                  {t.targetPrice}
                  <input
                    type="number"
                    min={0}
                    defaultValue={w.targetTRY ?? ""}
                    onChange={(e) =>
                      setTargetFor(game.slug, e.target.value ? Number(e.target.value) : null)
                    }
                    className="mt-0.5 w-24 rounded-md border border-border bg-bg-deep px-2 py-1 text-sm text-fg outline-none focus:border-accent"
                  />
                </label>
                <button
                  onClick={() => toggle(game.slug)}
                  aria-label="remove"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:text-[#fb7185]"
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
