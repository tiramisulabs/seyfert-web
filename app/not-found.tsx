import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
import { EventHorizon } from "@/components/not-found/event-horizon";

export const metadata: Metadata = {
    // absolute: the blog layout's title template would append its own name
    title: { absolute: "Page not found | Seyfert" },
};

// Every unmatched URL and every notFound() lands here, either bare or inside
// the layout above the segment that threw (the home layout already has a
// <main>), so this is a section that carries the landing's tokens itself:
// the void, the grain and the black hole, which swallows the address.
export default function NotFound() {
    return (
        <section aria-labelledby="not-found-title" className={cn(GeistSans.className, "spiral-page reveal-page relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden px-5 py-16 text-center")}>
            <EventHorizon />
            <div className="relative flex flex-wrap items-center justify-center gap-4">
                <Link href="/docs/learn/getting-started" className="inline-flex h-11 items-center bg-[var(--core-white)] px-8 text-sm font-semibold text-[var(--space-void)] transition-colors hover:bg-[var(--core-amber)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--core-white)]">
                    Read the docs
                </Link>
                <Link href="/" className={cn(GeistMono.className, "inline-flex h-11 items-center border border-white/15 px-8 text-[13px] text-[var(--text-bright)] transition-colors hover:border-white/30 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--core-white)]")}>
                    Back home
                </Link>
            </div>
        </section>
    );
}
