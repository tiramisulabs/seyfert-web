import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import { GalaxyFallback } from "@/components/home/galaxy/galaxy-fallback";
import GalaxyCanvas from "@/components/home/galaxy/galaxy-canvas";
import SpiralSections from "./spiral-sections";

// Spiral landing — astrophotographic, editorial. Strict two-column hero: the
// copy owns the left column, the black hole owns the right. Hero text stays
// server-rendered (LCP); the WebGL canvas (client component, SSRs as an empty
// div) overlays the static fallback once it boots.
export function SpiralHome() {
    return (
        <main className="spiral-page flex flex-col">
            <div className="relative flex min-h-screen flex-col justify-center overflow-hidden">
                <GalaxyFallback />
                <GalaxyCanvas />

                {/* two-column editorial hero: text left, hole right */}
                <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 px-6 lg:grid-cols-[minmax(0,44rem)_1fr] lg:px-12">
                    <div className="flex flex-col items-start gap-8">
                        <div className={`${GeistMono.className} flex items-baseline gap-3 text-[11px] tracking-[0.25em] text-[var(--text-dim)]`}>
                            <span className="text-[var(--brand-indigo)]/80">SEYFERT</span>
                            <span>TYPESCRIPT FRAMEWORK FOR DISCORD · v4.3.0</span>
                        </div>

                        <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.04] xl:text-6xl">
                            A{" "}
                            <span className="animate-text-gradient bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                                supermassive core
                            </span>{" "}
                            <br className="hidden lg:block" />
                            for your Discord bot
                        </h1>

                        <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                            Seyfert is a TypeScript framework built around a small,
                            brutally efficient core — 84 MB under full gateway load,
                            type-safe end to end, ready to scale from your first
                            command to millions of guilds.
                        </p>

                        <div className="flex items-center gap-5">
                            <Link href="/guide">
                                <Button className="cursor-pointer gap-2 rounded-none bg-[var(--text-bright)] px-6 text-base font-medium text-[var(--space-void)] hover:bg-neutral-300">
                                    Get started
                                </Button>
                            </Link>
                            <Link
                                href="https://discord.gg/hEeJNaSqnS"
                                target="_blank"
                                className={`${GeistMono.className} text-xs tracking-[0.2em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline`}
                            >
                                DISCORD ↗
                            </Link>
                        </div>
                    </div>
                    {/* right column intentionally empty — the black hole lives here */}
                    <div aria-hidden className="hidden lg:block" />
                </div>

                <div className={`${GeistMono.className} absolute bottom-8 left-6 z-10 text-[10px] tracking-[0.3em] text-[var(--text-dim)]/70 lg:left-12`}>
                    SCROLL INTO THE CORE ↓
                </div>
            </div>

            <div className="relative mx-auto mt-16 w-full max-w-xs space-y-32 sm:max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
                <SpiralSections />
            </div>
        </main>
    );
}
