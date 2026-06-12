import type { StoreId } from "@/lib/stores";
import { STORES } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";
import { SUBSCRIPTIONS } from "@/lib/subscriptions";

// Simplified, recognizable brand glyphs (single-path where possible).
const STORE_GLYPH: Record<StoreId, React.ReactNode> = {
  steam: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <circle cx="15" cy="9" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8.5" cy="14.5" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.4 13.3 13 10.7" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  epic: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="3" fill="currentColor" opacity="0.18" />
      <path d="M12 6v9m0 0-2.4-2.4M12 15l2.4-2.4M8.5 18h7" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  gog: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.18" />
      <path d="M8 9.5h2.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5H8.5a1.5 1.5 0 0 1-1.5-1.5V11A1.5 1.5 0 0 1 8 9.5zM14.5 9.5h2a1.5 1.5 0 0 1 1.5 1.5v3.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  xbox: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path d="M6 18c2-4 4.5-6.5 6-8 1.5 1.5 4 4 6 8M8 5.5c2 1 3 2 4 3 1-1 2-2 4-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  playstation: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" opacity="0.18" />
      <path d="M10 7v9l3 1V9.2c1.4.3 2 .9 2 1.8 0 1-.8 1.4-2 1.2" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  ubisoft: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.6 12a6.4 6.4 0 0 1 9-5.6M18.4 12a6.4 6.4 0 0 1-9 5.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  ea: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" opacity="0.18" />
      <path d="M7 15c1.5-3.5 3-6 4.5-6S15 11.5 16 15M8.5 13h5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  humble: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" opacity="0.18" />
      <path d="M9 7v10M9 12h4a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H9m6 10v-4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
};

const SUB_GLYPH: Record<SubscriptionId, React.ReactNode> = {
  gamepass: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path d="M6 18c2-4 4.5-6.5 6-8 1.5 1.5 4 4 6 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  psplus: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" opacity="0.18" />
      <path d="M10 7v9l3 1V9.2c1.4.3 2 .9 2 1.8 0 1-.8 1.4-2 1.2" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  eaplay: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" fill="currentColor" opacity="0.18" />
      <path d="M7 15c1.5-3.5 3-6 4.5-6S15 11.5 16 15M8.5 13h5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
  ubisoftplus: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.6 12a6.4 6.4 0 0 1 9-5.6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  luna: (
    <>
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.18" />
      <path d="M15.5 14.5A5 5 0 1 1 12 6a4 4 0 0 0 3.5 8.5z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </>
  ),
};

export function StoreLogo({ id, size = 16 }: { id: StoreId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color: STORES[id].accent }}
      aria-hidden="true"
      className="shrink-0"
    >
      {STORE_GLYPH[id]}
    </svg>
  );
}

export function SubLogo({ id, size = 16 }: { id: SubscriptionId; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color: SUBSCRIPTIONS[id].accent }}
      aria-hidden="true"
      className="shrink-0"
    >
      {SUB_GLYPH[id]}
    </svg>
  );
}
