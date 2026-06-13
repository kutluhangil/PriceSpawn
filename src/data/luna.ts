export interface LunaFreeGame {
  title: string;
  claimStore: "epic" | "gog" | "amazon";
  coverUrl: string; // Steam header when known, else "" (gradient fallback)
  claimUrl: string;
  validUntil: string; // ISO date (inclusive)
}

export const LUNA_MONTH = "2026-06";

const CLAIM = "https://luna.amazon.com/claims";
const END = "2026-06-30";

// Curated monthly Amazon Luna / Prime Gaming free PC games (claimable in TR).
// Update this list each month; no clean public API exists.
export const LUNA_FREE: LunaFreeGame[] = [
  { title: "Tomb Raider IV-VI Remastered", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "G.I. Joe: Wrath of Cobra", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Space Grunts: Chrono Shard", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Please Touch the Artwork", claimStore: "epic", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Mafia III: Definitive Edition", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "XCOM: Chimera Squad", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Tested on Humans: Escape Room", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Sin Slayers: Reign of the 8th", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Paradise Killer", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Between Time: Escape Room", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Sugardew Island", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Wargame Construction Set III: Age of Rifles", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Space Grunts 2", claimStore: "gog", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Terraforming Mars", claimStore: "amazon", coverUrl: "", claimUrl: CLAIM, validUntil: END },
  { title: "Lost Eidolons: Veil of the Witch", claimStore: "amazon", coverUrl: "", claimUrl: CLAIM, validUntil: END },
];
