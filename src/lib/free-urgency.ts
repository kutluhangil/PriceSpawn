/** Urgency helpers for free-game giveaways (Epic etc.), driven by real end dates. */

const HOUR = 3_600_000;

/** Hours from `now` until the ISO end date. Negative once it has passed. */
export function hoursUntil(iso: string, now: Date): number {
  return (Date.parse(iso) - now.getTime()) / HOUR;
}

/** Still live but ending within `withinHours` (default 48h) — the "hurry" zone. */
export function endingSoon(offer: { freeUntil: string }, now: Date, withinHours = 48): boolean {
  const h = hoursUntil(offer.freeUntil, now);
  return !Number.isNaN(h) && h >= 0 && h <= withinHours;
}

/** Sort by soonest end first; invalid/unparseable dates sink to the bottom. */
export function sortBySoonest<T extends { freeUntil: string }>(offers: T[]): T[] {
  return [...offers].sort((a, b) => {
    const ta = Date.parse(a.freeUntil);
    const tb = Date.parse(b.freeUntil);
    const na = Number.isNaN(ta);
    const nb = Number.isNaN(tb);
    if (na && nb) return 0;
    if (na) return 1;
    if (nb) return -1;
    return ta - tb;
  });
}
