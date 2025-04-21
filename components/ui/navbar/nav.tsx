"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NavMenu } from "./nav-menu";
import Image from "next/image";
import logo from "@/public/logo.svg";
import { Github01Icon } from "hugeicons-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

const SCROLL_THRESHOLD = 50;

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
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
    setIsLoaded(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!isLoaded) return null;

  return (
    <nav
      className={cn(
        "p-3 z-50 transition-all duration-1000 ease-out relative",
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
          <Link href="/">
            <div className="flex items-center">
              <Image src={logo} alt="Logo" width={32} height={32} />
              <h1 className="text-2xl font-bold">eyfert</h1>
            </div>
          </Link>

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block" />
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://github.com/${globalThis.appConfig.repository}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex cursor-pointer"
            >
              <Github01Icon className="!w-5 !h-5 " />
            </Button>
          </a>

          {/* <Button size="icon" variant="outline">
                        <SunIcon className="!w-5 !h-5" />
                    </Button> */}
        </div>
      </div>
    </nav>
  );
}
