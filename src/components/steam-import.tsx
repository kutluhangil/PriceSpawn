"use client";

import { useState } from "react";
import type { SteamWishlistPayload } from "@/app/api/steam-wishlist/route";
import { useApp } from "@/components/providers";

/** Import a public Steam wishlist into the local watchlist (keyless). */
export function SteamImport({ addMany }: { addMany: (slugs: string[]) => number }) {
  const { t } = useApp();
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function run() {
    if (!input.trim()) return;
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch(`/api/steam-wishlist?input=${encodeURIComponent(input.trim())}`);
      const d: SteamWishlistPayload = await res.json();
      if (!d.ok) {
        setMsg({
          ok: false,
          text: d.reason === "empty_or_private" ? t.steamImportPrivate : t.steamImportNotFound,
        });
      } else {
        const added = addMany(d.matched.map((m) => m.slug));
        setMsg(
          added > 0
            ? {
                ok: true,
                text: `${added} ${t.steamImportAddedSuffix} · ${d.matched.length}/${d.total} ${t.steamImportInCatalog}`,
              }
            : { ok: true, text: t.steamImportNoneNew },
        );
      }
    } catch {
      setMsg({ ok: false, text: t.steamImportNotFound });
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="panel rounded-2xl p-4">
      <p className="text-sm font-bold text-bright">🎮 {t.steamImportTitle}</p>
      <p className="mt-0.5 text-xs text-muted">{t.steamImportHint}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="mt-3 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.steamImportPlaceholder}
          className="flex-1 rounded-full border border-border bg-bg-deep px-4 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-60 cursor-pointer"
        >
          {status === "loading" ? t.steamImportSaving : t.steamImportBtn}
        </button>
      </form>
      {msg && (
        <p className={`mt-2 text-xs font-semibold ${msg.ok ? "text-best" : "text-[#fb7185]"}`}>{msg.text}</p>
      )}
    </div>
  );
}
