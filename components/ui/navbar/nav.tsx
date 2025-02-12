'use client';
import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NavMenu } from "./nav-menu";
import { SunIcon } from "lucide-react";
import Image from "next/image";
import logo from "@/public/logo.svg";
import { Github01Icon } from 'hugeicons-react';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import Link from 'next/link';

const SCROLL_THRESHOLD = 50;

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            layout
            className={cn(
                "p-3 z-50 w-full transition-colors duration-200 bg-background/90 border",
                "left-1/2 -translate-x-1/2",
                isHomePage ? 'fixed' : 'relative'
            )}
            animate={{
                maxWidth: isHomePage && isScrolled ? '50rem' : '100%',
                borderRadius: isHomePage && isScrolled ? '10px' : '0px',
                top: isHomePage && isScrolled ? '1rem' : '0',
            }}
            transition={{
                duration: isHomePage ? 0.4 : 0,
                ease: [0.22, 1, 0.36, 1],
                type: "spring",
                stiffness: 120,
                damping: 25,
            }}
            aria-label="Navigation bar"
        >
            <div className="h-full flex items-center justify-between mx-auto px-4 sm:px-6">
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
                    <Button variant="default" className="hidden sm:inline-flex cursor-pointer">
                        <Github01Icon className="!w-4 !h-4" />
                    </Button>
                    <Button size="icon" variant="outline">
                        <SunIcon className="!w-4 !h-4" />
                    </Button>
                </div>
            </div>
        </motion.nav>
    );
};
