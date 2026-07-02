import type { MetadataRoute } from "next";
import { GAMES } from "@/data/games";
import { catalogSlugs } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

// Chunk size for sitemaps (Next.js supports up to 50,000, but smaller is better for parsing)
const CHUNK_SIZE = 5000;

export async function generateSitemaps() {
  const fromDb = await catalogSlugs();
  const total = fromDb.length || GAMES.length;
  // Add 1 extra sitemap specifically for static pages, and the rest for games
  const chunkCount = Math.ceil(total / CHUNK_SIZE);
  // id: 0 will be static routes + first chunk of games
  // id: 1 will be second chunk, etc.
  return Array.from({ length: chunkCount }, (_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const fromDb = await catalogSlugs();
  const slugs = fromDb.length
    ? fromDb
    : GAMES.map((g) => ({ slug: g.slug, updatedAt: new Date() }));

  const start = id * CHUNK_SIZE;
  const end = start + CHUNK_SIZE;
  const chunk = slugs.slice(start, end);

  const gameRoutes = chunk.map((s) => ({
    url: `${SITE_URL}/oyun/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Only include static routes in the first sitemap (id === 0)
  if (id === 0) {
    const staticRoutes = [
      "",
      "/oyunlar",
      "/populer",
      "/ucretsiz",
      "/takip",
      "/abonelikler",
      "/abonelikler/degisiklikler",
      "/paketler",
      "/explorer",
    ].map((p) => ({
      url: `${SITE_URL}${p}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: p === "" ? 1 : 0.7,
    }));
    return [...staticRoutes, ...gameRoutes];
  }

  return gameRoutes;
}
