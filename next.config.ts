import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage (menu, gallery, destination photos) + Unsplash (defaults/demo).
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
