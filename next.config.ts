import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF first: ~20-30% smaller than WebP for these cover images, which is
    // most of PageSpeed's "improve image delivery" savings. WebP is the fallback
    // for browsers without AVIF decode.
    formats: ["image/avif", "image/webp"],
    // Next 16 rejects any `quality` not in this list with HTTP 400 (default [75]).
    // 62 = card covers (small, plenty crisp at AVIF); 90 = billboard hero.
    qualities: [62, 75, 90],
    // Cover hosts — optimized & edge-cached by Vercel instead of hot-linking.
    remotePatterns: [
      { protocol: "https", hostname: "**.steamstatic.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**.epicgames.com" },
      { protocol: "https", hostname: "cdn1.epicgames.com" },
      { protocol: "https", hostname: "cdn2.epicgames.com" },
    ],
    minimumCacheTTL: 2592000, // 30 days
  },
};

export default nextConfig;
