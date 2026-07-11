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
    const testingToolkit = [
      "mock-bot",
      "dispatching",
      "world",
      "assertions",
      "gateway",
      "fixtures",
      "defaults",
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
        destination: "/docs/plugins/official",
        permanent: true,
      },
      {
        source: "/docs/recipes/creating-plugins",
        destination: "/docs/plugins/building/creating-plugins",
        permanent: true,
      },
      {
        source: "/docs/recipes/cooldown",
        destination: "/docs/plugins/official/cooldown",
        permanent: true,
      },
      {
        source: "/docs/recipes/yuna",
        destination: "/docs/plugins/official/yuna",
        permanent: true,
      },
      {
        source: "/docs/plugins/ecosystem",
        destination: "/docs/plugins/official",
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
      {
        source: "/docs/learn/testing/:slug*",
        destination: "/docs/testing/writing-tests/:slug*",
        permanent: true,
      },
      ...testingToolkit.map((s) => ({
        source: `/docs/testing/${s}`,
        destination: `/docs/testing/toolkit/${s}`,
        permanent: true,
      })),
    ];
  },
};

export default withMDX(config);
