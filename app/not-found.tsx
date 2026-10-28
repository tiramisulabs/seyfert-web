import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";
import { CAP, STROKE, WORD_PATH, WORD_W } from "@/components/home/reveal/wordmark";

export const metadata: Metadata = {
    // absolute: the blog layout's title template would append its own name
    title: { absolute: "Page not found | Seyfert" },
};

// Every unmatched URL and every notFound() lands here, either bare or inside
// the layout above the segment that threw (the home layout already has a
// <main>), so this is a section that carries the landing's tokens itself:
// the void, the grain and the drawn wordmark, reduced to an outline.
export default function NotFound() {
    return (
        <section aria-labelledby="not-found-title" className={cn(GeistSans.className, "spiral-page reveal-page relative flex min-h-svh flex-col items-center justify-center gap-10 overflow-hidden px-5 py-24 text-center")}>
            <div aria-hidden className="core-glow absolute left-1/2 top-[40%] size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15 blur-2xl" />
            <svg aria-hidden viewBox={`0 0 ${WORD_W} ${CAP}`} className="relative h-auto w-[min(72vw,560px)] overflow-visible">
                <clipPath id="not-found-cap"><rect width={WORD_W} height={CAP} /></clipPath>
                <path d={WORD_PATH} clipPath="url(#not-found-cap)" fill="none" stroke="#ffd9a0" strokeOpacity={0.35} strokeWidth={STROKE} strokeLinejoin="miter" strokeMiterlimit={8} />
            </svg>
            <div className="relative flex max-w-[44ch] flex-col items-center gap-4">
                <span className={cn(GeistMono.className, "text-xs tracking-[0.35em] text-[var(--text-dim)]")}>404</span>
                <h1 id="not-found-title" className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Page not found</h1>
                <p className="text-pretty text-base text-[var(--text-dim)]">
                    Nothing lives at this address. If you followed a docs link, the page may have moved when the guides were reorganised.
                </p>
            </div>
            <div className="relative flex flex-wrap items-center justify-center gap-3.5">
                <Link href="/docs/learn/getting-started" className="inline-flex h-11 items-center bg-[#f8f1e4] px-8 text-sm font-semibold text-[var(--space-void)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]">
                    Read the docs
                </Link>
                <Link href="/" className={cn(GeistMono.className, "inline-flex h-11 items-center border border-white/15 px-8 text-xs tracking-[0.22em] text-[var(--text-bright)] transition-colors hover:border-[var(--brand-indigo)] hover:bg-[var(--brand-indigo)]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]")}>
                    BACK HOME
                </Link>
            </div>
        </section>
    );
}
