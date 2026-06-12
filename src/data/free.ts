// Free games are now fetched live from Epic (see /api/free + use-free-games).
// This module keeps only the shared shape used by the UI.

export type FreePlatform = "epic" | "psplus" | "prime" | "gog";

export interface FreeOffer {
  title: string;
  coverUrl: string;
  platform: FreePlatform;
  freeUntil: string; // ISO date
  normalTRY: number;
  slug?: string; // catalog link when available
  url?: string; // external store link (e.g. Epic)
}
