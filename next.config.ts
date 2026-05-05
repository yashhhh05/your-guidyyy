import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {hostname: "img.clerk.com"},
      {protocol: "https", hostname: "utfs.io"}
    ]
  }
};

export default nextConfig;
