export type SubscriptionId = "gamepass" | "psplus" | "eaplay" | "eaplaypro" | "ubisoftplus" | "luna";

/** A purchasable tier within a subscription (real TR pricing — volatile, verify periodically). */
export interface SubscriptionPlan {
  name: string;
  monthlyTRY: number;
  games: string; // official "X+ games" claim for this tier
}

export interface SubscriptionMeta {
  id: SubscriptionId;
  label: string;
  monthlyTRY: number;
  yearlyTRY?: number; // shown as a second plan line when present
  accent: string;
  url: string; // official subscription page
  plans?: SubscriptionPlan[]; // tiers shown on the value card
}

export const SUBSCRIPTIONS: Record<SubscriptionId, SubscriptionMeta> = {
  gamepass: {
    id: "gamepass",
    label: "Xbox Game Pass",
    monthlyTRY: 529, // Ultimate (full catalog) — headline tier
    accent: "#16c60c",
    url: "https://www.xbox.com/xbox-game-pass",
    // TR fiyatları, xbox.com/tr-TR (2026). Resmi oyun sayıları.
    plans: [
      { name: "Essential", monthlyTRY: 269, games: "50+" },
      { name: "Premium", monthlyTRY: 409, games: "200+" },
      { name: "Ultimate", monthlyTRY: 529, games: "400+" },
      { name: "PC", monthlyTRY: 419, games: "300+" },
    ],
  },
  psplus: {
    id: "psplus",
    label: "PlayStation Plus",
    monthlyTRY: 600, // Extra (game catalog) — headline tier
    accent: "#2e8cff",
    url: "https://www.playstation.com/ps-plus",
    // TR fiyatları, store.playstation.com/tr-tr (2026, volatil).
    plans: [
      { name: "Essential", monthlyTRY: 400, games: "Aylık" },
      { name: "Extra", monthlyTRY: 600, games: "400+" },
      { name: "Deluxe", monthlyTRY: 700, games: "450+" },
    ],
  },
  eaplay: {
    id: "eaplay",
    label: "EA Play",
    monthlyTRY: 219.99, // EA Play (entry tier) — headline
    yearlyTRY: 1499.99,
    accent: "#ff5c5c",
    url: "https://www.ea.com/ea-play",
    plans: [
      { name: "EA Play", monthlyTRY: 219.99, games: "Vault" },
      { name: "EA Play Pro", monthlyTRY: 619, games: "Gün-1" },
    ],
  },
  eaplaypro: { id: "eaplaypro", label: "EA Play Pro", monthlyTRY: 619, accent: "#ff8a4c", url: "https://www.ea.com/ea-play/pro" },
  ubisoftplus: {
    id: "ubisoftplus",
    label: "Ubisoft+",
    monthlyTRY: 679, // Premium (full library + day-one)
    accent: "#4da6ff",
    url: "https://www.ubisoft.com/ubisoft-plus",
    plans: [
      { name: "Premium", monthlyTRY: 679, games: "Gün-1" },
      { name: "Classics", monthlyTRY: 139, games: "~60" },
    ],
  },
  // Prime Gaming: bundled with Amazon Prime, NOT a standalone monthly sub in TR —
  // no real standalone price, so it's not shown on the value page (filtered out).
  // Kept for game tagging/badges only. monthlyTRY is a non-displayed placeholder.
  luna: { id: "luna", label: "Prime Gaming", monthlyTRY: 0, accent: "#00a8e1", url: "https://gaming.amazon.com" },
};
