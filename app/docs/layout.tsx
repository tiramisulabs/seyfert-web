import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={inter.className}>
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{
          className: 'font-base'
        }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
