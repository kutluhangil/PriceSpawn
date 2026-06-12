// Demo rate is the SSR/initial default; the live rate (from /api/prices) is
// applied on the client at runtime via setRate(), keeping toTRY() synchronous.
export const USD_TRY = 44.2;

let rate = USD_TRY;

export function setRate(r: number): void {
  if (r > 0) rate = r;
}

export function currentRate(): number {
  return rate;
}

export function toTRY(usd: number): number {
  return Math.round(usd * rate * 100) / 100;
}
