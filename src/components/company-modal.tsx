"use client";

import { useEffect } from "react";
import type { Company } from "@/data/companies";
import { CompanyLogo } from "@/components/company-logo";
import { useApp } from "@/components/providers";

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-(--row) px-3.5 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-bright" style={value === "—" ? { color: "var(--muted)" } : undefined}>
        {value}
      </div>
      <span className="sr-only">{accent}</span>
    </div>
  );
}

/** Company detail modal: history, leadership, scale, platforms and key games. */
export function CompanyModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const { t } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const dash = "—";
  const stats: { label: string; value: string }[] = [
    { label: t.companyFounded, value: String(company.founded) },
    { label: t.companyHQ, value: company.hq || dash },
    { label: t.companyCEO, value: company.ceo ?? dash },
    { label: t.companyEmployees, value: company.employees ?? dash },
    { label: t.companyMarketCap, value: company.marketCap ?? dash },
    { label: t.companyParent, value: company.parent ?? t.companyIndependent },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={company.name}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="reveal relative w-full max-w-2xl overflow-hidden rounded-t-3xl border border-border bg-bg-deep shadow-2xl sm:rounded-3xl"
      >
        {/* Branded banner */}
        <div
          className="relative flex items-center gap-4 px-6 pb-5 pt-7 sm:px-7"
          style={{
            background: `radial-gradient(120% 140% at 0% 0%, ${company.accent}40, transparent 60%), linear-gradient(160deg, ${company.accent}22, transparent)`,
          }}
        >
          <span
            className="grid shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/25 p-3 text-white shadow-lg backdrop-blur-sm"
            style={{ color: company.logo ? "#fff" : company.accent }}
          >
            <CompanyLogo company={company} size={46} />
          </span>
          <div className="min-w-0">
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${company.accent}33`, color: company.accent }}
            >
              {company.category}
            </span>
            <h2 className="font-display mt-1 truncate text-xl font-bold text-bright sm:text-2xl">{company.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t.missingClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/80 transition-colors hover:bg-black/50 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-6 pb-7 pt-5 sm:px-7">
          {/* History */}
          <p className="text-sm leading-relaxed text-fg">{company.blurb}</p>

          {/* Founders */}
          <div className="mt-4 rounded-xl border border-border bg-(--row) px-3.5 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{t.companyFounders}</div>
            <div className="mt-0.5 text-sm font-semibold text-bright">{company.founders}</div>
          </div>

          {/* Stat grid */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {stats.map((s) => (
              <Stat key={s.label} label={s.label} value={s.value} accent={company.accent} />
            ))}
          </div>

          {/* Platforms */}
          <div className="mt-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{t.companyPlatforms}</div>
            <div className="flex flex-wrap gap-1.5">
              {company.platforms.map((p) => (
                <span key={p} className="rounded-full border border-border bg-(--row) px-2.5 py-1 text-xs font-medium text-fg">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Notable games */}
          <div className="mt-5">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{t.companyGames}</div>
            <div className="flex flex-wrap gap-1.5">
              {company.games.map((g) => (
                <span
                  key={g}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: `${company.accent}1f`, color: company.accent }}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Official site */}
          <a
            href={company.site}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
            style={{ background: company.accent }}
          >
            {t.companySite} ↗
          </a>

          <p className="mt-4 text-[11px] leading-relaxed text-muted">{t.companyDisclaimer}</p>
        </div>
      </div>
    </div>
  );
}
