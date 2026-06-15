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

/** Steam header art for a known appid — real cover instead of a gradient. */
const cover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

// Curated monthly Amazon Luna / Prime Gaming free PC games (claimable in TR).
// Update this list each month; no clean public API exists. Covers use the
// matching Steam appid so every card shows real art.
export const LUNA_FREE: LunaFreeGame[] = [
  { title: "Tomb Raider IV-VI Remastered", claimStore: "epic", coverUrl: cover(2525380), claimUrl: CLAIM, validUntil: END },
  { title: "G.I. Joe: Wrath of Cobra", claimStore: "epic", coverUrl: cover(2516170), claimUrl: CLAIM, validUntil: END },
  { title: "Space Grunts: Chrono Shard", claimStore: "epic", coverUrl: cover(3403540), claimUrl: CLAIM, validUntil: END },
  { title: "Please Touch the Artwork", claimStore: "epic", coverUrl: cover(1097100), claimUrl: CLAIM, validUntil: END },
  { title: "Mafia III: Definitive Edition", claimStore: "gog", coverUrl: cover(360430), claimUrl: CLAIM, validUntil: END },
  { title: "XCOM: Chimera Squad", claimStore: "gog", coverUrl: cover(882100), claimUrl: CLAIM, validUntil: END },
  { title: "Tested on Humans: Escape Room", claimStore: "gog", coverUrl: cover(1483780), claimUrl: CLAIM, validUntil: END },
  { title: "Sin Slayers: Reign of the 8th", claimStore: "gog", coverUrl: cover(2790000), claimUrl: CLAIM, validUntil: END },
  { title: "Paradise Killer", claimStore: "gog", coverUrl: cover(1160220), claimUrl: CLAIM, validUntil: END },
  { title: "Between Time: Escape Room", claimStore: "gog", coverUrl: cover(1580150), claimUrl: CLAIM, validUntil: END },
  { title: "Sugardew Island", claimStore: "gog", coverUrl: cover(2711030), claimUrl: CLAIM, validUntil: END },
  { title: "Wargame Construction Set III: Age of Rifles", claimStore: "gog", coverUrl: cover(2707280), claimUrl: CLAIM, validUntil: END },
  { title: "Space Grunts 2", claimStore: "gog", coverUrl: cover(1125370), claimUrl: CLAIM, validUntil: END },
  { title: "Terraforming Mars", claimStore: "amazon", coverUrl: cover(800270), claimUrl: CLAIM, validUntil: END },
  { title: "Lost Eidolons: Veil of the Witch", claimStore: "amazon", coverUrl: cover(2530490), claimUrl: CLAIM, validUntil: END },
];
