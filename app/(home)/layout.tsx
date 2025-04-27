import { baseOptions } from "@/app/layout.config";
import Navbar from "@/components/ui/navbar/nav";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { Metadata } from "next";
import { Poppins } from "next/font/google";
import type { ReactNode } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
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
    <HomeLayout
      {...baseOptions}
      nav={{
        enabled: true,
        component: <Navbar />,
      }}
      className={`${poppins.className} py-0`}
    >
      {children}
    </HomeLayout>
  );
}
