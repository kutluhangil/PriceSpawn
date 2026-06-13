export function bestLiveTRY(rows: { amount: number; currency: string }[], fx: number): number | null {
  if (!rows.length) return null;
  return Math.min(...rows.map((r) => (r.currency === "USD" ? r.amount * fx : r.amount)));
}
