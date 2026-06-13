"use client";

import type { Game, Price } from "@/data/games";
import { storeUrl } from "@/lib/store-url";

/**
 * Opens the game's page in a store. Rendered as a <button> + window.open so it
 * can live inside the card's <Link> without nesting anchors. Falls back to a
 * plain <span> when there's no resolvable URL.
 */
export function StoreLink({
  game,
  price,
  className = "",
  children,
}: {
  game: Game;
  price: Price;
  className?: string;
  children: React.ReactNode;
}) {
  const url = storeUrl(game, price);
  if (!url) return <span className={className}>{children}</span>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      className={className}
    >
      {children}
    </button>
  );
}
