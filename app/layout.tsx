import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';
import { ViewTransitions } from 'next-view-transitions'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ViewTransitions>
      <html lang="en" suppressHydrationWarning>
        <body className="flex flex-col min-h-screen">
          <RootProvider>{children}</RootProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
