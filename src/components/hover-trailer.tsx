"use client";

import { useRef, useState } from "react";
import type { Game } from "@/data/games";

const trailerUrl = (id: string) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/microtrailer.webm`;

// Cache resolved movie ids per appid across cards ("" = none).
const movieCache = new Map<string, string>();

/**
 * Wraps a cover; on hover plays the Steam microtrailer. Uses the curated
 * trailerId when present, otherwise resolves the movie id on first hover via
 * /api/trailer (cached) — so most Steam games get a hover preview. Falls back
 * silently to the cover on no id, error, or reduced motion.
 */
export function HoverTrailer({ game, children }: { game: Game; children: React.ReactNode }) {
  const [movieId, setMovieId] = useState<string>(game.trailerId ?? "");
  const [show, setShow] = useState(false);
  const reduced = useRef(false);

  async function onEnter() {
    if (typeof window !== "undefined") {
      reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    if (reduced.current) return;

    let id = movieId;
    if (!id && /^\d+$/.test(game.id)) {
      const cached = movieCache.get(game.id);
      if (cached !== undefined) {
        id = cached;
      } else {
        try {
          const res = await fetch(`/api/trailer?appid=${game.id}`);
          id = (await res.json()).id ?? "";
        } catch {
          id = "";
        }
        movieCache.set(game.id, id);
      }
      if (id) setMovieId(id);
    }
    if (id) setShow(true);
  }

  return (
    <span
      className="relative block h-full w-full"
      onMouseEnter={onEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && movieId && (
        <video
          src={trailerUrl(movieId)}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setShow(false)}
          className="absolute inset-0 z-10 h-full w-full object-cover"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
