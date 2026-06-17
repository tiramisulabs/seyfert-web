import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
/**
 * Shared layout configurations
 *
 * you can configure layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */

export const baseOptions: BaseLayoutProps = {
  nav: {
    url: '/',
    title: (
      <>
        <Image
          src="/logo.svg"
          alt="Seyfert Logo"
          width={28}
          height={28}
          className="size-7 shrink-0 rounded-md object-contain"
          priority
        />
        <span className="text-[17px] font-semibold tracking-tight text-fd-foreground">
          Seyfert
        </span>
      </>
    ),
  },
  links: [],
};
