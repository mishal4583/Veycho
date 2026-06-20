import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Menu / gallery / offer images are served from Supabase Storage public URLs.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
