import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Optional: Alias 'canvas' to false to avoid unresolved dependencies
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;