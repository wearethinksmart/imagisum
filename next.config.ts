import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash and Picsum resize on their own CDNs, so Next's optimiser would
    // only add a hop — and a usage quota of its own on most hosts.
    unoptimized: true
  }
};

export default nextConfig;
