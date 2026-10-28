import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { archiveMetadata } from "@/lib/design-archive";

// src/app/layout.tsx of the 2024 site used Inter on <body>; here it scopes
// to this route instead.
const inter = Inter({ subsets: ["latin"] });

export const metadata = archiveMetadata("original");

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div className={inter.className}>
            {children}
        </div>
    );
}
