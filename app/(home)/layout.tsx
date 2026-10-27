import { baseOptions } from "@/app/layout.config";
import Navbar from "@/components/ui/navbar/nav";
import { SkipLink } from "@/components/ui/skip-link";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="home-page dark min-h-screen bg-home text-foreground">
      <SkipLink href="#main-content" />
      <HomeLayout
        {...baseOptions}
        nav={{
          enabled: true,
          component: <Navbar />,
        }}
        className={`${GeistSans.className} w-full max-w-none py-0`}
      >
        {/* fumadocs renders the navbar inside its <main>, so the skip link
            needs a target past it; the flex classes keep pages laid out as
            direct children of that main */}
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
      </HomeLayout>
    </div>
  );
}
