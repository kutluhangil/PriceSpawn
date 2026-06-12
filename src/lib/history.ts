import type { Game } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import { priceInTRY } from "@/lib/price";

export interface PricePoint {
  day: number;
  date: string; // ISO yyyy-mm-dd
  tryAmount: number;
}

// xfnv1a string hash → 32-bit seed
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// mulberry32 deterministic PRNG
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fixed epoch so dates never drift between SSR and client within a day.
const EPOCH = new Date("2026-06-12T00:00:00Z").getTime();

function isoDay(daysAgo: number): string {
  return new Date(EPOCH - daysAgo * 86400000).toISOString().slice(0, 10);
}

/**
 * Synthetic daily price history, deterministic per (slug, store).
 * Random walk around the undiscounted price with occasional sale dips,
 * anchored so the final point equals the current store price.
 */
export function priceHistory(game: Game, store: StoreId, days = 90): PricePoint[] {
  const price = game.prices.find((p) => p.store === store);
  if (!price) return [];
  const current = priceInTRY(price);
  const rand = rng(seedFrom(`${game.slug}:${store}`));

  const base = current / (1 - (price.discountPercent ?? 0) / 100); // approx undiscounted
  const pts: PricePoint[] = [];
  let level = base;
  for (let i = 0; i < days; i++) {
    level += (rand() - 0.5) * base * 0.01;
    level = Math.max(base * 0.92, Math.min(base * 1.02, level));
    let value = level;
    if (rand() < 0.08) {
      const cut = 0.2 + rand() * 0.5; // 20-70% off
      value = level * (1 - cut);
    }
    pts.push({
      day: i,
      date: isoDay(days - 1 - i),
      tryAmount: Math.round(value * 100) / 100,
    });
  }
  // anchor final point to the actual current price
  pts[pts.length - 1] = { day: days - 1, date: isoDay(0), tryAmount: current };
  return pts;
}

export interface AllTimeLow {
  tryAmount: number;
  store: StoreId;
  day: number;
}

export function allTimeLow(game: Game, days = 90): AllTimeLow {
  let best: AllTimeLow | null = null;
  for (const p of game.prices) {
    for (const pt of priceHistory(game, p.store, days)) {
      if (!best || pt.tryAmount < best.tryAmount) {
        best = { tryAmount: pt.tryAmount, store: p.store, day: pt.day };
      }
    }
  }
  return best ?? { tryAmount: 0, store: game.prices[0].store, day: 0 };
}

export function isAllTimeLow(game: Game): boolean {
  const best = Math.min(...game.prices.map(priceInTRY));
  return best <= allTimeLow(game).tryAmount * 1.02;
}

export function sparklinePath(points: PricePoint[], w: number, h: number): string {
  if (points.length === 0) return "";
  const vals = points.map((p) => p.tryAmount);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  return points
    .map((p, i) => {
      const x = (i / (points.length - 1 || 1)) * w;
      const y = h - ((p.tryAmount - min) / span) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
