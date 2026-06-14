/**
 * "Buy / Wait" deal advice — the signal that sets a price-comparison site apart
 * (cf. GG.deals "Great deal", IsThereAnyDeal historical-low context). Pure: no
 * UI, no i18n, fully unit-testable.
 */

export type VerdictLevel = "buy-low" | "buy" | "ok" | "wait";

export interface VerdictInput {
  /** Current cheapest price in TRY. */
  bestTRY: number | null | undefined;
  /** Real all-time-low price in TRY (from ITAD), if known. */
  atlTRY?: number | null;
  /** Current best discount percent (0–100). */
  discountPercent?: number;
}

export interface Verdict {
  level: VerdictLevel;
  /** How far the current price sits above the all-time low, in % (0 = at ATL). */
  abovePct?: number;
}

/**
 * Returns a verdict, or `null` when there isn't enough signal to advise
 * (no ATL and no meaningful discount — don't nag on full-price games).
 */
export function dealVerdict({ bestTRY, atlTRY, discountPercent = 0 }: VerdictInput): Verdict | null {
  if (bestTRY == null || bestTRY <= 0) return null;

  if (atlTRY != null && atlTRY > 0) {
    const ratio = bestTRY / atlTRY;
    const abovePct = Math.max(0, Math.round((ratio - 1) * 100));
    if (ratio <= 1.02) return { level: "buy-low", abovePct: 0 };
    if (ratio <= 1.15 || discountPercent >= 50) return { level: "buy", abovePct };
    if (ratio <= 1.4 || discountPercent >= 25) return { level: "ok", abovePct };
    return { level: "wait", abovePct };
  }

  // No historical low to anchor against — lean on the live discount only.
  if (discountPercent >= 50) return { level: "buy" };
  if (discountPercent >= 20) return { level: "ok" };
  return null;
}
