import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 rejects any `quality` not in this list with HTTP 400 (default [75]).
    // Billboard uses 90 for a crisp hero, so it must be allowed here.
    qualities: [75, 90],
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
