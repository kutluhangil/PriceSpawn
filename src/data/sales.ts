import type { StoreId } from "@/lib/stores";
import type { SeasonTheme } from "@/lib/season";

export interface SaleEvent {
  id: string;
  name: string;
  store: StoreId;
  start: string; // ISO date (UTC), inclusive
  end: string; // ISO date (UTC), inclusive
  url?: string;
  /** Set on major seasonal sales that re-skin the site palette while live. */
  season?: SeasonTheme;
}

// Curated store sale calendar. Dates after the next confirmed event are
// PROJECTED from prior-year patterns and should be verified/refreshed each
// quarter. Sources: Valve seasonal schedule, SteamDB history, Epic patterns.
export const SALE_EVENTS: SaleEvent[] = [
  { id: "steam-nextfest-jun-2026", name: "Steam Next Fest (Haziran)", store: "steam", start: "2026-06-15", end: "2026-06-22", url: "https://store.steampowered.com" },
  { id: "steam-summer-2026", name: "Steam Yaz İndirimi", store: "steam", start: "2026-06-25", end: "2026-07-09", url: "https://store.steampowered.com", season: "summer" },
  { id: "steam-nextfest-oct-2026", name: "Steam Next Fest (Ekim)", store: "steam", start: "2026-10-13", end: "2026-10-20", url: "https://store.steampowered.com" },
  { id: "steam-autumn-2026", name: "Steam Sonbahar İndirimi", store: "steam", start: "2026-11-25", end: "2026-12-01", url: "https://store.steampowered.com", season: "autumn" },
  { id: "epic-holiday-2026", name: "Epic Yılbaşı İndirimi", store: "epic", start: "2026-12-17", end: "2027-01-07", url: "https://store.epicgames.com" },
  { id: "steam-winter-2026", name: "Steam Kış İndirimi", store: "steam", start: "2026-12-18", end: "2027-01-05", url: "https://store.steampowered.com", season: "winter" },
  { id: "ps-holiday-2026", name: "PlayStation Yılbaşı İndirimi", store: "playstation", start: "2026-12-17", end: "2027-01-19", url: "https://store.playstation.com" },
];
