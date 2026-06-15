import type { Game, Price } from "@/data/games";
import type { StoreId } from "@/lib/stores";

/**
 * Deterministic per-store link for a game when there's no live deal URL — a
 * direct product page where the id is known, otherwise the store's search for
 * the title. Guarantees every price row is clickable.
 */
function fallbackUrl(store: StoreId, game: Game): string {
  const t = encodeURIComponent(game.title);
  const steam = /^\d+$/.test(game.id)
    ? `https://store.steampowered.com/app/${game.id}/`
    : `https://store.steampowered.com/search/?term=${t}`;
  const byStore: Record<StoreId, string> = {
    steam,
    epic: `https://store.epicgames.com/en-US/browse?q=${t}`,
    gog: `https://www.gog.com/en/games?query=${t}`,
    xbox: `https://www.xbox.com/en-us/Search/Results?q=${t}`,
    playstation: `https://store.playstation.com/en-tr/search/${t}`,
    ubisoft: `https://store.ubisoft.com/us/search?q=${t}`,
    ea: `https://www.ea.com/games?search=${t}`,
    humble: `https://www.humblebundle.com/store/search?search=${t}`,
  };
  return byStore[store];
}

/** Buy link for a game in a store: the live deal URL, else a deterministic store link. */
export function storeUrl(game: Game, price: Price): string {
  return price.url || fallbackUrl(price.store, game);
}
