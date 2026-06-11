export type SubscriptionId = "gamepass" | "psplus" | "eaplay" | "ubisoftplus" | "luna";

export interface SubscriptionMeta {
  id: SubscriptionId;
  label: string;
  monthlyTRY: number;
  accent: string;
}

export const SUBSCRIPTIONS: Record<SubscriptionId, SubscriptionMeta> = {
  gamepass: { id: "gamepass", label: "Xbox Game Pass", monthlyTRY: 549, accent: "#16c60c" },
  psplus: { id: "psplus", label: "PS Plus Extra", monthlyTRY: 460, accent: "#2e8cff" },
  eaplay: { id: "eaplay", label: "EA Play", monthlyTRY: 149, accent: "#ff5c5c" },
  ubisoftplus: { id: "ubisoftplus", label: "Ubisoft+", monthlyTRY: 679, accent: "#4da6ff" },
  luna: { id: "luna", label: "Amazon Luna", monthlyTRY: 430, accent: "#9146ff" },
};
