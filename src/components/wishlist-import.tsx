"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/components/providers";
import type { WishlistResolvePayload } from "@/app/api/steam-wishlist/route";

const LAST_KEY = "pricespawn-wishlist";

type Reason = WishlistResolvePayload["reason"];

function errorText(t: ReturnType<typeof useApp>["t"], reason?: Reason): string {
  switch (reason) {
    case "not_found":
      return t.wlErrNotFound;
    case "empty_or_private":
      return t.wlErrEmptyPrivate;
    default:
      return t.wlErrBadInput;
  }
}

export function WishlistImport({ heading = false }: { heading?: boolean }) {
  const { t } = useApp();
  const router = useRouter();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLast(localStorage.getItem(LAST_KEY));
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/steam-wishlist?input=${encodeURIComponent(value.trim())}`);
      const data = (await res.json()) as WishlistResolvePayload;
      if (!data.ok || !data.steamid) {
        setError(errorText(t, data.reason));
        return;
      }
      try {
        localStorage.setItem(LAST_KEY, data.steamid);
      } catch {
        /* ignore */
      }
      router.push(`/liste?id=${data.steamid}`);
    } catch {
      setError(errorText(t, "empty_or_private"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      {heading && <h2 className="mb-4 font-display text-2xl font-black text-bright">{t.wlEmptyTitle}</h2>}
      <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.wlImportPlaceholder}
          className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-4 py-2 text-sm text-bright placeholder:text-muted focus:border-accent focus:outline-none"
          aria-label={t.wlImportPlaceholder}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {busy ? "…" : t.wlImportButton}
        </button>
      </form>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{t.wlImportHint}</span>
        {last && (
          <Link href={`/liste?id=${last}`} className="font-semibold text-accent hover:text-bright">
            {t.wlBackToLast}
          </Link>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs font-semibold text-[#fb7185]">{error}</p>}
    </div>
  );
}

export function WishlistNotice({ reason }: { reason: NonNullable<Reason> }) {
  const { t } = useApp();
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="mb-6 text-sm text-muted">{errorText(t, reason)}</p>
      <WishlistImport heading />
    </div>
  );
}
