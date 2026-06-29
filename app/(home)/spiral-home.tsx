import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import GalaxyCanvas from "@/components/home/galaxy/galaxy-canvas";
import GalaxyLite from "@/components/home/galaxy/galaxy-lite";
import { CoreDistance } from "@/components/home/galaxy/core-distance";
import SpiralSections from "./spiral-sections";
import { config } from "@/app.config";
import { getRepoStats } from "@/lib/github";
import { InstallPill } from "@/components/home/galaxy/install-pill";

// Spiral landing — v5 "Cygnus". Centered cinematic hero: the SEYFERT wordmark
// coexists with the black hole, which is now centered behind it (the disk wraps
// the type). Hero copy stays server-rendered (LCP); the WebGL canvas (client
// component, SSRs as an empty div) overlays the static fallback once it boots.
export async function SpiralHome() {
    const stats = await getRepoStats(config.repository);
    return (
        <main className="spiral-page flex flex-col">
            <div className="relative flex min-h-screen flex-col justify-center overflow-hidden">
                <GalaxyCanvas />
                <GalaxyLite />

                {/* v5 "Cygnus" hero — SEYFERT carved into and wrapped by the
                     black hole, centered. Mission-patch codename, lit-metal
                     wordmark, tight vignette so the disk still licks the type. */}
                <div className="relative z-10 mx-auto flex w-full max-w-3xl translate-y-[4vh] flex-col items-center gap-[3.25rem] px-7 text-center">
                    <div
                        aria-hidden
                        className="absolute left-1/2 top-[44%] -z-10 h-[90%] w-[150%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(3,5,11,0.58)_14%,rgba(3,5,11,0.2)_42%,transparent_66%)]"
                    />

                    {/* one tight lockup: codename → wordmark → descriptor */}
                    <div className="flex flex-col items-center gap-5">
                        <span
                            className={`${GeistMono.className} flex items-center gap-2.5 rounded-[3px] border border-[#cbb894]/65 bg-[rgba(5,8,14,0.62)] px-3.5 py-[7px] text-[12px] font-medium tracking-[0.32em] text-[#fbf2da] shadow-[0_0_18px_rgba(203,184,148,0.16)] [text-shadow:0_1px_10px_rgba(0,0,0,0.95)] backdrop-blur-[2px]`}
                        >
                            <svg
                                viewBox="0 0 44 22"
                                fill="none"
                                aria-hidden
                                className="h-[1em] w-auto [filter:drop-shadow(0_0_4px_rgba(240,207,140,0.45))]"
                            >
                                <g
                                    stroke="#f0cf8c"
                                    strokeWidth="1.1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M4 15 L22 11 L40 6 M22 11 L21 3 M22 11 L19 20" />
                                </g>
                                <circle cx="40" cy="6" r="2" fill="#f8eed2" />
                                <circle
                                    cx="22"
                                    cy="11"
                                    r="1.3"
                                    fill="#f0cf8c"
                                />
                            </svg>
                            CYGNUS-X · V5
                        </span>

                        <div className="relative">
                            <h1 className="relative bg-[linear-gradient(125deg,#f2d7a6_0%,#fff3d8_27%,#ffffff_39%,#eef2f7_49%,#d6dce5_78%,#c9d0da_100%)] bg-clip-text font-semibold uppercase leading-[0.92] tracking-[0.14em] text-transparent text-6xl [filter:drop-shadow(0_3px_22px_rgba(0,0,0,0.9))] sm:text-8xl lg:text-[8rem]">
                                Seyfert
                            </h1>
                            {/* Artemis-style trajectory — a fine gold swoosh raking
                                 across the wordmark, reading as light on the metal */}
                            <svg
                                viewBox="0 0 600 200"
                                preserveAspectRatio="none"
                                fill="none"
                                aria-hidden
                                className="pointer-events-none absolute -inset-x-10 -inset-y-7 -z-10 h-[calc(100%+3.5rem)] w-[calc(100%+5rem)] overflow-visible mix-blend-screen"
                            >
                                <defs>
                                    <linearGradient
                                        id="art-swoosh"
                                        x1="0"
                                        y1="1"
                                        x2="1"
                                        y2="0"
                                    >
                                        <stop
                                            offset="0"
                                            stopColor="#f0cf8c"
                                            stopOpacity="0"
                                        />
                                        <stop
                                            offset="0.38"
                                            stopColor="#f6dca0"
                                            stopOpacity="0.85"
                                        />
                                        <stop
                                            offset="0.7"
                                            stopColor="#fff1d4"
                                            stopOpacity="1"
                                        />
                                        <stop
                                            offset="1"
                                            stopColor="#ffffff"
                                            stopOpacity="0"
                                        />
                                    </linearGradient>
                                    <filter
                                        id="art-blur"
                                        x="-15%"
                                        y="-70%"
                                        width="130%"
                                        height="240%"
                                    >
                                        <feGaussianBlur stdDeviation="5" />
                                    </filter>
                                </defs>
                                <path
                                    d="M2 158 C176 230 440 -34 600 48"
                                    stroke="url(#art-swoosh)"
                                    strokeWidth="13"
                                    strokeLinecap="round"
                                    opacity="0.5"
                                    filter="url(#art-blur)"
                                />
                                <path
                                    d="M2 158 C176 230 440 -34 600 48"
                                    stroke="url(#art-swoosh)"
                                    strokeWidth="2.6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>

                        <span className="relative isolate">
                            <span
                                aria-hidden
                                className="absolute left-1/2 top-1/2 -z-10 h-[320%] w-[120%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(4,6,12,0.82)_28%,rgba(4,6,12,0.4)_52%,transparent_74%)]"
                            />
                            <span
                                className={`${GeistMono.className} text-[12px] tracking-[0.3em] text-[#f6f9fc] [text-shadow:0_1px_16px_rgba(0,0,0,0.98)]`}
                            >
                                THE TYPESCRIPT FRAMEWORK FOR DISCORD
                            </span>
                        </span>
                    </div>

                    <div className="relative flex flex-col items-center gap-5">
                        {/* a quieting pedestal so the CTAs lock the eye instead of
                             competing with the starfield behind them */}
                        <div
                            aria-hidden
                            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[250%] w-[135%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(7,9,15,0.7)_20%,rgba(7,9,15,0.3)_50%,transparent_72%)]"
                        />
                        <div className="flex items-center gap-3.5">
                            <Button
                                asChild
                                className="group h-10 cursor-pointer gap-2 rounded-none bg-[#f8f1e4] px-12 text-sm font-semibold text-[var(--space-void)] shadow-[0_0_34px_8px_rgba(240,206,142,0.36)] transition-all hover:bg-white hover:shadow-[0_0_48px_13px_rgba(240,206,142,0.52)]"
                            >
                                <Link href="/docs/learn/getting-started">
                                    Get started
                                    <ArrowRight
                                        aria-hidden
                                        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                    />
                                </Link>
                            </Button>
                            <Link
                                href="https://discord.gg/hEeJNaSqnS"
                                target="_blank"
                                className={`${GeistMono.className} group flex h-10 items-center gap-2 rounded-none border border-[#cfb67c] bg-[rgba(12,14,22,0.85)] px-10 text-xs font-medium tracking-[0.22em] text-[#f3eacf] shadow-[0_0_18px_rgba(207,182,124,0.12)] backdrop-blur-[3px] transition-colors hover:border-[#8b96f0] hover:bg-[rgba(88,101,242,0.24)] hover:text-white`}
                            >
                                DISCORD{" "}
                                <span
                                    aria-hidden
                                    className="inline-block translate-y-[1px] transition-transform group-hover:translate-x-0.5"
                                >
                                    ↗
                                </span>
                            </Link>
                        </div>
                        <InstallPill />
                    </div>
                </div>

                <div
                    className={`${GeistMono.className} absolute bottom-8 left-6 z-10 text-[10px] tracking-[0.3em] text-[var(--text-dim)]/70 lg:left-12`}
                >
                    SCROLL INTO THE CORE · IT’S SAFE ↓
                </div>
            </div>

            <div className="relative mx-auto mt-16 w-full max-w-md space-y-32 px-5 sm:max-w-md sm:px-0 md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
                <SpiralSections stats={stats} />
            </div>

            {/* the dive, instrumented: scroll progress as distance in rs */}
            <CoreDistance />
        </main>
    );
}
