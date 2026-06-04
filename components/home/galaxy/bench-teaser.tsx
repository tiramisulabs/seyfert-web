import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";

// Luminosity, read like an instrument: a spectrometer-style plot of median
// memory under identical gateway load. Data from public/bench (medians).

const BARS = [
    { name: "seyfert", mb: 84, accent: true },
    { name: "eris", mb: 90, accent: false },
    { name: "detritus", mb: 111, accent: false },
    { name: "oceanic", mb: 119, accent: false },
    { name: "discord.js", mb: 206, accent: false },
] as const;

const MAX = 220; // plot ceiling, MB
const TICKS = [0, 55, 110, 165, 220] as const;

export function BenchTeaser() {
    return (
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
            {/* masthead — offset left rail */}
            <div className="flex flex-col gap-6 lg:col-span-4">
                <ArmLabel index="03" name="Luminosity" />
                <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em]">
                    Shine brighter,{" "}
                    <span className="text-[var(--brand-indigo)]">burn less</span>
                </h2>
                <Link
                    href="/benchmark"
                    className={`${GeistMono.className} text-[11px] tracking-[0.25em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline`}
                >
                    FULL MEASUREMENTS ↗
                </Link>
            </div>

            {/* the readout */}
            <div className="lg:col-span-8 lg:col-start-5">
                {/* tick scale */}
                <div className="relative mb-2 hidden sm:ml-28 sm:mr-16 sm:block">
                    <div className={`${GeistMono.className} flex justify-between text-[9px] tracking-[0.15em] text-[var(--text-dim)]/50`}>
                        {TICKS.map((t) => (
                            <span key={t}>{t}</span>
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between">
                        {TICKS.map((t) => (
                            <span key={t} className="h-1.5 w-px bg-white/15" />
                        ))}
                    </div>
                </div>

                <div className="flex flex-col">
                    {BARS.map((b) => (
                        <div key={b.name} className="group flex items-center gap-4 border-b border-white/8 py-4 first:border-t">
                            <span className={`${GeistMono.className} w-16 sm:w-24 shrink-0 text-right text-[11px] tracking-[0.1em] ${b.accent ? "text-[var(--brand-indigo)]" : "text-[var(--text-dim)]"}`}>
                                {b.name}
                            </span>
                            <div className="relative h-2 flex-1">
                                {/* faint full-scale track with tick marks */}
                                <div className="absolute inset-0 bg-white/[0.03]" />
                                <div
                                    className={
                                        b.accent
                                            ? "absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--brand-indigo)] to-[var(--brand-purple)]"
                                            : "absolute inset-y-0 left-0 bg-white/10 transition-colors duration-300 group-hover:bg-white/15"
                                    }
                                    style={{ width: `${(b.mb / MAX) * 100}%` }}
                                />
                            </div>
                            <span className={`${GeistMono.className} w-14 sm:w-16 shrink-0 text-[11px] tabular-nums ${b.accent ? "text-[var(--brand-indigo)]" : "text-[var(--text-dim)]/70"}`}>
                                {b.mb} MB
                            </span>
                        </div>
                    ))}
                </div>

                <div className={`${GeistMono.className} mt-3 flex items-center gap-3 text-[9px] tracking-[0.2em] text-[var(--text-dim)]/60`}>
                    <span className="text-[var(--brand-indigo)]">◆ THIS FRAMEWORK</span>
                    <span>MEDIAN RSS OF 24 SAMPLED RUNS · SAME GATEWAY WORKLOAD · NODE</span>
                    <Link href="/benchmark" className="underline-offset-2 hover:text-[var(--text-bright)] hover:underline">RAW DATA ↗</Link>
                </div>
            </div>
        </section>
    );
}
