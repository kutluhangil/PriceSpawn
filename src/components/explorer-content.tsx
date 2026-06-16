"use client";

import { useMemo, useState } from "react";
import { COMPANIES, COMPANY_CATEGORIES, type Company, type CompanyCategory } from "@/data/companies";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyModal } from "@/components/company-modal";
import { useApp } from "@/components/providers";

/** Apple-TV-style company tile — gradient stage, floating glyph, hover lift. */
function CompanyTile({ company, onOpen }: { company: Company; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ "--c": company.accent } as React.CSSProperties}
      className="group relative flex aspect-[5/4] flex-col justify-between overflow-hidden rounded-2xl border border-border p-4 text-left transition-all duration-300 will-change-transform hover:-translate-y-1.5 hover:border-(--c) hover:shadow-[0_18px_40px_-12px_var(--c)] focus:outline-none focus-visible:border-(--c)"
    >
      {/* atmospheric stage */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--c) 26%, transparent), transparent 62%), linear-gradient(165deg, color-mix(in srgb, var(--c) 14%, var(--bg-deep)), var(--bg-deep))",
        }}
      />
      {/* sheen sweep on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]"
      />

      <div className="flex justify-center pt-3 text-(--c) transition-transform duration-300 group-hover:scale-110">
        <CompanyLogo company={company} size={56} />
      </div>

      <div>
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
