"use client";

import { useRef } from "react";
import Link from "next/link";

export function ArchiveMobileMenu() {
    const ref = useRef<HTMLDetailsElement>(null);
    return (
        <details ref={ref} className="relative md:hidden" onKeyDown={(event) => {
            if (event.key === "Escape" && ref.current?.open) {
                ref.current.open = false;
                ref.current.querySelector("summary")?.focus();
            }
        }}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current [&::-webkit-details-marker]:hidden">
                Menu
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 min-w-44 border border-border bg-background p-2 shadow-lg">
                {[["Guide", "/guide"], ["Blog", "/blog"], ["Benchmark", "/benchmark"]].map(([label, href]) => (
                    <Link key={href} href={href} onClick={() => { if (ref.current) ref.current.open = false; }} className="flex min-h-11 items-center px-3 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-current">
                        {label}
                    </Link>
                ))}
            </div>
        </details>
    );
}
