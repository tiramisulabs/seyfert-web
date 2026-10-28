"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/archive/chad/src/components/ui/button";
import { NavMenu } from "./nav-menu";
import { ArchiveMobileMenu } from "@/components/ui/navbar/archive-mobile-menu";
import Image from "next/image";
import logo from "@/public/logo.svg";
import { HugeiconsIcon } from "@hugeicons/react";
import { Github01Icon } from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { config } from "@/components/archive/chad/src/app.config";
const SCROLL_THRESHOLD = 50;


export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  // archive: this landing was `/` when it shipped; it now lives at /chad
  const isHomePage = pathname === "/chad";

  useEffect(() => {
    const checkScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          checkScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    checkScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "p-3 z-50 transition-[background-color,border-radius,transform] duration-1000 motion-reduce:transition-none ease-out relative",
        "left-1/2 -translate-x-1/2",
        isHomePage ? "fixed" : "relative",
        isHomePage && isScrolled
          ? "w-[min(60rem,95vw)] top-3"
          : "w-full rounded-none top-0"
      )}
      style={{
        width: isHomePage && isScrolled ? "min(60rem,95vw)" : "100%",
      }}
      aria-label="Navigation bar"
    >
      <div
        className={cn(
          "border backdrop-blur-xs bg-background/70 w-full h-full absolute top-0 left-0 -z-10",
          isHomePage && isScrolled ? "rounded-sm" : "rounded-none"
        )}
      />
      <div className="h-full flex items-center justify-between mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Seyfert" className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">
            <div className="flex items-center">
              <Image src={logo} alt="" width={32} height={32} />
              <span className="text-2xl font-bold">eyfert</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block" />
        </div>

        <div className="flex items-center gap-3">
          <ArchiveMobileMenu />
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex cursor-pointer focus-visible:outline-2 focus-visible:outline-current">
            <a href={`https://github.com/${config.repository}`} target="_blank" rel="noreferrer" aria-label="Seyfert on GitHub">
              <HugeiconsIcon icon={Github01Icon} className="w-5! h-5!" aria-hidden />
            </a>
          </Button>

          {/* <Button size="icon" variant="outline">
                        <SunIcon className="!w-5 !h-5" />
                    </Button> */}
        </div>
      </div>
    </nav>
  );
}
