import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Increase timeout for API routes
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Optimize for production
  output: 'standalone',
  // Increase memory limit for large JSON processing
  serverExternalPackages: ['fs', 'path'],
};

export default nextConfig;

