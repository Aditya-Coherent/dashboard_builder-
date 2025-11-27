import type { NextConfig } from "next";
import path from "path";

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
  // Configure Turbopack (Next.js 16 default) - add alias support
  turbopack: {
    resolveAlias: {
      '@excel-upload-tool': path.resolve(__dirname, './excel-upload-tool'),
    },
  },
  // Keep webpack config for backward compatibility (but Turbopack takes precedence)
  webpack: (config, { isServer }) => {
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    // Add alias for excel-upload-tool
    config.resolve.alias['@excel-upload-tool'] = path.resolve(__dirname, './excel-upload-tool');
    return config;
  },
};

export default nextConfig;

