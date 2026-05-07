import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {hostname: "img.clerk.com"},
      {hostname: "images.clerk.com"},
      {hostname: "images.clerk.dev"},
      {protocol: "https", hostname: "**.googleusercontent.com"},
      {protocol: "https", hostname: "utfs.io"}
    ]
  }
};

export default nextConfig;
