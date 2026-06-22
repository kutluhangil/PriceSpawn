"use client";

import { useMemo, useRef, useState } from "react";
import { COMPANIES, COMPANY_CATEGORIES, type Company, type CompanyCategory } from "@/data/companies";
import { CompanyLogo } from "@/components/company-logo";
import { CompanyModal } from "@/components/company-modal";
import { useApp } from "@/components/providers";

/** Company tile — frosted-glass logo pane with mouse-follow 3D tilt + depth pop. */
function CompanyTile({ company, onOpen }: { company: Company; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);

  function tilt(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(px * 11).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-py * 11).toFixed(2)}deg`);
    el.style.setProperty("--ty", "-6px");
  }
  function reset() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--ty", "0px");
  }

  return (
    <div className="[perspective:1000px]">
      <button
        ref={ref}
        type="button"
        onClick={onOpen}
        onMouseMove={tilt}
        onMouseLeave={reset}
        style={{ "--c": company.accent } as React.CSSProperties}
        className="tile3d group relative flex w-full flex-col rounded-2xl border border-border bg-bg-deep p-2.5 text-left focus:outline-none focus-visible:border-(--c) hover:border-(--c) hover:shadow-[0_26px_55px_-18px_var(--c)]"
      >
        {/* frosted-glass logo well, pushed forward in 3D space */}
        <div className="logo-glass relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-xl p-5 [transform:translateZ(34px)]">
          {/* brand glow frosted beneath the glass (blooms on hover) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: "radial-gradient(72% 60% at 50% 42%, color-mix(in srgb, var(--c) 32%, transparent), transparent 72%)" }}
          />
          <CompanyLogo company={company} className="relative max-h-14 text-base drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-[1.05] sm:max-h-16" />
        </div>

        <div className="px-1.5 pb-1 pt-2.5 [transform:translateZ(20px)]">
          <div className="truncate font-display text-sm font-bold text-bright">{company.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
            <span className="font-semibold text-(--c)">{company.category}</span>
            <span>·</span>
            <span>{company.founded}</span>
          </div>
        </div>
      </button>
    </div>
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
