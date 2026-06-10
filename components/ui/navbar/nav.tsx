"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavMenu } from "./nav-menu";
import Image from "next/image";
import logo from "@/public/logo.svg";
import { HugeiconsIcon } from "@hugeicons/react";
import { Github01Icon } from "@hugeicons/core-free-icons";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { config } from "@/app.config";
const SCROLL_THRESHOLD = 50;


export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

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
        // explicit property list (never transition-all) + reduced-motion off
        "p-3 z-50 transition-[width,top] duration-500 ease-out relative motion-reduce:transition-none",
        "left-1/2 -translate-x-1/2",
        isHomePage ? "fixed" : "relative",
        isHomePage && isScrolled
          ? "w-[min(60rem,95vw)] top-3"
          : "w-full rounded-none top-0"
      )}
      aria-label="Navigation bar"
    >
      {/* no backdrop-blur: blurring the 60fps hero canvas underneath costs a
          full nav-strip blur every frame, and behind ~95% opacity it was
          invisible anyway */}
      <div
        className={cn(
          "border bg-background/95 w-full h-full absolute top-0 left-0 -z-10",
          isHomePage && isScrolled ? "rounded-sm" : "rounded-none"
        )}
      />
      <div className="h-full flex items-center justify-between mx-auto px-4 sm:px-6 relative">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/">
            <div className="flex items-center">
              <Image src={logo} alt="Seyfert" width={32} height={32} />
              <h1 className="hidden text-2xl font-bold sm:block">eyfert</h1>
            </div>
          </Link>

          {/* Desktop Menu */}
          <NavMenu />
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="inline-flex cursor-pointer"
          >
            <a
              href={`https://github.com/${config.repository}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Seyfert on GitHub"
            >
              <HugeiconsIcon icon={Github01Icon} className="w-5! h-5! " aria-hidden />
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
