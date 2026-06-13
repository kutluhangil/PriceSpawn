import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
