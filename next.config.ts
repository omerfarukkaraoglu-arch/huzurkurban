import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
