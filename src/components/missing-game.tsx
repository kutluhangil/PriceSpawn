"use client";

import { useState } from "react";
import { FEEDBACK_EMAIL } from "@/lib/site";
import { useApp } from "@/components/providers";

/** "Aradığını bulamadın mı?" CTA + rainbow feedback modal that opens a prefilled mail. */
export function MissingGame({ query }: { query: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const mailto = () => {
    const subject = `PriceSpawn — Eksik oyun: ${query}`;
    const body = `Aradığım oyun: ${query}\n\n${note ? `Not: ${note}\n\n` : ""}— PriceSpawn kullanıcısı`;
    return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-accent transition-colors hover:bg-(--row-hover)"
      >
        {t.missingCta} →
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="aurora w-full max-w-md rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-2xl bg-bg-deep p-6">
              <h3 className="font-display text-lg font-bold text-bright">{t.missingTitle}</h3>
              <p className="mt-1 text-sm text-muted">{t.missingDesc}</p>

              <div className="mt-4 rounded-xl border border-border bg-(--row) px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">{t.missingSearched}</p>
                <p className="font-display text-base font-bold text-bright">“{query}”</p>
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.missingNote}
                rows={3}
                className="mt-3 w-full resize-none rounded-xl border border-border bg-(--row) px-3 py-2 text-sm text-fg outline-none focus:border-accent"
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-fg"
                >
                  {t.missingClose}
                </button>
                <a
                  href={mailto()}
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
                >
                  {t.missingSend}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
