"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import { ArmLabel } from "./arm-label";

// FINALE — the journey's last two beats fused into one composition:
// (04) the open-source observation, read off as live data, then the arrival at
// the core. Stays a client component so the GitHub fetch effect can run; the
// surrounding whileInView reveal is applied externally by the page's <Arm>.

interface Contributor {
    avatar_url: string;
    login: string;
}

interface Stats {
    stars: number;
    contributors: Contributor[];
}

// Same fetch approach as the original github.tsx: parallel repo + contributors
// requests, 1h revalidate, graceful zero-state on any failure.
async function getGithubStats(repository: string): Promise<Stats> {
    try {
        const [repoResponse, contributorsResponse] = await Promise.all([
            fetch(`https://api.github.com/repos/${repository}`, {
                next: { revalidate: 3600 },
            }),
            fetch(`https://api.github.com/repos/${repository}/contributors`, {
                next: { revalidate: 3600 },
            }),
        ]);

        if (!repoResponse.ok || !contributorsResponse.ok) {
            return { stars: 0, contributors: [] };
        }

        const repoData = await repoResponse.json();
        const contributorsData = await contributorsResponse.json();

        return {
            stars: repoData.stargazers_count ?? 0,
            contributors: (contributorsData as Contributor[]) ?? [],
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return { stars: 0, contributors: [] };
    }
}

export default function Finale({ repository }: { repository: string }) {
    const [stats, setStats] = useState<Stats>({ stars: 0, contributors: [] });

    useEffect(() => {
        let active = true;
        getGithubStats(repository).then((data) => {
            if (active) setStats(data);
        });
        return () => {
            active = false;
        };
    }, [repository]);

    const contributors = stats.contributors.slice(0, 9);

    return (
        <section className="flex flex-col gap-28">
            {/* ── 04 · OPEN SOURCE — observed as data ── */}
            <div className="flex flex-col gap-12">
                <ArmLabel index="04" name="Open source" />

                <div className="grid grid-cols-12 items-end gap-y-12">
                    {/* oversized mono star figure */}
                    <div className="col-span-12 flex flex-col gap-3 md:col-span-7 lg:col-span-6">
                        <Link
                            href={`https://github.com/${repository}`}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex flex-col gap-3"
                        >
                            <span className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]`}>
                                Stargazers · live
                            </span>
                            <span className={`${GeistMono.className} text-7xl font-medium leading-none tracking-[-0.04em] text-[var(--text-bright)] transition-colors duration-300 group-hover:text-[var(--brand-indigo)] sm:text-8xl`}>
                                {stats.stars.toLocaleString()}
                            </span>
                            <span className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)] underline-offset-4 group-hover:text-[var(--text-bright)] group-hover:underline`}>
                                github.com/{repository} ↗
                            </span>
                        </Link>
                    </div>

                    {/* contributors — tight avatar strip, offset into its own column */}
                    <div className="col-span-12 flex flex-col gap-5 md:col-span-5 md:col-start-8 lg:col-span-4 lg:col-start-9">
                        <div className="flex items-baseline gap-3">
                            <span className={`${GeistMono.className} text-3xl font-medium tracking-[-0.03em] text-[var(--text-bright)]`}>
                                {contributors.length}
                                <span className="text-[var(--brand-indigo)]">+</span>
                            </span>
                            <span className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]`}>
                                Contributors
                            </span>
                        </div>

                        <Link
                            href={`https://github.com/${repository}/graphs/contributors`}
                            target="_blank"
                            rel="noreferrer"
                            className="-ml-1 flex flex-wrap"
                            aria-label="View all contributors"
                        >
                            {contributors.map((c, i) => (
                                <motion.span
                                    key={c.login}
                                    whileHover={{ scale: 1.12, y: -3, zIndex: 10 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    className="relative -ml-1 block"
                                    style={{ zIndex: contributors.length - i }}
                                >
                                    <Image
                                        src={c.avatar_url}
                                        alt={c.login}
                                        width={36}
                                        height={36}
                                        unoptimized
                                        className="size-9 max-w-none rounded-full border border-[var(--space-void)] grayscale transition-[filter] duration-300 hover:grayscale-0"
                                    />
                                </motion.span>
                            ))}
                        </Link>

                        <p className={`${GeistMono.className} text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]/60`}>
                            Read · review · contribute
                        </p>
                    </div>
                </div>
            </div>

            {/* hairline before the arrival */}
            <div className="border-t border-white/8" aria-hidden />

            {/* ── THE CORE — arrival ── */}
            <div className="relative flex flex-col items-center gap-7 overflow-hidden py-16 text-center">
                <div
                    className="core-glow animate-spiral-pulse pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90"
                    aria-hidden
                />

                <div className={`${GeistMono.className} relative text-[10px] uppercase tracking-[0.3em] text-[var(--text-dim)]`}>
                    CORE · 0 PC FROM CENTER
                </div>

                <h2 className="relative max-w-2xl text-4xl font-semibold leading-[1.05] tracking-[-0.02em] sm:text-5xl">
                    Ignite{" "}
                    <span className="animate-text-gradient bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">your core</span>
                </h2>

                <p className="relative max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                    You made it through the arms. Start building at the center.
                </p>

                <div className="relative flex items-center gap-5">
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
        </section>
    );
}