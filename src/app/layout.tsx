import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Header from "@/components/common/header";

const font = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seyfert | Discord library",
  description: "Interact Discord API your way",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={font.className}>
        <Providers>
          <Header />
          <div className="p-12 lg:p-40">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
