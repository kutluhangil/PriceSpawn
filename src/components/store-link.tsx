"use client";

import type { Game, Price } from "@/data/games";
import { storeUrl } from "@/lib/store-url";

/**
 * Opens the game's page in a store. Defaults to a real <a target="_blank"> so
 * it never trips popup blockers. When `nested` (rendered inside another <a>,
 * e.g. a game card), falls back to a button + window.open to avoid invalid
 * nested anchors.
 */
export function StoreLink({
  game,
  price,
  className = "",
  nested = false,
  children,
}: {
  game: Game;
  price: Price;
  className?: string;
  nested?: boolean;
  children: React.ReactNode;
}) {
  const url = storeUrl(game, price);

  if (nested) {
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

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={className}
    >
      {children}
    </a>
  );
}
