import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize development server
  turbopack: {
    resolveAlias: {
      // Ensure consistent module resolution
      '@': './src',
    },
  },

  // Improve file watching and hot reload stability
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce file watching to prevent ENOENT errors
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },

  // Disable some features that can cause file system conflicts during development
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },

  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
