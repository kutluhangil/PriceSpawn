"use client";

import { useEffect, useMemo, useState } from "react";
import type { UpcomingPayload } from "@/app/api/upcoming/route";
import type { SteamUpcoming } from "@/lib/fetchers";
import { formatTRY } from "@/lib/format";
import { useApp } from "@/components/providers";

/** Tam günlük (UTC) çözünürlükte "bugünden X gün sonra". */
function daysUntilISO(iso: string, now: Date): number {
  const target = new Date(`${iso}T00:00:00Z`).getTime();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

/** Önümüzdeki aylarda çıkacak oyunlar — Steam'de en çok beklenenler (canlı). */
export function UpcomingReleases() {
  const { t, locale } = useApp();
  const [items, setItems] = useState<SteamUpcoming[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/upcoming")
      .then((r) => r.json())
      .then((d: UpcomingPayload) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const now = new Date();
  const loc = locale === "tr" ? "tr-TR" : "en-US";
  const fmtFull = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  const monthLabel = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(loc, { month: "long", year: "numeric", timeZone: "UTC" });

  // Çıkış ayına göre grupla — gerçek bir takvim ajandası gibi okunsun.
  const groups = useMemo(() => {
    const g: { key: string; label: string; items: SteamUpcoming[] }[] = [];
    for (const it of items) {
      const key = it.date.slice(0, 7);
      let grp = g.find((x) => x.key === key);
      if (!grp) {
        grp = { key, label: monthLabel(it.date), items: [] };
        g.push(grp);
      }
      grp.items.push(it);
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, locale]);

  if (items.length === 0) return null;

  const featured = items[0];
  const featuredDays = daysUntilISO(featured.date, now);

  return (
    <div className="grid gap-4 lg:grid-cols-[19rem_1fr]">
      {/* Sol: en yakın çıkış — sinematik kapak kartı */}
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="panel-strong group relative flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-2xl p-6 transition-all hover:border-accent"
      >
        {featured.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={featured.cover}
            alt={featured.name}
            className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--bg-deep), color-mix(in srgb, var(--bg-deep) 78%, transparent) 42%, transparent)",
          }}
        />
        <div className="relative">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{t.upcomingNextLabel}</span>
          <h3 className="font-display mt-2 text-2xl font-bold leading-tight text-bright">{featured.name}</h3>
          <p className="mt-1 text-sm text-muted">{fmtFull(featured.date)}</p>
          <div className="mt-5">
            <span className="text-xs text-muted">{t.upcomingCountdownLabel}</span>
            {featuredDays <= 0 ? (
              <p className="font-display text-2xl font-extrabold text-best">{t.upcomingReleaseToday}</p>
            ) : (
              <p className="font-display text-3xl font-extrabold leading-none text-bright">
                {featuredDays}
                <span className="ml-2 text-base font-normal text-muted">{t.saleDaysLeft}</span>
              </p>
            )}
          </div>
        </div>
      </a>

      {/* Sağ: aylara bölünmüş çıkış ajandası */}
      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-2.5 flex items-center gap-3">
              <h4 className="font-display text-sm font-bold uppercase tracking-wide text-bright">{group.label}</h4>
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted">{group.items.length}</span>
            </div>

            <ul className="flex flex-col gap-2.5">
              {group.items.map((it) => {
                const d = daysUntilISO(it.date, now);
                const today = d <= 0;
                const soon = d > 0 && d <= 7;
                const day = new Date(`${it.date}T00:00:00Z`).getUTCDate();
                const stripe = today ? "var(--best)" : soon ? "#f59e0b" : "var(--accent)";

                return (
                  <li key={it.appid}>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="panel-strong group relative flex items-center gap-3 overflow-hidden rounded-xl py-2.5 pl-4 pr-3 transition-all hover:-translate-y-0.5 hover:border-accent sm:gap-4"
                    >
                      <span className="absolute inset-y-0 left-0 w-1" style={{ background: stripe }} aria-hidden="true" />

                      {/* Takvim günü çipi */}
                      <span
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{
                          background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--accent) 28%, transparent)",
                        }}
                      >
                        <span className="text-base font-extrabold leading-none text-accent">{day}</span>
                      </span>

                      {/* Küçük kapak */}
                      <span className="hidden h-10 w-[72px] shrink-0 overflow-hidden rounded-md bg-(--row) sm:block">
                        {it.cover && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={it.cover}
                            alt={it.name}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-bright">{it.name}</p>
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {fmtFull(it.date)}
                          {it.free ? (
                            <span className="ml-2 font-semibold text-best">· {t.upcomingFree}</span>
                          ) : it.priceTRY ? (
                            <span className="ml-2">· {formatTRY(it.priceTRY, locale)}</span>
                          ) : null}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {today ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-best px-2.5 py-1 text-xs font-bold text-white">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                            <span className="hidden sm:inline">{t.upcomingReleaseToday}</span>
                          </span>
                        ) : (
                          <span className="leading-none">
                            <span
                              className="text-lg font-extrabold tabular-nums sm:text-xl"
                              style={{ color: soon ? "#f59e0b" : "var(--bright)" }}
                            >
                              {d}
                            </span>
                            <span className="ml-1 text-[11px] font-normal text-muted sm:text-xs">{t.saleDaysLeft}</span>
                          </span>
                        )}
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
