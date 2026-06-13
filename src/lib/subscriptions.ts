export type SubscriptionId = "gamepass" | "psplus" | "eaplay" | "eaplaypro" | "ubisoftplus" | "luna";

export interface SubscriptionMeta {
  id: SubscriptionId;
  label: string;
  monthlyTRY: number;
  yearlyTRY?: number; // shown as a second plan line when present
  accent: string;
  url: string; // official subscription page
}

export const SUBSCRIPTIONS: Record<SubscriptionId, SubscriptionMeta> = {
  gamepass: { id: "gamepass", label: "Xbox Game Pass", monthlyTRY: 549, accent: "#16c60c", url: "https://www.xbox.com/xbox-game-pass" },
  psplus: { id: "psplus", label: "PS Plus Extra", monthlyTRY: 460, accent: "#2e8cff", url: "https://www.playstation.com/ps-plus" },
  eaplay: { id: "eaplay", label: "EA Play", monthlyTRY: 219.99, yearlyTRY: 1499.99, accent: "#ff5c5c", url: "https://www.ea.com/ea-play" },
  eaplaypro: { id: "eaplaypro", label: "EA Play Pro", monthlyTRY: 619, accent: "#ff8a4c", url: "https://www.ea.com/ea-play/pro" },
  ubisoftplus: { id: "ubisoftplus", label: "Ubisoft+", monthlyTRY: 679, accent: "#4da6ff", url: "https://www.ubisoft.com/ubisoft-plus" },
  luna: { id: "luna", label: "Amazon Luna", monthlyTRY: 430, accent: "#9146ff", url: "https://luna.amazon.com" },
};
