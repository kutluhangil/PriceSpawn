import type { SaleEvent } from "@/data/sales";

export type SaleStatus = "active" | "upcoming" | "past";

export function saleStatus(event: { start: string; end: string }, now: Date): SaleStatus {
  const start = Date.parse(`${event.start}T00:00:00Z`);
  const end = Date.parse(`${event.end}T23:59:59Z`);
  const t = now.getTime();
  if (t < start) return "upcoming";
  if (t > end) return "past";
  return "active";
}

export function daysUntil(dateISO: string, now: Date): number {
  const target = Date.parse(`${dateISO}T00:00:00Z`);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((target - today) / 86_400_000);
}

export function upcomingAndActive(events: SaleEvent[], now: Date): SaleEvent[] {
  return events
    .filter((e) => saleStatus(e, now) !== "past")
    .sort((a, b) => a.start.localeCompare(b.start));
}
