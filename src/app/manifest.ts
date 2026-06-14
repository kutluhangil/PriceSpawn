import type { MetadataRoute } from "next";
import { SITE_SHORT } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_SHORT} — Oyun Fiyat Karşılaştırma`,
    short_name: SITE_SHORT,
    description: "Türkiye'deki oyun mağazalarını tek bakışta karşılaştır. TL fiyatlar, güncel kurla.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c12",
    theme_color: "#0a0c12",
    lang: "tr",
    categories: ["games", "shopping", "entertainment"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    ],
  };
}
