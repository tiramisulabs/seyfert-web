import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { archiveMetadata } from "@/lib/design-archive";

// The v2 site (6c3b533) also used Inter on <body>; here it scopes
// to this route instead.
const inter = Inter({ subsets: ["latin"] });

export const metadata = archiveMetadata("v2");

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div className={inter.className}>
            {children}
        </div>
    );
}
