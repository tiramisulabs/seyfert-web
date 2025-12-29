import { RootProvider } from "fumadocs-ui/provider/next";
import { Metadata } from "next";
import type { ReactNode } from "react";
import "./global.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://seyfert.dev'),
  title: "Seyfert | The Black Magic Framework",
  description: 'Powerful Discord Bots Made Simple with Seyfert',
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
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
