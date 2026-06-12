import type { Game } from "@/data/games";
import { bestPrice } from "@/lib/price";

export interface WatchItem {
  slug: string;
  targetTRY: number | null;
}

export function isWatched(list: WatchItem[], slug: string): boolean {
  return list.some((w) => w.slug === slug);
}

export function addWatch(list: WatchItem[], slug: string): WatchItem[] {
  if (isWatched(list, slug)) return list;
  return [...list, { slug, targetTRY: null }];
}

export function removeWatch(list: WatchItem[], slug: string): WatchItem[] {
  return list.filter((w) => w.slug !== slug);
}

export function setTarget(list: WatchItem[], slug: string, targetTRY: number | null): WatchItem[] {
  return list.map((w) => (w.slug === slug ? { ...w, targetTRY } : w));
}

export function targetMet(item: WatchItem, game: Game): boolean {
  if (item.targetTRY === null) return false;
  const best = bestPrice(game);
  return best ? best.tryAmount <= item.targetTRY : false;
}
