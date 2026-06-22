"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CoverImage } from "@/components/cover-image";
import { SubLogo } from "@/components/store-logo";
import { SUBSCRIPTIONS, type SubscriptionId } from "@/lib/subscriptions";
import { useApp } from "@/components/providers";
import type { SubChangeItem } from "@/lib/sub-changes";

export function SubChangesContent({ changes }: { changes: SubChangeItem[] }) {
  const { t, locale } = useApp();
  const router = useRouter();
  const params = useSearchParams();

  const subFilter = (params.get("sub") ?? "") as SubscriptionId | "";
  const changeFilter = params.get("type") === "removed" ? "removed" : params.get("type") === "added" ? "added" : "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/abonelikler/degisiklikler${next.toString() ? `?${next}` : ""}`, { scroll: false });
  };

  const services = useMemo(() => {
    const seen = new Set<string>();
    for (const c of changes) if (SUBSCRIPTIONS[c.subId]) seen.add(c.subId);
    return [...seen] as SubscriptionId[];
  }, [changes]);

  const filtered = useMemo(
    () =>
      changes.filter(
        (c) =>
          SUBSCRIPTIONS[c.subId] &&
          (!subFilter || c.subId === subFilter) &&
          (!changeFilter || c.change === changeFilter),
      ),
    [changes, subFilter, changeFilter],
  );

  const groups = useMemo(() => {
    const map = new Map<string, SubChangeItem[]>();
    for (const c of filtered) {
      const arr = map.get(c.day) ?? [];
      arr.push(c);
      map.set(c.day, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const fmtDay = (d: string) =>
    new Date(d).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">{t.subChangesPage}</h1>
      <p className="mb-5 max-w-2xl text-sm text-muted">{t.subChangesDesc}</p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Chip active={!subFilter} onClick={() => setParam("sub", "")}>{t.subAllServices}</Chip>
        {services.map((id) => (
          <Chip key={id} active={subFilter === id} onClick={() => setParam("sub", id)} accent={SUBSCRIPTIONS[id].accent}>
            <SubLogo id={id} size={14} /> {SUBSCRIPTIONS[id].label}
          </Chip>
        ))}
        <span className="mx-1 w-px self-stretch bg-border" />
        <Chip active={changeFilter === "added"} onClick={() => setParam("type", changeFilter === "added" ? "" : "added")}>
          {t.subAdded}
        </Chip>
        <Chip active={changeFilter === "removed"} onClick={() => setParam("type", changeFilter === "removed" ? "" : "removed")}>
          {t.subRemoved}
        </Chip>
      </div>

      {groups.length === 0 ? (
        <div className="panel rounded-[var(--radius-card)] px-5 py-10 text-center text-sm text-muted">{t.subNoChanges}</div>
      ) : (
        <div className="flex flex-col gap-7">
          {groups.map(([day, items]) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">{fmtDay(day)}</h2>
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {items.map((c) => {
                  const sub = SUBSCRIPTIONS[c.subId];
                  return (
                    <li key={`${c.slug}-${c.subId}-${c.change}`}>
                      <Link
                        href={`/oyun/${c.slug}`}
                        className="panel flex items-center gap-3 rounded-[var(--radius-card)] p-2.5 transition-transform hover:scale-[1.005]"
                      >
                        <CoverImage src={c.cover} title={c.title} className="h-12 w-[88px] shrink-0 rounded-md" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-bright">{c.title}</div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: sub.accent }}>
                            <SubLogo id={c.subId} size={12} /> {sub.label}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            c.change === "added" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          }`}
                        >
                          {c.change === "added" ? t.subAdded : t.subRemoved}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  accent,
  children,
}: {
  active: boolean;
  onClick: () => void;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={active && accent ? { borderColor: accent, color: accent } : undefined}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active ? "border-accent text-bright" : "border-border text-muted hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}
