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
}

export const STORES: Record<StoreId, StoreMeta> = {
  steam: { id: "steam", label: "Steam", accent: "#66c0f4" },
  epic: { id: "epic", label: "Epic Games", accent: "#a8a8b8" },
  gog: { id: "gog", label: "GOG", accent: "#c44ccc" },
  xbox: { id: "xbox", label: "Xbox Store", accent: "#16c60c" },
  playstation: { id: "playstation", label: "PlayStation Store", accent: "#2e8cff" },
  ubisoft: { id: "ubisoft", label: "Ubisoft Store", accent: "#4da6ff" },
  ea: { id: "ea", label: "EA App", accent: "#ff5c5c" },
  humble: { id: "humble", label: "Humble Store", accent: "#ff6c6c" },
};
