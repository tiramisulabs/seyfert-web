import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ['typescript', 'twoslash'],
  productionBrowserSourceMaps: false,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    optimizePackageImports: ['hugeicons-react'],
    serverSourceMaps: false,
  }
};

export default withMDX(config);
