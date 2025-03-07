import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    // can be JSX too!
    title: 'Seyfert',
  },
  links: [
    {
      text: 'Guide',
      url: '/guide',
      active: 'nested-url',
    },
    {
      text: 'API Reference',
      url: '/docs',
      active: 'nested-url',
    },
  ],
};
