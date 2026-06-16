import type { MetadataRoute } from "next";
import { GAMES } from "@/data/games";
import { catalogSlugs } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/oyunlar", "/ucretsiz", "/takip", "/abonelikler", "/paketler"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  // Full catalog (DB), falling back to the bundled GAMES if the DB is empty.
  const fromDb = await catalogSlugs();
  const slugs = fromDb.length
    ? fromDb
    : GAMES.map((g) => ({ slug: g.slug, updatedAt: new Date() }));
  const gameRoutes = slugs.map((s) => ({
    url: `${SITE_URL}/oyun/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...gameRoutes];
}
