export type StoreId =
  | "steam"
  | "epic"
  | "gog"
  | "xbox"
  | "playstation"
  | "ubisoft"
  | "ea"
  | "humble";

export interface StoreMeta {
  id: StoreId;
  label: string;
  accent: string;
  url: string; // official storefront homepage
}

export const STORES: Record<StoreId, StoreMeta> = {
  steam: { id: "steam", label: "Steam", accent: "#66c0f4", url: "https://store.steampowered.com" },
  epic: { id: "epic", label: "Epic Games", accent: "#a8a8b8", url: "https://store.epicgames.com" },
  gog: { id: "gog", label: "GOG", accent: "#c44ccc", url: "https://www.gog.com" },
  xbox: { id: "xbox", label: "Xbox Store", accent: "#16c60c", url: "https://www.xbox.com/games/store" },
  playstation: { id: "playstation", label: "PlayStation Store", accent: "#2e8cff", url: "https://store.playstation.com" },
  ubisoft: { id: "ubisoft", label: "Ubisoft Store", accent: "#4da6ff", url: "https://store.ubisoft.com" },
  ea: { id: "ea", label: "EA App", accent: "#ff5c5c", url: "https://www.ea.com/ea-app" },
  humble: { id: "humble", label: "Humble Store", accent: "#ff6c6c", url: "https://www.humblebundle.com/store" },
};
