"use client";

import { useMemo, useState } from "react";
import { COMPANIES, COMPANY_CATEGORIES, type Company, type CompanyCategory } from "@/data/companies";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyModal } from "@/components/company-modal";
import { useApp } from "@/components/providers";

/** Apple-TV-style company tile — real logo on a clean chip, brand-accent stage. */
function CompanyTile({ company, onOpen }: { company: Company; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ "--c": company.accent } as React.CSSProperties}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-deep p-2.5 text-left transition-all duration-300 will-change-transform hover:-translate-y-1.5 hover:border-(--c) hover:shadow-[0_18px_40px_-12px_var(--c)] focus:outline-none focus-visible:border-(--c)"
    >
      {/* logo well — light surface so any real logo stays legible */}
      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-white to-[#e9ebef] p-5">
        {/* faint brand wash at top for identity */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--c) 22%, transparent), transparent 70%)" }}
        />
        <CompanyLogo company={company} className="relative max-h-12 text-base transition-transform duration-300 group-hover:scale-[1.06] sm:max-h-14" />
      </div>

      <div className="px-1.5 pb-1 pt-2.5">
        <div className="truncate font-display text-sm font-bold text-bright">{company.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
          <span className="font-semibold text-(--c)">{company.category}</span>
          <span>·</span>
          <span>{company.founded}</span>
        </div>
      </div>
    </button>
  );
}

export function ExplorerContent() {
  const { t } = useApp();
  const [filter, setFilter] = useState<CompanyCategory | "all">("all");
  const [active, setActive] = useState<Company | null>(null);

  const list = useMemo(
    () => (filter === "all" ? COMPANIES : COMPANIES.filter((c) => c.category === filter)),
    [filter],
  );

  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
      active ? "border-accent bg-accent text-white" : "border-border bg-(--row) text-muted hover:border-accent hover:text-bright"
    }`;

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">{t.explorerTitle}</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">{t.explorerNote}</p>

      {/* category filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={chip(filter === "all")}>
          {t.explorerAll} <span className="opacity-60">{COMPANIES.length}</span>
        </button>
        {COMPANY_CATEGORIES.map((c) => {
          const n = COMPANIES.filter((x) => x.category === c).length;
          return (
            <button key={c} onClick={() => setFilter(c)} className={chip(filter === c)}>
              {c} <span className="opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      {/* grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {list.map((c) => (
          <CompanyTile key={c.id} company={c} onOpen={() => setActive(c)} />
        ))}
      </div>

      {active && <CompanyModal company={active} onClose={() => setActive(null)} />}
    </div>
  );
}
