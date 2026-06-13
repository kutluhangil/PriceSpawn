import type { MetadataRoute } from "next";
import { GAMES } from "@/data/games";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/oyunlar", "/ucretsiz", "/takip", "/abonelikler"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));
  const gameRoutes = GAMES.map((g) => ({
    url: `${SITE_URL}/oyun/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));
  return [...staticRoutes, ...gameRoutes];
}
