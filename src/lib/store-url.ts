import type { Game, Price } from "@/data/games";

/** Link to the game's page in a given store: live url, else Steam-appid fallback. */
export function storeUrl(game: Game, price: Price): string | null {
  if (price.url) return price.url;
  if (price.store === "steam" && /^\d+$/.test(game.id)) {
    return `https://store.steampowered.com/app/${game.id}`;
  }
  return null;
}
