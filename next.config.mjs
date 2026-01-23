import { createMDX } from "fumadocs-mdx/next";
import { join } from "node:path";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  serverExternalPackages: ["typescript", "twoslash"],
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    optimizePackageImports: ["@hugeicons/react"],
    serverSourceMaps: false,
  },
  turbopack: {
    root: join(import.meta.dirname),
  },
};

export default withMDX(config);
