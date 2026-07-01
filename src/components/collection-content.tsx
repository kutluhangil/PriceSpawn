"use client";

import { useEffect, useState } from "react";
import { useCollection } from "@/hooks/use-collection";
import { useApp } from "@/components/providers";
import { GAMES, type Game } from "@/data/games";
import { bestPrice } from "@/lib/price";
import { GameCard } from "@/components/game-card";
import { SteamOwnedImport } from "@/components/steam-owned-import";

function onSale(game: Game): boolean {
  const best = bestPrice(game);
  return best?.price.discountPercent != null && best.price.discountPercent > 0;
}

export function CollectionContent() {
  const { t } = useApp();
  const { list, ready } = useCollection();

  // Owned games not in the bundled GAMES are pulled from the catalog.
  const [dbGames, setDbGames] = useState<Record<string, Game>>({});
  useEffect(() => {
    const missing = list.filter((slug) => !GAMES.some((g) => g.slug === slug) && !dbGames[slug]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((slug) =>
        fetch(`/api/catalog-game?slug=${encodeURIComponent(slug)}`)
          .then((r) => r.json())
          .then((d) => (d.found && d.game ? ([slug, d.game] as const) : null))
          .catch(() => null),
      ),
    ).then((pairs) => {
      if (cancelled) return;
      const add: Record<string, Game> = {};
      for (const p of pairs) if (p) add[p[0]] = p[1];
      if (Object.keys(add).length) setDbGames((prev) => ({ ...prev, ...add }));
    });
    return () => {
      cancelled = true;
    };
  }, [list, dbGames]);

  const games = list
    .map((slug) => GAMES.find((g) => g.slug === slug) ?? dbGames[slug])
    .filter((g): g is Game => Boolean(g));

  // Surface discounted owned games first.
  const sorted = [...games].sort((a, b) => Number(onSale(b)) - Number(onSale(a)));
  const saleCount = games.filter(onSale).length;

  return (
    <div className="mx-auto w-[min(100%-2rem,74rem)] py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-bright">📚 {t.collectionPage}</h1>
        <p className="mt-1.5 text-sm text-muted">{t.collectionNote}</p>
        {games.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-(--row-hover) px-3 py-1 font-semibold text-bright">
              {games.length} {t.collectionCount}
            </span>
            {saleCount > 0 && (
              <span className="rounded-full bg-best-soft px-3 py-1 font-semibold text-best">
                🔻 {saleCount} · {t.collectionOnSale}
              </span>
            )}
          </p>
        )}
      </header>

      <SteamOwnedImport />

      {ready && list.length === 0 ? (
        <p className="rounded-xl border border-border bg-(--panel) px-5 py-10 text-center text-sm text-muted">
          {t.collectionEmpty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
