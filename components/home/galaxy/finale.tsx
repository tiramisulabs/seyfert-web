"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import { ArmLabel } from "./arm-label";
import type { RepoStats } from "@/lib/github";

// FINALE — the journey's last two beats fused into one composition:
// (04) the open-source observation, read off as live data, then the arrival at
// the core. Stats arrive as props from the server (single cached GitHub fetch
// in lib/github); this stays a client component only for the avatar-group
// hover (transitions.dev 11: distance-falloff lift, bouncy spring on return).
// The surrounding whileInView reveal is applied externally by the page's <Arm>.

export default function Finale({
    repository,
    stats,
}: {
    repository: string;
    stats: RepoStats;
}) {
    const contributors = stats.contributors.slice(0, 9);
    const stripRef = useRef<HTMLAnchorElement>(null);

    // transitions.dev avatar-group orchestration: the timing-function is set
    // inline BEFORE the variable writes so hover-in gets the clean ease and
    // mouseleave gets the overshoot spring on the same property.
    const setShifts = (activeIdx: number | null, phase: "in" | "out") => {
        if (!stripRef.current) return;
        const cs = getComputedStyle(document.documentElement);
        const num = (name: string, fb: number) => {
            const v = parseFloat(cs.getPropertyValue(name));
            return Number.isFinite(v) ? v : fb;
        };
        const ease = (name: string, fb: string) =>
            cs.getPropertyValue(name).trim() || fb;

        const lift = num("--avatar-lift", -4);
        const falloff = num("--avatar-falloff", 0.45);
        const scale = num("--avatar-scale", 1.05);
        const tf =
            phase === "out"
                ? ease("--avatar-ease-out", "cubic-bezier(0.34, 3.85, 0.64, 1)")
                : ease("--avatar-ease-in", "cubic-bezier(0.22, 1, 0.36, 1)");

        stripRef.current
            .querySelectorAll<HTMLElement>(".t-avatar")
            .forEach((el, i) => {
                el.style.transitionTimingFunction = tf;
                if (activeIdx == null) {
                    el.style.setProperty("--shift", "0px");
                    el.style.setProperty("--scale-active", "1");
                    return;
                }
                const d = Math.abs(i - activeIdx);
                el.style.setProperty(
                    "--shift",
                    (lift * Math.pow(falloff, d)).toFixed(3) + "px",
                );
                el.style.setProperty(
                    "--scale-active",
                    i === activeIdx ? String(scale) : "1",
                );
            });
    };

    return (
        <section className="flex flex-col gap-14">
            {/* ── 04 · OPEN SOURCE — observed as data ── */}
            <div className="flex flex-col gap-12">
                <ArmLabel index="06" name="Open source" />

                <div className="grid grid-cols-12 items-end gap-y-12">
                    {/* oversized mono star figure */}
                    <div className="col-span-12 flex flex-col gap-3 md:col-span-7 lg:col-span-6">
                        <Link
                            href={`https://github.com/${repository}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex flex-col gap-3"
                        >
                            <span
                                className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]`}
                            >
                                Stargazers · live
                            </span>
                            <span
                                className={`${GeistMono.className} text-6xl font-medium leading-none tracking-[-0.04em] text-[var(--text-bright)] transition-colors duration-300 group-hover:text-[var(--brand-indigo)] sm:text-7xl md:text-8xl`}
                            >
                                {stats.stars.toLocaleString()}
                            </span>
                            <span
                                className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)] underline-offset-4 group-hover:text-[var(--text-bright)] group-hover:underline`}
                            >
                                github.com/{repository} <span aria-hidden>↗</span>
                            </span>
                        </Link>
                    </div>

                    {/* contributors — tight avatar strip, offset into its own column */}
                    <div className="col-span-12 flex flex-col gap-5 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
                        <div className="flex items-baseline gap-3">
                            <span
                                className={`${GeistMono.className} text-3xl font-medium tracking-[-0.03em] text-[var(--text-bright)]`}
                            >
                                {contributors.length}
                                <span className="text-[var(--brand-indigo)]">
                                    +
                                </span>
                            </span>
                            <span
                                className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]`}
                            >
                                Contributors
                            </span>
                        </div>

                        <Link
                            ref={stripRef}
                            href={`https://github.com/${repository}/graphs/contributors`}
                            target="_blank"
                            rel="noreferrer"
                            className="-ml-1 flex flex-wrap"
                            aria-label="View all contributors"
                            onMouseLeave={() => setShifts(null, "out")}
                        >
                            {contributors.map((c, i) => (
                                <span
                                    key={c.login}
                                    className="t-avatar relative -ml-1 block"
                                    style={{ zIndex: contributors.length - i }}
                                    onMouseEnter={() => setShifts(i, "in")}
                                >
                                    <Image
                                        src={c.avatar_url}
                                        alt={c.login}
                                        width={36}
                                        height={36}
                                        unoptimized
                                        className="size-9 max-w-none rounded-full border border-[var(--space-void)] grayscale transition-[filter] duration-300 hover:grayscale-0"
                                    />
                                </span>
                            ))}
                        </Link>

                        <p
                            className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]/60`}
                        >
                            Read · review · contribute
                        </p>
                    </div>
                </div>
            </div>

            {/* ── THE CORE — arrival, in silence. After the loud journey the
                 cosmos goes quiet: deep void, sparse stars, and a single thin
                 HORIZON LINE of warm light — the event already crossed, not
                 re-rendered. The stillness is the payoff. ── */}
            <div className="relative flex min-h-[42vh] flex-col overflow-hidden text-center pb-4">
                {/* sparse drifting starfield, much fainter than the hero's */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage:
                            "radial-gradient(rgba(244,239,230,0.5) 0.5px, transparent 0.5px), radial-gradient(rgba(200,216,240,0.3) 0.5px, transparent 0.5px)",
                        backgroundSize: "67px 67px, 113px 113px",
                        backgroundPosition: "0 0, 31px 47px",
                    }}
                    aria-hidden
                />

                {/* the horizon: a hairline of event-horizon light + soft bloom.
                     In normal flow (NOT absolute) so the breathing room between
                     the line and the copy below can never collapse, no matter
                     how tall the copy stack or how short the viewport. */}
                <div className="relative w-full" aria-hidden>
                    <div
                        className="mx-auto h-px w-[min(72rem,88vw)]"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(255,217,160,0.85) 35%, rgba(255,244,226,1) 50%, rgba(255,217,160,0.85) 65%, transparent)",
                        }}
                    />
                    <div
                        className="mx-auto -mt-3 h-7 w-[min(60rem,80vw)] blur-xl"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, rgba(255,217,160,0.28) 40%, rgba(255,217,160,0.4) 50%, rgba(255,217,160,0.28) 60%, transparent)",
                        }}
                    />
                </div>

                {/* arrival copy — centered in the remaining space, with a
                     guaranteed gap to the horizon above */}
                <div className="relative flex flex-1 flex-col items-center justify-center gap-7 pt-12">
                    <div
                        className={`${GeistMono.className} text-[10px] uppercase tracking-[0.32em] text-[var(--text-dim)]`}
                    >
                        CORE · 0 PC FROM CENTER
                    </div>

                    <h2 className="max-w-3xl text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.02em] sm:text-6xl">
                        Ready to build{" "}
                        <span className="text-[var(--brand-indigo)]">
                            your bot?
                        </span>
                    </h2>

                    <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                        You made it through the arms. The center is where you
                        start building.
                    </p>

                    <div className="mt-2 flex flex-col items-center gap-6">
                        <div className="flex items-center gap-5">
                            <Button
                                asChild
                                className="group cursor-pointer gap-2 rounded-none bg-[var(--text-bright)] px-6 text-base font-medium text-[var(--space-void)] hover:bg-neutral-300"
                            >
                                <Link href="/docs/learn/getting-started">
                                    Get started
                                    <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </Link>
                            </Button>
                            <Link
                                href="https://discord.gg/hEeJNaSqnS"
                                target="_blank"
                                className={`${GeistMono.className} text-xs tracking-[0.2em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline`}
                            >
                                DISCORD <span aria-hidden>↗</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
