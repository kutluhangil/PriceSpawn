"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/providers";

function Icon({ name }: { name: "search" | "deals" | "free" | "watch" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (name === "search")
    return (
      <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
    );
  if (name === "deals")
    return (
      <svg {...common}><path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h7z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
    );
  if (name === "free")
    return (
      <svg {...common}><path d="M20 12v9H4v-9M2 7h20v5H2zM12 7v14M12 7S9 2 6.5 3.5 9 7 12 7zM12 7s3-5 5.5-3.5S15 7 12 7z" /></svg>
    );
  return (
    <svg {...common}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
  );
}

export function BottomNav() {
  const { t } = useApp();
  const pathname = usePathname();

  const tabs = [
    { key: "search" as const, label: t.navSearch, action: () => window.dispatchEvent(new CustomEvent("open-palette")) },
    { key: "deals" as const, label: t.navDeals, href: "/#deals" },
    { key: "free" as const, label: t.navFree, href: "/ucretsiz" },
    { key: "watch" as const, label: t.navWatch, href: "/takip" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg/95 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const active = tab.href && pathname === tab.href.replace("/#deals", "/");
          const cls = `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
            active ? "text-accent" : "text-muted"
          }`;
          return tab.href ? (
            <Link key={tab.key} href={tab.href} className={cls}>
              <Icon name={tab.key} />
              {tab.label}
            </Link>
          ) : (
            <button key={tab.key} onClick={tab.action} className={cls}>
              <Icon name={tab.key} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
