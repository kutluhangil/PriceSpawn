"use client";

import { useRef, useState } from "react";
import type { Game } from "@/data/games";

const trailerUrl = (id: string) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/microtrailer.webm`;

/**
 * Wraps a cover; on hover plays the Steam microtrailer over it when the game
 * has a trailerId. Falls back silently to the children (cover) on no id, error,
 * or reduced-motion.
 */
export function HoverTrailer({ game, children }: { game: Game; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const reduced = useRef(false);

  function onEnter() {
    if (typeof window !== "undefined") {
      reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    if (game.trailerId && !reduced.current) setShow(true);
  }

  return (
    <span
      className="relative block h-full w-full"
      onMouseEnter={onEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && game.trailerId && (
        <video
          src={trailerUrl(game.trailerId)}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setShow(false)}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
