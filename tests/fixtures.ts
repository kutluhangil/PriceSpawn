import type { Game, Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";
import type { SubscriptionId } from "@/lib/subscriptions";

interface Spec {
  slug: string;
  genres: string[];
  score: number;
  year: number;
  subs?: SubscriptionId[];
  prices: [StoreId, number, number?][]; // [store, amount, discount%]
}

function mk(s: Spec): Game {
  const prices: Price[] = s.prices.map(([store, amount, disc]) => ({
    store,
    amount,
    currency: "TRY",
    ...(disc ? { discountPercent: disc, originalAmount: Math.round(amount / (1 - disc / 100)) } : {}),
  }));
  return {
    id: s.slug,
    slug: s.slug,
    title: s.slug.replace(/-/g, " "),
    coverUrl: "",
    genres: s.genres,
    score: s.score,
    releaseYear: s.year,
    prices,
    subscriptions: s.subs ?? [],
  };
}

/** Fixture catalog with prices — used by pure-function tests (the real catalog
 *  ships metadata-only, with prices injected from the live API at runtime). */
export function sampleGames(): Game[] {
  return [
    mk({ slug: "alpha-rpg", genres: ["RPG", "Açık Dünya"], score: 90, year: 2024, subs: ["gamepass"], prices: [["steam", 1500, 50], ["epic", 1600]] }),
    mk({ slug: "beta-shooter", genres: ["FPS"], score: 80, year: 2022, subs: ["eaplay"], prices: [["ea", 800], ["steam", 900]] }),
    mk({ slug: "gamma-indie", genres: ["Indie", "Bulmaca"], score: 88, year: 2021, prices: [["steam", 300, 40]] }),
    mk({ slug: "delta-strategy", genres: ["Strateji"], score: 75, year: 2020, subs: ["gamepass"], prices: [["xbox", 2400], ["steam", 2500]] }),
    mk({ slug: "epsilon-racing", genres: ["Yarış"], score: 70, year: 2023, prices: [["epic", 1200, 25], ["playstation", 1300]] }),
    mk({ slug: "zeta-rpg", genres: ["RPG"], score: 95, year: 2025, prices: [["gog", 1800], ["steam", 1850, 10]] }),
    mk({ slug: "eta-sports", genres: ["Spor"], score: 60, year: 2024, subs: ["eaplay"], prices: [["ea", 2999]] }),
    mk({ slug: "theta-horror", genres: ["Korku"], score: 82, year: 2019, prices: [["humble", 500, 60], ["steam", 520]] }),
  ];
}
