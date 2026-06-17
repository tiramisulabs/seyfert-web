"use client";

import { useState } from "react";
import Image from "next/image";
import { GeistMono } from "geist/font/mono";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArmLabel } from "./arm-label";

// Community bots as an accretion disc: matter in orbit around the active
// nucleus. Rings rotate at different periods (inner faster, like the real
// thing); selecting a bot surfaces its quote as an editorial pull-quote.

type Bot = {
    name: string;
    avatar: string;
    text: string;
    ring: 0 | 1 | 2; // 0 = inner
    angle: number; // fixed starting angle, degrees
};

const BOTS: Bot[] = [
    {
        name: "Listen",
        avatar: "/bots/thumbs/listen.webp",
        text: "After years of experience with Discord.js, Discordeno and Eris, Seyfert proved to be unmatched for large-scale music bots - dropping our RAM usage to under 1 GB (from almost 4 GB) while handling 200% more servers.",
        ring: 0, angle: 20,
    },
    {
        name: "CactusFire",
        avatar: "/bots/thumbs/cactusfire.webp",
        text: "We have been working with Discord.js & Discordeno for years, and yes... It's good, but for large scale bots... nothing better than Seyfert.",
        ring: 0, angle: 200,
    },
    {
        name: "Button Bot",
        avatar: "/bots/thumbs/buttonbot.gif",
        text: "Managing custom bots for our premium users was a major challenge—until we switched to Seyfert. It handled everything seamlessly, proving to be a powerful and reliable framework for large-scale bot deployments.",
        ring: 1, angle: 80,
    },
    {
        name: "Kenium",
        avatar: "/bots/thumbs/kenium.webp",
        text: "Seyfert provided every feature I wanted to develop a bot, while being the most resource-efficient I ever used.",
        ring: 1, angle: 190,
    },
    {
        name: "Stelle",
        avatar: "/bots/thumbs/stelle.webp",
        text: "Listening to your music with an open-source solution is always a good idea. Seyfert is the best solution for that.",
        ring: 1, angle: 310,
    },
    {
        name: "Multiversal",
        avatar: "/bots/thumbs/multiversal.webp",
        text: "Multiversal is a global chat bot, developed with Seyfert. Over time it has received recognition from numerous servers.",
        ring: 2, angle: 40,
    },
    {
        name: "Lumi",
        avatar: "/bots/thumbs/lumi.webp",
        text: "Developed with Seyfert for max optimization. I decided to change from discord.js to Seyfert because of its optimizations and light memory footprint.",
        ring: 2, angle: 150,
    },
    {
        name: "Hiraku Shinzou",
        avatar: "/bots/thumbs/hiraku.webp",
        text: "All my homies use Seyfert so that's why I use it too.",
        ring: 2, angle: 260,
    },
];

// ring radius as % of system size; period in seconds
const RINGS = [
    { radius: 26, period: 70 },
    { radius: 38, period: 110 },
    { radius: 49, period: 160 },
] as const;

