import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import { GalaxyFallback } from "@/components/home/galaxy/galaxy-fallback";
import GalaxyCanvas from "@/components/home/galaxy/galaxy-canvas";
import { KirbyEgg } from "@/components/home/galaxy/kirby-egg";
import SpiralSections from "./spiral-sections";
import { config } from "@/app.config";
import { getRepoStats } from "@/lib/github";

// Spiral landing — astrophotographic, editorial. Strict two-column hero: the
// copy owns the left column, the black hole owns the right. Hero text stays
// server-rendered (LCP); the WebGL canvas (client component, SSRs as an empty
// div) overlays the static fallback once it boots.
export async function SpiralHome() {
    const stats = await getRepoStats(config.repository);
    return (
        <main className="spiral-page flex flex-col">
            <div className="relative flex min-h-screen flex-col justify-center overflow-hidden">
                <GalaxyFallback />
                <GalaxyCanvas />
                <KirbyEgg />

                {/* two-column editorial hero: text left, hole right */}
                <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 px-6 lg:grid-cols-[minmax(0,44rem)_1fr] lg:px-12">
                    <div className="flex flex-col items-start gap-8">
                        <div className={`${GeistMono.className} flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[11px] tracking-[0.25em] text-[var(--text-dim)]`}>
                            <span className="text-[var(--brand-indigo)]/80">SEYFERT</span>
                            <span>
                                TYPESCRIPT FRAMEWORK FOR DISCORD{" "}
                                <span className="whitespace-nowrap">· v4.3.0</span>
                            </span>
                        </div>

                        <h1 className="text-balance text-4xl font-semibold leading-[1.06] tracking-[-0.02em] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.04] xl:text-6xl">
                            Supermassive scale,{" "}
                            <br className="hidden lg:block" />
                            <span className="animate-text-gradient bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                                made simple.
                            </span>
                        </h1>

                        <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                            A TypeScript framework for Discord that gives you the
                            power without the pain. A tiny core does the heavy
                            lifting, and the compiler quietly catches your mistakes
                            before Discord ever sees them. First command to first
                            million guilds.
                        </p>

                        <div className="flex items-center gap-5">
                            <Link href="/guide">
                                <Button className="group cursor-pointer gap-2 rounded-none bg-[var(--text-bright)] px-6 text-base font-medium text-[var(--space-void)] hover:bg-neutral-300">
                                    Get started
                                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
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

                <div className={`${GeistMono.className} absolute bottom-8 left-16 z-10 text-[10px] tracking-[0.3em] text-[var(--text-dim)]/70 lg:left-12`}>
                    SCROLL INTO THE CORE · IT&apos;S SAFE ↓
                </div>
            </div>

            <div className="relative mx-auto mt-16 w-full max-w-xs space-y-32 sm:max-w-md md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
                <SpiralSections stats={stats} />
            </div>
        </main>
    );
}
