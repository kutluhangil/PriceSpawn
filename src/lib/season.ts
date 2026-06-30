import type { SaleEvent } from "@/data/sales";
import { saleStatus } from "@/lib/sales";

export type SeasonTheme = "summer" | "autumn" | "winter" | "spring";

export interface ActiveSeason {
  id: string;
  name: string;
  theme: SeasonTheme;
  start: string;
  end: string;
  url?: string;
}

/**
 * The seasonal sale that is live right now, if any — used to re-skin the site
 * palette. Driven entirely by the real curated sale calendar; only events that
 * carry a `season` tag participate, so Next Fest (demos, not discounts) and
 * untagged windows never trigger a re-skin.
 */
export function activeSeason(events: SaleEvent[], now: Date): ActiveSeason | null {
  const live = events.find(
    (e): e is SaleEvent & { season: SeasonTheme } =>
      e.season != null && saleStatus(e, now) === "active",
  );
  if (!live) return null;
  return {
    id: live.id,
    name: live.name,
    theme: live.season,
    start: live.start,
    end: live.end,
    url: live.url,
  };
}