export function Accretion() {
    const [active, setActive] = useState<Bot>(BOTS[0]);
    const reduceMotion = useReducedMotion();

    return (
        <section className="flex flex-col gap-12">
            {/* 03 — In orbit */}
            <div className="flex flex-col gap-4">
                <ArmLabel index="05" name="In orbit" />
                <h2 className="max-w-lg text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em]">
                    Production bots,{" "}
                    <span className="text-[var(--brand-indigo)]">in orbit</span>
                </h2>
                <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]">
                    Real bots, really shipped, all circling one core. Hover one to hear it from the team.
                </p>
            </div>

            <div className="grid items-center gap-x-12 gap-y-10 md:grid-cols-12">
                {/* orbital system — observatory plate */}
                <div className="orbit-system relative mx-auto hidden aspect-square w-full max-w-[460px] md:col-span-7 md:block">
                    {/* ticked elliptical guides + faint disc haze, drawn as one
                        crisp SVG plate behind the orbiting bodies. Radii match
                        RINGS exactly (viewBox 0–100, centre 50). */}
                    <svg
                        viewBox="0 0 100 100"
                        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                        aria-hidden
                    >
                        {/* faint accretion haze around the core */}
                        <defs>
                            <radialGradient id="orbit-haze" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(255,217,160,0.10)" />
                                <stop offset="40%" stopColor="rgba(180,104,60,0.05)" />
                                <stop offset="100%" stopColor="rgba(5,7,13,0)" />
                            </radialGradient>
                        </defs>
                        <circle cx="50" cy="50" r="50" fill="url(#orbit-haze)" />

                        {RINGS.map((r, ri) => (
                            <g key={ri}>
                                {/* dashed orbit line — finer + dimmer further out */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r={r.radius}
                                    fill="none"
                                    stroke="var(--text-dim)"
                                    strokeWidth={0.22}
                                    strokeOpacity={0.32 - ri * 0.06}
                                    strokeDasharray="0.8 2.4"
                                    strokeLinecap="round"
                                />
                                {/* 4 cardinal coordinate ticks crossing the ring */}
                                {[0, 90, 180, 270].map((deg) => {
                                    const a = (deg * Math.PI) / 180;
                                    const inner = r.radius - 1.1;
                                    const outer = r.radius + 1.1;
                                    return (
                                        <line
                                            key={deg}
                                            x1={50 + Math.cos(a) * inner}
                                            y1={50 + Math.sin(a) * inner}
                                            x2={50 + Math.cos(a) * outer}
                                            y2={50 + Math.sin(a) * outer}
                                            stroke="var(--core-amber)"
                                            strokeWidth={0.3}
                                            strokeOpacity={0.45 - ri * 0.08}
                                            strokeLinecap="round"
                                        />
                                    );
                                })}
                            </g>
                        ))}
                    </svg>

                    {/* nucleus — smaller, hotter core */}
                    <div
                        className="core-glow animate-spiral-pulse absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        aria-hidden
                    />
                    <div
                        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--core-white)] shadow-[0_0_14px_6px_rgba(255,217,160,0.7)]"
                        aria-hidden
                    />

                    {/* orbiting avatars: outer wrapper holds the fixed start
                        angle, .orbit-ring rotates, .orbit-item counter-rotates */}
                    {BOTS.map((b) => {
                        const r = RINGS[b.ring];
                        const selected = active.name === b.name;
                        return (
                            <div
                                key={b.name}
                                className="absolute left-1/2 top-1/2 h-0 w-0"
                                style={{ transform: `rotate(${b.angle}deg)` }}
                            >
                                <div className="orbit-ring" style={{ "--orbit-d": `${r.period}s` } as React.CSSProperties}>
                                    <div style={{ transform: `translateY(-${r.radius * 4.6}px)` }}>
                                        <button
                                            type="button"
                                            onMouseEnter={() => setActive(b)}
                                            onFocus={() => setActive(b)}
                                            className="orbit-item group/orbit -ml-[22px] -mt-[22px] block cursor-pointer rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]"
                                            style={{ "--orbit-d": `${r.period}s` } as React.CSSProperties}
                                            aria-label={b.name}
                                            aria-pressed={selected}
                                        >
                                            {/* premium selection state: amber ring +
                                                soft outer glow + smooth scale.
                                                max-w-none: Tailwind preflight's
                                                img{max-width:100%} collapses images
                                                inside the w-0 orbit anchor. */}
                                            <span
                                                className={`relative block rounded-full p-[2px] transition-transform duration-300 ease-out will-change-transform ${selected ? "scale-[1.18]" : "scale-100 group-hover/orbit:scale-110"}`}
                                            >
                                                {/* amber halo ring, fades in on select */}
                                                <span
                                                    aria-hidden
                                                    className={`pointer-events-none absolute -inset-[3px] rounded-full ring-1 transition-[box-shadow,--tw-ring-color] duration-300 ${selected
                                                        ? "ring-[var(--core-amber)] shadow-[0_0_22px_4px_rgba(255,217,160,0.4)]"
                                                        : "ring-transparent"
                                                        }`}
                                                />
                                                <Image
                                                    src={b.avatar}
                                                    alt={b.name}
                                                    width={44}
                                                    height={44}
                                                    unoptimized
                                                    className={`relative size-11 max-w-none rounded-full border transition-[opacity,border-color,filter] duration-300 ${selected
                                                        ? "border-[var(--core-amber)]/70 opacity-100 saturate-100"
                                                        : "border-white/15 opacity-55 saturate-[0.85] group-hover/orbit:opacity-90"
                                                        }`}
                                                />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* editorial pull-quote column */}
                <figure className="flex flex-col gap-7 md:col-span-5">
                    <div
                        aria-live="polite"
                        className="relative border-l-2 border-[var(--core-amber)]/60 pl-6"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                        <motion.blockquote
                            key={active.name}
                            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="text-xl font-medium leading-[1.45] tracking-[-0.01em] text-[var(--text-bright)] md:text-[1.45rem]"
                        >
                            {active.text}
                        </motion.blockquote>
                        </AnimatePresence>
                    </div>

                    {/* refined attribution — hairline + mono coordinates */}
                    <figcaption className="flex flex-col gap-3 border-t border-white/8 pt-5">
                        <div className="flex items-center gap-3">
                            <Image
                                src={active.avatar}
                                alt=""
                                width={28}
                                height={28}
                                unoptimized
                                className="size-7 max-w-none rounded-full border border-[var(--core-amber)]/40"
                            />
                            <span className={`${GeistMono.className} text-[11px] uppercase tracking-[0.22em] text-[var(--text-bright)]`}>
                                {active.name}
                            </span>
                            <span className={`${GeistMono.className} text-[10px] uppercase tracking-[0.22em] text-[var(--brand-indigo)]/80`}>
                                — running seyfert
                            </span>
                        </div>
                        <p className={`${GeistMono.className} text-[10px] uppercase tracking-[0.25em] text-[var(--text-dim)]/60`}>
                            Add yours — open a PR ↗
                        </p>
                    </figcaption>
                </figure>
            </div>

            {/* mobile: quiet horizontal strip instead of the orbital system */}
            <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 md:hidden">
                {BOTS.map((b) => (
                    <button
                        key={b.name}
                        type="button"
                        onClick={() => setActive(b)}
                        className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 transition-colors duration-300 ${active.name === b.name
                            ? "border-[var(--core-amber)]/60 bg-[var(--core-amber)]/5"
                            : "border-white/15"
                            }`}
                        aria-pressed={active.name === b.name}
                    >
                        <Image src={b.avatar} alt="" width={22} height={22} unoptimized className="size-[22px] max-w-none rounded-full" />
                        <span className={`text-xs ${active.name === b.name ? "text-[var(--text-bright)]" : "text-[var(--text-dim)]"}`}>
                            {b.name}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
