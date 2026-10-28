import { RootProvider } from "fumadocs-ui/provider/next";
import { Metadata } from "next";
import type { ReactNode } from "react";
import { REVEAL_MODE_SCRIPT } from "@/components/home/reveal/seen";
import "./global.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://seyfert.dev'),
  title: "Seyfert | The TypeScript framework for Discord",
  description: "Build TypeScript Discord bots with fully typed commands, less boilerplate and a faster way to get started.",
  openGraph: {
    images: {
        type: 'image/png',
        url: './opengraph-image.png'
    },
    type: 'website'
}
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: REVEAL_MODE_SCRIPT }} />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider search={{ preload: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
