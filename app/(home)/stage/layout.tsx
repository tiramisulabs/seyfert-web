import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// Unlisted: product demos built with the Stageshow kit, kept here until one
// earns a place on the home or in the docs.
export const metadata: Metadata = {
    title: "Seyfert | Stage",
    description: "Seyfert in its product: demo studies for the site.",
    robots: { index: false, follow: false },
};

export default function StageLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`spiral-page ${GeistSans.variable} ${GeistMono.variable} relative min-h-screen overflow-x-clip`}>
            <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-24 px-5 pb-40 pt-28">{children}</div>
        </div>
    );
}
