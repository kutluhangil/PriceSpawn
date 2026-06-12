export type FreePlatform = "epic" | "psplus" | "prime" | "gog";

export interface FreeOffer {
  title: string;
  coverUrl: string;
  platform: FreePlatform;
  freeUntil: string; // ISO date
  normalTRY: number;
  slug?: string; // catalog link when available
}

const cover = (appid: number) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;

export const FREE_OFFERS: FreeOffer[] = [
  {
    title: "Control Ultimate Edition",
    coverUrl: cover(870780),
    platform: "epic",
    freeUntil: "2026-06-19",
    normalTRY: 499,
    slug: "control-ultimate-edition",
  },
  {
    title: "Disco Elysium - The Final Cut",
    coverUrl: cover(632470),
    platform: "epic",
    freeUntil: "2026-06-19",
    normalTRY: 499,
    slug: "disco-elysium",
  },
  {
    title: "Days Gone",
    coverUrl: cover(1259420),
    platform: "psplus",
    freeUntil: "2026-07-01",
    normalTRY: 949,
    slug: "days-gone",
  },
  {
    title: "Returnal",
    coverUrl: cover(1649240),
    platform: "psplus",
    freeUntil: "2026-07-01",
    normalTRY: 1149,
    slug: "returnal",
  },
  {
    title: "Dishonored 2",
    coverUrl: cover(403640),
    platform: "prime",
    freeUntil: "2026-06-25",
    normalTRY: 359,
    slug: "dishonored-2",
  },
  {
    title: "Fallout 4",
    coverUrl: cover(377160),
    platform: "prime",
    freeUntil: "2026-06-25",
    normalTRY: 449,
    slug: "fallout-4",
  },
  {
    title: "Celeste",
    coverUrl: cover(504230),
    platform: "gog",
    freeUntil: "2026-06-22",
    normalTRY: 249,
    slug: "celeste",
  },
  {
    title: "Cuphead",
    coverUrl: cover(268910),
    platform: "epic",
    freeUntil: "2026-06-19",
    normalTRY: 549,
    slug: "cuphead",
  },
];
