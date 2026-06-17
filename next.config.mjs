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
  async redirects() {
    const learn = ["getting-started", "commands", "components", "i18n", "tips"];
    const building = [
      "creating-plugins",
      "runtime-registration",
      "services-and-requirements",
      "runtime-hooks",
      "lifecycle-and-diagnostics",
    ];
    return [
      {
        source: "/guide",
        destination: "/guide/learn/getting-started",
        permanent: true,
      },
      {
        source: "/guide/learn",
        destination: "/guide/learn/getting-started",
        permanent: true,
      },
      {
        source: "/guide/tips/ecosystem",
        destination: "/guide/plugins/using/ecosystem",
        permanent: true,
      },
      {
        source: "/guide/recipes/creating-plugins",
        destination: "/guide/plugins/building/creating-plugins",
        permanent: true,
      },
      {
        source: "/guide/plugins",
        destination: "/guide/plugins/using",
        permanent: true,
      },
      {
        source: "/guide/plugins/ecosystem",
        destination: "/guide/plugins/using/ecosystem",
        permanent: true,
      },
      ...building.map((s) => ({
        source: `/guide/plugins/${s}`,
        destination: `/guide/plugins/building/${s}`,
        permanent: true,
      })),
      ...learn.map((s) => ({
        source: `/guide/${s}/:slug*`,
        destination: `/guide/learn/${s}/:slug*`,
        permanent: true,
      })),
    ];
  },
};

export default withMDX(config);
