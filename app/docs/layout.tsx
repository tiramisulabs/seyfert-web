import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import type { ReactNode } from 'react';
import { baseOptions } from '@/app/layout.config';
import { source } from '@/lib/source';
import { GeistSans } from "geist/font/sans";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={GeistSans.className}>
      <DocsLayout
        tree={source.pageTree}
        {...baseOptions}
        sidebar={{
          className: 'font-medium'
        }}
      >
        {children}
      </DocsLayout>
    </div>
  );
}
