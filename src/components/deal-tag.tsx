import { STORES, type StoreId } from "@/lib/stores";

/** ITAD-style pennant discount tag. `low` = all-time low (spectrum brand fill). */
export function DealTag({ cut, low = false }: { cut: number; low?: boolean }) {
  if (!cut || cut <= 0) return null;
  return <span className={`deal-tag${low ? " deal-tag--low" : ""}`}>-%{cut}</span>;
}

/** Small glowing store-color dot. */
export function StoreDot({ store }: { store: StoreId }) {
  const accent = STORES[store]?.accent ?? "var(--muted)";
  return <span className="store-dot" style={{ color: accent, background: accent }} aria-hidden="true" />;
}
