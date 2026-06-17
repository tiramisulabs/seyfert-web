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
        destination: "/docs/learn/getting-started",
        permanent: true,
      },
      {
        source: "/guide/:slug*",
        destination: "/docs/:slug*",
        permanent: true,
      },
      {
        source: "/docs",
        destination: "/docs/learn/getting-started",
        permanent: true,
      },
      {
        source: "/docs/learn",
        destination: "/docs/learn/getting-started",
        permanent: true,
      },
      {
        source: "/docs/tips/ecosystem",
        destination: "/docs/plugins/using/ecosystem",
        permanent: true,
      },
      {
        source: "/docs/recipes/creating-plugins",
        destination: "/docs/plugins/building/creating-plugins",
        permanent: true,
      },
      {
        source: "/docs/plugins",
        destination: "/docs/plugins/using",
        permanent: true,
      },
      {
        source: "/docs/plugins/ecosystem",
        destination: "/docs/plugins/using/ecosystem",
        permanent: true,
      },
      ...building.map((s) => ({
        source: `/docs/plugins/${s}`,
        destination: `/docs/plugins/building/${s}`,
        permanent: true,
      })),
      ...learn.map((s) => ({
        source: `/docs/${s}/:slug*`,
        destination: `/docs/learn/${s}/:slug*`,
        permanent: true,
      })),
    ];
  },
};

export default withMDX(config);
