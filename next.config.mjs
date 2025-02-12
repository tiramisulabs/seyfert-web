import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
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
};

export default withMDX(config);
