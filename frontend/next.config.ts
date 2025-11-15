import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to disable webpack warning
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      pino: false,
    };
    return config;
  },
  transpilePackages: ['thirdweb'],
};

export default nextConfig;
