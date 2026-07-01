"use client";

import { useState } from "react";
import type { OwnedImportPayload } from "@/app/api/steam-owned/route";
import { useCollection } from "@/hooks/use-collection";
import { useApp } from "@/components/providers";

export function SteamOwnedImport() {
  const { t, locale } = useApp();
  const { addMany } = useCollection();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const ref = input.trim();
    if (!ref || loading) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/steam-owned?input=${encodeURIComponent(ref)}`);
      const data = (await res.json()) as OwnedImportPayload;
      if (data.ok && data.slugs) {
        const added = addMany(data.slugs);
        const matched = data.slugs.length;
        setMsg({
          kind: "ok",
          text:
            locale === "tr"
              ? `${data.total} oyun bulundu · ${matched} tanesi katalogda · ${added} yeni eklendi`
              : `${data.total} games found · ${matched} in catalog · ${added} newly added`,
        });
      } else {
        const reasonText: Record<string, string> = {
          not_found: t.ownImportNotFound,
          empty_or_private: t.ownImportPrivate,
          no_key: t.ownImportNoKey,
          bad_input: t.ownImportNotFound,
        };
        setMsg({ kind: "err", text: reasonText[data.reason ?? ""] ?? t.ownImportError });
      }
    } catch {
      setMsg({ kind: "err", text: t.ownImportError });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-border bg-(--panel) p-4">
      <p className="text-sm font-bold text-bright">📥 {t.ownImportTitle}</p>
      <p className="mt-1 mb-3 text-xs text-muted">{t.ownImportHint}</p>
      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.ownImportPlaceholder}
          autoComplete="off"
          className="min-h-11 flex-1 rounded-xl border border-border bg-bg-deep px-3 text-sm text-fg outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="min-h-11 shrink-0 rounded-xl bg-accent px-5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
        >
          {loading ? t.ownImportLoading : t.ownImportBtn}
        </button>
      </form>
      {msg && (
        <p className={`mt-2.5 text-xs font-semibold ${msg.kind === "ok" ? "text-best" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
