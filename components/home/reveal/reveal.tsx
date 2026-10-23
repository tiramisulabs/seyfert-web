"use client";

import { useCallback, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useScroll,
    useSpring,
    useTransform,
    type MotionValue,
} from "motion/react";
import GalaxyCanvas from "@/components/home/galaxy/galaxy-canvas";
import GalaxyLite from "@/components/home/galaxy/galaxy-lite";
import { CopyButton } from "@/components/home/galaxy/copy-button";
import { cn } from "@/lib/utils";
import { CAP, NUCLEUS, STROKE, WORD_MASK_URL, WORD_PATH, WORD_W } from "./wordmark";
import seyfertMemory from "@/public/bench/node/meadianseyfert.json";
import discordMemory from "@/public/bench/node/meadiandiscordjs.json";

// THE REVEAL — a trailer-style preview. The page is a sequence of pinned
// chapters; scroll is the playhead. It opens on the SEYFERT wordmark as a window
// onto the black hole: scrolling zooms through the F until you are inside
// the scene. Each chapter after that is scrubbed, not triggered — scroll
// back and it un-assembles.
//
// First pushed in f3bcdd1 (PR #40). Review refinements: a drawn
// wordmark (./wordmark.ts) instead of outlined Geist, an opening laid out by
// CSS with a captured first frame of the scene, a gliding playhead, and the
// fixed blended grain moved into the page background.

export type CodeLines = { c: string; k: string }[][];

const mono = GeistMono.className;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

// prefers-reduced-motion that hydrates as "no" (what the server rendered) and
// switches right after — motion's useReducedMotion reads the media query on
// the first client render, so reduced-motion visitors got a hydration error
// (pinned vs unpinned chapter heights don't match the server HTML)
const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeReduce(on: () => void) {
    const mq = window.matchMedia(REDUCE);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
}
function useReduce() {
    return useSyncExternalStore(subscribeReduce, () => window.matchMedia(REDUCE).matches, () => false);
}

// lg and up; the server renders the desktop layout (the chapter using it is
// far below the fold when React hydrates)
const WIDE = "(min-width: 1024px)";
function subscribeWide(on: () => void) {
    const mq = window.matchMedia(WIDE);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
}
function useWide() {
    return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => true);
}

export function RevealPage({ echo, djs, boot }: { echo: CodeLines; djs: CodeLines; boot: CodeLines }) {
    return (
        <div className="spiral-page reveal-page relative overflow-x-clip">
            <Opening />
            <OneFile lines={echo} />
            <Ceremony djs={djs} boot={boot} />
            <Memory />
            <Orbit />
            <Finale />
        </div>
    );
}

/* ── pinning ─────────────────────────────────────────────────────────── */

// A chapter: `height` of scroll track, one viewport pinned inside it, and
// the track's 0→1 progress handed to the stage. Reduced motion gets the
// final frame of every chapter, unpinned.
function Pin({ height, label, children }: { height: string; label: string; children: (p: MotionValue<number>, still: boolean) => ReactNode }) {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReduce();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const progress = useGlide(scrollYProgress);
    const done = useMotionValue(1);
    return (
        <section ref={ref} aria-label={label} className="relative" style={{ height: reduce ? "auto" : height }}>
            <div className={cn("overflow-hidden", reduce ? "relative min-h-svh py-24" : "sticky top-0 h-svh")}>
                {children(reduce ? done : progress, reduce)}
            </div>
        </section>
    );
}

// The playhead glides after the scrollbar instead of jumping with it. Scroll
// itself stays native; only the scrubbed scene eases toward it, so a wheel
// notch (100px, 4-8% of a chapter) plays as a short move, not a cut. A spring
// is a JS value, so this also keeps every chapter on the main-thread scrub:
// motion's native ScrollTimeline path drifted from the real progress here
// (opacity ~0.05 at p = 0.95).
function useGlide(v: MotionValue<number>) {
    return useSpring(v, { stiffness: 260, damping: 36, mass: 0.5, restDelta: 0.0005 });
}

/* ── 0 · the opening: through the wordmark ──────────────────────────── */

function Opening() {
    return <Pin height="240vh" label="Seyfert">{(p, still) => <OpeningStage p={p} still={still} />}</Pin>;
}

// Everything the first frame needs is server HTML sized by CSS: the drawn
// wordmark (no font to wait for), its plate, the plane and a painted stand-in
// for the black hole. Nothing here depends on measuring the viewport, so the
// opening doesn't shift when React hydrates or when WebGL arrives; the canvas
// only crossfades over a frame that was already complete.
const WORD_RATIO = WORD_W / CAP;
// where the word sits: centred, as wide as the screen allows without
// crowding a short landscape viewport
const wordVars = {
    "--word-w": "min(80vw, 150svh)",
    "--word-h": `calc(var(--word-w) / ${WORD_RATIO.toFixed(4)})`,
    // the nucleus (F stem on the plane) in stage coordinates
    "--ox": `calc(50% + ${(NUCLEUS.x / WORD_W - 0.5).toFixed(4)} * var(--word-w))`,
    "--oy": "50%",
    "--word-mask": WORD_MASK_URL,
} as CSSProperties;

function OpeningStage({ p, still }: { p: MotionValue<number>; still: boolean }) {
    // The dive: the word scales around the nucleus until it stops reading as
    // a word, then an iris opens from that same point and the plate is gone.
    // Spans are generous on purpose: at a 100px wheel notch on a 240vh track
    // the old 0.21→0.28 iris was a single notch, a cut rather than a move.
    const scale = useTransform(p, (v) => 1 + 5 * Math.pow(clamp01(v / 0.34), 2.2));
    const iris = useTransform(p, (v) => {
        const t = clamp01((v - 0.17) / 0.14);
        return `${(t * t * (3 - 2 * t) * 150).toFixed(2)}vmax`;
    });
    const plate = useTransform(p, [0.29, 0.32], [1, 0]);
    // glass, plane and nucleus thicken under scale, so they leave early
    const glass = useTransform(p, [0.05, 0.18], [1, 0]);
    const intro = useTransform(p, [0, 0.07], [1, 0]);
    const head = useTransform(p, [0.24, 0.36], [0, 1]);
    const headY = useTransform(p, [0.24, 0.38], [40, 0]);
    const out = useTransform(p, [0.9, 1], [1, 0.35]);

    // the camera falls in with you while the wordmark opens
    const dive = useCallback(() => clamp01(p.get() / 0.4) * 1.35, [p]);
    const irisMask = useMotionTemplate`radial-gradient(circle at var(--ox) var(--oy), transparent ${iris}, #000 calc(${iris} + 1.5px))`;

    return (
        <div className="absolute inset-0" style={wordVars}>
            <motion.div className="absolute inset-0" style={{ opacity: out }}>
                {/* the scene before WebGL: a frame of this exact render frozen
                    at t = 0 (?bhfreeze=0), so the canvas' crossfade is the
                    photo starting to move. Both renders size the hole by
                    height and centre it, hence h-full and a centred img. The
                    painted ring covers portrait tablets, which have no capture */}
                <div aria-hidden data-galaxy-fallback className="reveal-scene-fallback absolute inset-0 overflow-hidden transition-opacity duration-500">
                    <picture>
                        <source media="(min-width: 768px) and (min-aspect-ratio: 1/1)" srcSet="/reveal/scene-wide.webp" />
                        <img src="/reveal/scene-mobile.webp" alt="" fetchPriority="high" decoding="async" className="reveal-scene-photo absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2" />
                    </picture>
                </div>
                <GalaxyCanvas dive={dive} centered />
                <GalaxyLite dive={dive} centered />
            </motion.div>

            {!still && (
                <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ maskImage: irisMask, WebkitMaskImage: irisMask, opacity: plate }}>
                    {/* will-change: rastered once and scaled by the compositor.
                        Re-rastering the masked plate at every zoom step doubled
                        GPU time per frame in a trace; the softer edges at 2-3×
                        only exist mid-dive, where the letters are rushing past */}
                    <motion.div className="absolute inset-0 will-change-transform" style={{ scale, transformOrigin: "var(--ox) var(--oy)" }}>
                        {/* the plate: the void with the letters cut out of it */}
                        <div className="reveal-plate absolute inset-0">
                            <motion.span style={{ opacity: glass }} className="reveal-plane absolute inset-x-0 top-1/2 block h-px -translate-y-1/2" />
                        </div>
                        {/* glass in the cut-outs, so a letter over empty sky
                            still reads as a letter, plus the nucleus */}
                        <motion.svg
                            viewBox={`0 0 ${WORD_W} ${CAP}`}
                            className="absolute left-1/2 top-1/2 h-(--word-h) w-(--word-w) -translate-x-1/2 -translate-y-1/2 overflow-visible"
                            style={{ opacity: glass }}
                        >
                            <defs>
                                <linearGradient id="reveal-glass" x1="0" y1="0" x2="0" y2={CAP} gradientUnits="userSpaceOnUse">
                                    <stop offset="0" stopColor="#fff4e2" stopOpacity="0.26" />
                                    <stop offset="0.5" stopColor="#ffd9a0" stopOpacity="0.5" />
                                    <stop offset="1" stopColor="#fff4e2" stopOpacity="0.16" />
                                </linearGradient>
                                <radialGradient id="reveal-nucleus">
                                    <stop offset="0" stopColor="#fffaf0" />
                                    <stop offset="0.25" stopColor="#ffe7c2" stopOpacity="0.9" />
                                    <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
                                </radialGradient>
                                <clipPath id="reveal-cap"><rect width={WORD_W} height={CAP} /></clipPath>
                            </defs>
                            <g className="reveal-glass">
                                <path d={WORD_PATH} clipPath="url(#reveal-cap)" fill="none" stroke="url(#reveal-glass)" strokeWidth={STROKE} strokeLinejoin="miter" strokeMiterlimit={8} />
                                <circle className="reveal-nucleus" cx={NUCLEUS.x} cy={NUCLEUS.y} r={9} fill="url(#reveal-nucleus)" />
                            </g>
                        </motion.svg>
                    </motion.div>
                </motion.div>
            )}

            {!still && (
                <motion.div style={{ opacity: intro }} className="pointer-events-none absolute inset-0">
                    <span className={cn(mono, "reveal-cue absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[11px] tracking-[0.35em] text-[var(--text-dim)]")}>
                        SCROLL TO ENTER
                        <span className="reveal-drop block h-10 w-px bg-gradient-to-b from-[#ffd9a0] to-transparent" />
                    </span>
                </motion.div>
            )}

            <Link href="/docs/learn/getting-started" className="absolute bottom-8 left-1/2 z-20 inline-flex h-11 -translate-x-1/2 items-center gap-3 bg-[var(--core-white)] px-6 text-sm font-semibold text-[var(--space-void)] transition-colors hover:bg-[var(--core-amber)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--core-white)]">
                Get started <span aria-hidden="true">→</span>
            </Link>
            <motion.div style={{ opacity: head, y: headY }} className="absolute inset-x-0 bottom-[18%] flex flex-col items-center gap-5 px-6 text-center">
                <h1 className="max-w-[16ch] text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] [text-shadow:0_2px_40px_rgba(0,0,0,0.95)] sm:text-7xl">
                    The TypeScript framework for Discord
                </h1>
                <code translate="no" className={cn(mono, "text-[14px] tracking-[0.08em] text-[#efe6d2] [text-shadow:0_1px_16px_rgba(0,0,0,0.95)]")}>npm i seyfert</code>
            </motion.div>
        </div>
    );
}

/* ── 1 · a command is one file ──────────────────────────────────────── */

// Each line types itself in: a left-to-right wipe. clip-path, not a slide —
// a translated line overflows the code box and made it scroll sideways
// until every line had settled, though the code always fits.
function CodeLine({ line, p, at, span = 0.07 }: { line: CodeLines[number]; p: MotionValue<number>; at: number; span?: number }) {
    const opacity = useTransform(p, [at, at + span * 0.5], [0, 1]);
    const clipPath = useTransform(p, [at, at + span], ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]);
    return (
        <motion.div style={{ opacity, clipPath }} className="whitespace-pre-wrap pl-[2ch] -indent-[2ch] sm:whitespace-pre sm:pl-0 sm:indent-0">
            {line.length === 0 ? " " : line.map((t, i) => <span key={i} style={{ color: t.k }}>{t.c}</span>)}
        </motion.div>
    );
}

function OneFile({ lines }: { lines: CodeLines }) {
    return (
        <Pin height="320vh" label="A command is one file">
            {(p) => <OneFileStage p={p} lines={lines} />}
        </Pin>
    );
}

function OneFileStage({ p, lines }: { p: MotionValue<number>; lines: CodeLines }) {
    const h1a = useTransform(p, [0.02, 0.1], [0, 1]);
    const h1b = useTransform(p, [0.08, 0.16], [0, 1]);
    const h1y = useTransform(p, [0.02, 0.16], [30, 0]);
    const reply = useTransform(p, [0.78, 0.88], [0, 1]);
    const replyY = useTransform(p, [0.78, 0.9], [40, 0]);
    const glow = useTransform(p, [0.7, 0.9], [0, 1]);
    const n = lines.length;
    return (
        <div className="mx-auto grid h-full max-w-6xl content-center items-center gap-6 px-5 py-14 sm:gap-10 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <motion.div style={{ y: h1y }} className="flex flex-col gap-6">
                <h2 className="text-[clamp(44px,7vw,104px)] font-semibold leading-[0.92] tracking-[-0.04em]">
                    <motion.span style={{ opacity: h1a }} className="block">A command</motion.span>
                    <motion.span style={{ opacity: h1b }} className="reveal-metal block">is one file.</motion.span>
                </h2>
                <motion.p style={{ opacity: h1b }} className="max-w-[40ch] text-[15px] leading-relaxed text-[var(--text-dim)] sm:text-[17px]">
                    Declare it, type its options, write <code className={cn(mono, "text-[15px] text-[#ffc799]")}>run</code>. Seyfert loads it, registers it with Discord and hands you a typed context.
                </motion.p>
            </motion.div>

            <div className="relative min-w-0">
                <motion.div aria-hidden style={{ opacity: glow }} className="absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(255,217,160,0.16),transparent_65%)]" />
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#090b12]/90 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
                    <div className={cn(mono, "flex items-center justify-between border-b border-white/[0.07] px-4 py-2.5 text-[11px] tracking-[0.1em] text-[var(--text-dim)]")}>
                        <span className="text-[#ffd9a0]">src/commands/echo.ts</span>
                        <span>{n} lines</span>
                    </div>
                    <div className={cn(mono, "px-4 py-3 text-[10.5px] leading-[1.6] sm:overflow-x-auto sm:py-4 sm:text-[13px] sm:leading-[1.75]")}>
                        {lines.map((line, i) => (
                            <CodeLine key={i} line={line} p={p} at={0.14 + (i / n) * 0.56} />
                        ))}
                    </div>
                </div>
                <motion.div style={{ opacity: reply, y: replyY }} className="mt-3 flex sm:mt-5 items-center gap-3 rounded-xl border border-[#818cf8]/30 bg-[#0e1019]/95 p-3.5 shadow-[0_0_60px_rgba(129,140,248,0.18)]">
                    <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-indigo)]">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#05070d" /><ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="#05070d" strokeWidth="1.6" transform="rotate(-20 12 12)" /></svg>
                    </span>
                    <div className="flex min-w-0 flex-col">
                        <span className="text-sm"><span className="font-semibold">Echo</span> <span className="rounded-[3px] bg-[#5865f2] px-1 py-px text-[10px] font-semibold text-white">APP</span> <span className="text-xs text-[#8e95a8]">replying to /echo</span></span>
                        <span className="text-[15px] text-[#e5e5e5]">hello from the core</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/* ── 2 · leave the ceremony behind ──────────────────────────────────── */

function StruckLine({ line, p, at }: { line: CodeLines[number]; p: MotionValue<number>; at: number }) {
    const strike = useTransform(p, [at, at + 0.03], [0, 1]);
    const dim = useTransform(p, [at, at + 0.03], [1, 0.4]);
    return (
        <motion.div style={{ opacity: dim }} className="relative whitespace-pre">
            {line.length === 0 ? " " : line.map((t, i) => <span key={i} style={{ color: t.k }}>{t.c}</span>)}
            {line.length > 0 && <motion.span aria-hidden style={{ scaleX: strike }} className="absolute inset-x-0 top-1/2 h-[1.5px] origin-left bg-[#d9925c]" />}
        </motion.div>
    );
}

function Ceremony({ djs, boot }: { djs: CodeLines; boot: CodeLines }) {
    return (
        <Pin height="360vh" label="Leave the ceremony behind">
            {(p) => <CeremonyStage p={p} djs={djs} boot={boot} />}
        </Pin>
    );
}

function CeremonyStage({ p, djs, boot }: { p: MotionValue<number>; djs: CodeLines; boot: CodeLines }) {
    const wide = useWide();
    const written = (c: CodeLines) => c.filter((l) => l.some((t) => t.c.trim() && !t.c.trim().startsWith("//"))).length;
    const before = written(djs);
    const after = written(boot);

    const intro = useTransform(p, [0, 0.08], [0, 1]);
    // discord.js: struck line by line, then crushed and pushed aside
    const djsScale = useTransform(p, [0.5, 0.64], [1, 0.62]);
    const djsX = useTransform(p, [0.5, 0.64], wide ? ["0%", "-34%"] : ["0%", "-18%"]);
    const djsO = useTransform(p, [0.5, 0.64], [1, 0.28]);
    // seyfert: flies in over it
    const bootO = useTransform(p, [0.58, 0.7], [0, 1]);
    const bootX = useTransform(p, [0.58, 0.74], wide ? ["40%", "12%"] : ["40%", "0%"]);
    const count = useTransform(p, [0.12, 0.74], [before, after], { clamp: true });
    const countText = useTransform(count, (v) => String(Math.round(v)));
    const label = useTransform(p, [0.66, 0.72], [0, 1]);
    const labelOld = useTransform(p, [0.66, 0.72], [1, 0]);

    const nd = djs.length;
    return (
        <div className="mx-auto flex h-full max-w-6xl flex-col justify-center gap-8 px-5 py-20">
            <motion.div style={{ opacity: intro }} className="flex flex-wrap items-end justify-between gap-6">
                <h2 className="text-[clamp(40px,6vw,88px)] font-semibold leading-[0.92] tracking-[-0.04em]">
                    Leave the<br />ceremony behind
                </h2>
                <div className="flex flex-col items-start sm:items-end">
                    <motion.span className="reveal-metal text-[clamp(64px,9vw,128px)] font-semibold leading-none tracking-[-0.05em] tabular-nums">{countText}</motion.span>
                    <span className={cn(mono, "relative h-4 w-[22ch] text-[11px] tracking-[0.25em] text-[var(--text-dim)]")}>
                        <motion.span style={{ opacity: labelOld }} className="absolute left-0 whitespace-nowrap sm:left-auto sm:right-0">LINES IN DISCORD.JS</motion.span>
                        <motion.span style={{ opacity: label }} className="absolute left-0 whitespace-nowrap text-[#ffd9a0] sm:left-auto sm:right-0">LINES IN SEYFERT</motion.span>
                    </span>
                </div>
            </motion.div>

            <div className="relative min-h-[420px]">
                <motion.div style={{ scale: djsScale, x: djsX, opacity: djsO }} className="absolute inset-x-0 top-0 origin-left overflow-hidden rounded-xl border border-white/10 bg-[#090b12]/90 lg:right-[22%]">
                    <div className={cn(mono, "border-b border-white/[0.07] px-4 py-2.5 text-[11px] tracking-[0.1em] text-[var(--text-dim)]")}>discord.js v14 · index.js</div>
                    <div className={cn(mono, "overflow-x-auto px-4 py-4 text-[11px] leading-[1.7] sm:text-[12.5px]")}>
                        {djs.map((line, i) => <StruckLine key={i} line={line} p={p} at={0.12 + (i / nd) * 0.34} />)}
                    </div>
                </motion.div>
                <motion.div style={{ opacity: bootO, x: bootX }} className="absolute inset-x-0 top-10 overflow-hidden rounded-xl border border-[#ffd9a0]/35 bg-[#0b0806]/95 shadow-[0_0_80px_rgba(255,217,160,0.12),0_40px_120px_rgba(0,0,0,0.7)] lg:left-[18%] lg:right-0">
                    <div className={cn(mono, "border-b border-white/[0.07] px-4 py-2.5 text-[11px] tracking-[0.1em] text-[#ffd9a0]")}>seyfert · the whole boot</div>
                    <div className={cn(mono, "overflow-x-auto px-4 py-4 text-[11px] leading-[1.75] sm:text-[13px]")}>
                        {boot.map((line, i) => (
                            <div key={i} className="whitespace-pre-wrap break-words pl-[2ch] -indent-[2ch] sm:whitespace-pre sm:pl-0 sm:indent-0">{line.length === 0 ? " " : line.map((t, k) => <span key={k} style={{ color: t.k }}>{t.c}</span>)}</div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

/* ── 3 · burn less ───────────────────────────────────────────────────── */

function medianRss(samples: number[]) {
    const sorted = [...samples].sort((a, b) => a - b);
    const middle = sorted.length / 2;
    return Math.round((sorted[Math.floor(middle)] + sorted[Math.ceil(middle) - 1]) / 2);
}

const SEYFERT_RSS = medianRss(seyfertMemory.rss);
const DISCORD_RSS = medianRss(discordMemory.rss);
const RSS_CEILING = Math.ceil((DISCORD_RSS * 1.05) / 10) * 10;

function Memory() {
    return <Pin height="280vh" label="Memory under load">{(p) => <MemoryStage p={p} />}</Pin>;
}

function MemoryStage({ p }: { p: MotionValue<number> }) {
    const mb = useTransform(p, [0.18, 0.66], [DISCORD_RSS, SEYFERT_RSS], { clamp: true });
    const mbText = useTransform(mb, (v) => String(Math.round(v)));
    const bar = useTransform(p, [0.18, 0.66], [DISCORD_RSS / RSS_CEILING, SEYFERT_RSS / RSS_CEILING], { clamp: true });
    const ghost = useTransform(p, [0.18, 0.3], [0, 1]);
    const heat = useTransform(p, [0.4, 0.66], ["#fafafa", "#ffd9a0"]);
    // each label only names a real measurement: discord.js before the count
    // starts, seyfert once it lands — mid-scrub numbers belong to nobody
    const nameOld = useTransform(p, [0.18, 0.24], [1, 0]);
    const nameNew = useTransform(p, [0.6, 0.66], [0, 1]);
    const tail = useTransform(p, [0.72, 0.84], [0, 1]);
    const intro = useTransform(p, [0, 0.1], [0, 1]);

    return (
        <div className="relative flex h-full flex-col items-center justify-center gap-6 px-5 text-center">
            {/* faint orbital plate behind the readout */}
            <svg aria-hidden viewBox="0 0 800 800" className="pointer-events-none absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 opacity-40">
                {[380, 300, 220, 140].map((r, i) => (
                    <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#ffd9a0" strokeOpacity={0.08 + i * 0.05} strokeDasharray={i % 2 ? "2 10" : undefined} />
                ))}
            </svg>

            <motion.span style={{ opacity: intro }} className={cn(mono, "relative h-4 w-full text-[12px] tracking-[0.35em] text-[var(--text-dim)]")}>
                <motion.span style={{ opacity: nameOld }} className="absolute inset-x-0">DISCORD.JS · MEDIAN MEMORY</motion.span>
                <motion.span style={{ opacity: nameNew }} className="absolute inset-x-0 text-[#ffd9a0]">SEYFERT · MEDIAN MEMORY</motion.span>
            </motion.span>

            <motion.div style={{ opacity: intro, color: heat }} className="relative flex items-baseline font-semibold leading-none tracking-[-0.06em]">
                <motion.span className="text-[clamp(120px,24vw,340px)] tabular-nums">{mbText}</motion.span>
                <span className="ml-3 text-[clamp(28px,4vw,56px)] tracking-[-0.02em]">MB</span>
            </motion.div>

            <motion.div style={{ opacity: intro }} className="relative h-2 w-full max-w-3xl bg-white/[0.05]">
                <motion.div style={{ opacity: ghost, width: `${DISCORD_RSS / RSS_CEILING * 100}%` }} className="absolute inset-y-0 left-0 border-r border-white/30" />
                <motion.div style={{ scaleX: bar }} className="absolute inset-0 origin-left bg-gradient-to-r from-[#b4683c] via-[#ffd9a0] to-[#fff4e2] shadow-[0_0_24px_rgba(255,217,160,0.45)]" />
            </motion.div>

            <motion.div style={{ opacity: tail }} className="relative flex flex-col items-center gap-3">
                <p className="text-[clamp(20px,2.4vw,30px)] font-medium tracking-[-0.01em]">
                    {(DISCORD_RSS / SEYFERT_RSS).toFixed(2)}× lighter under the same gateway load.
                </p>
                <Link href="/benchmark" className={cn(mono, "inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current text-[11px] tracking-[0.25em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline")}>FULL MEASUREMENTS ↗</Link>
            </motion.div>
        </div>
    );
}

/* ── 4 · in orbit: kinetic type ─────────────────────────────────────── */

const BOTS = [
    { name: "Listen", avatar: "/bots/thumbs/listen.webp", quote: "under 1 GB, from almost 4 GB" },
    { name: "CactusFire", avatar: "/bots/thumbs/cactusfire.webp", quote: "nothing better than Seyfert" },
    { name: "Button Bot", avatar: "/bots/thumbs/buttonbot.gif", quote: "handled everything seamlessly" },
    { name: "Kenium", avatar: "/bots/thumbs/kenium.webp", quote: "the most resource-efficient" },
    { name: "Stelle", avatar: "/bots/thumbs/stelle.webp", quote: "open-source, on Seyfert" },
    { name: "Multiversal", avatar: "/bots/thumbs/multiversal.webp", quote: "recognised by numerous servers" },
    { name: "Lumi", avatar: "/bots/thumbs/lumi.webp", quote: "light memory footprint" },
    { name: "Hiraku Shinzou", avatar: "/bots/thumbs/hiraku.webp", quote: "all my homies use Seyfert" },
];

function Orbit() {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReduce();
    const { scrollYProgress: raw } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const scrollYProgress = useGlide(raw);
    const left = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["4%", "-46%"]);
    const right = useTransform(scrollYProgress, [0, 1], reduce ? ["-30%", "-30%"] : ["-52%", "0%"]);
    const half = BOTS.length / 2;
    return (
        <section ref={ref} aria-label="Bots running on Seyfert" className="relative flex flex-col gap-10 overflow-hidden py-40">
            <div className="mx-auto w-full max-w-6xl px-5">
                <span className={cn(mono, "text-[11px] tracking-[0.16em] text-[var(--text-dim)] sm:tracking-[0.35em]")}>IN ORBIT · BOTS RUNNING ON SEYFERT</span>
            </div>
            <motion.ul style={{ x: left }} className="flex w-max items-center gap-10 whitespace-nowrap">
                {[...BOTS.slice(0, half), ...BOTS.slice(0, half)].map((b, i) => <OrbitItem key={`${b.name}-${i}`} bot={b} solid={i % 2 === 0} duplicate={i >= half} />)}
            </motion.ul>
            <motion.ul style={{ x: right }} className="flex w-max items-center gap-10 whitespace-nowrap">
                {[...BOTS.slice(half), ...BOTS.slice(half)].map((b, i) => <OrbitItem key={`${b.name}-${i}`} bot={b} solid={i % 2 === 1} duplicate={i >= BOTS.length - half} />)}
            </motion.ul>
            <div className="mx-auto w-full max-w-6xl px-5">
                <a href="https://github.com/tiramisulabs/seyfert-web" target="_blank" className={cn(mono, "inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current text-[11px] tracking-[0.25em] text-[var(--text-dim)] hover:text-[var(--text-bright)]")}>ADD YOURS — OPEN A PR ↗</a>
            </div>
        </section>
    );
}

function OrbitItem({ bot, solid, duplicate }: { bot: (typeof BOTS)[number]; solid: boolean; duplicate: boolean }) {
    return (
        <li aria-hidden={duplicate || undefined} className="flex items-center gap-6">
            <Image src={bot.avatar} alt="" width={88} height={88} unoptimized={bot.avatar.endsWith(".gif")} className="size-16 rounded-2xl ring-1 ring-white/15 sm:size-[88px]" />
            <span className={cn("text-[clamp(56px,9vw,136px)] font-semibold leading-none tracking-[-0.04em]", solid ? "text-[var(--text-bright)]" : "reveal-outline")}>{bot.name}</span>
            <span className={cn(mono, "max-w-[18ch] whitespace-normal text-[12px] leading-snug tracking-[0.08em] text-[var(--text-dim)]")}>“{bot.quote}”</span>
        </li>
    );
}

/* ── 5 · finale: the release line ───────────────────────────────────── */

// The trajectory: an inclined orbit through the word, in word units. It
// rises from under the S behind the letters, crosses the plane at the
// nucleus (the F stem the opening dove through) and comes out in front,
// leaving past the T. Two cubics, smooth at the node.
const NODE = `${NUCLEUS.x} ${NUCLEUS.y}`;
const TRAJ_BACK = `M-40 120C90 140 250 118 ${NODE}`;
const TRAJ_FRONT = `M${NODE}C352 -6 540 -40 702 -44`;
// share of the whole length behind the word, so one scrub draws both
const TRAJ_SPLIT = 0.48;
// the head: tangent at the end of TRAJ_FRONT
const HEAD = { x: 702, y: -44, deg: (Math.atan2(-4, 162) * 180) / Math.PI };

function Finale() {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReduce();
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
    const p = useGlide(scrollYProgress);
    // scrubbed like every chapter: drawn while the word rises into view
    const draw = useTransform(p, (v) => (reduce ? 1 : clamp01((v - 0.2) / 0.55)));
    const back = useTransform(draw, (v) => clamp01(v / TRAJ_SPLIT));
    const front = useTransform(draw, (v) => clamp01((v - TRAJ_SPLIT) / (1 - TRAJ_SPLIT)));
    const node = useTransform(draw, [TRAJ_SPLIT - 0.04, TRAJ_SPLIT + 0.04], [0, 1]);
    const head = useTransform(draw, [0.9, 1], [0, 1]);
    return (
        <section ref={ref} aria-label="Get started" className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-5 pb-28 text-center">
            <div aria-hidden className="core-glow absolute left-1/2 top-[38%] size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-2xl" />
            {/* bookends the opening: the same drawn wordmark, now solid ground,
                with a trajectory threaded through it */}
            <svg role="img" aria-label="Seyfert" viewBox={`0 0 ${WORD_W} ${CAP}`} className="relative h-auto w-[min(84vw,880px)] overflow-visible">
                <defs>
                    <linearGradient id="reveal-finale-metal" x1="0" y1="0" x2={WORD_W} y2={CAP} gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#f2d7a6" />
                        <stop offset="0.35" stopColor="#fff3d8" />
                        <stop offset="0.5" stopColor="#ffffff" />
                        <stop offset="1" stopColor="#c9d0da" />
                    </linearGradient>
                    <linearGradient id="reveal-finale-orbit" x1="-40" y1="0" x2="702" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#b4683c" stopOpacity="0" />
                        <stop offset="0.3" stopColor="#f0cf8c" stopOpacity="0.7" />
                        <stop offset="0.75" stopColor="#ffe7c2" />
                        <stop offset="1" stopColor="#fffaf0" />
                    </linearGradient>
                    <filter id="reveal-finale-blur" x="-10%" y="-60%" width="120%" height="220%">
                        <feGaussianBlur stdDeviation="4" />
                    </filter>
                    <clipPath id="reveal-finale-cap"><rect width={WORD_W} height={CAP} /></clipPath>
                    {/* where the trajectory passes in front, the metal parts
                        around it so the crossing reads as over, not on */}
                    <mask id="reveal-finale-cut" maskUnits="userSpaceOnUse" x="-60" y="-80" width={WORD_W + 120} height="260">
                        <rect x="-60" y="-80" width={WORD_W + 120} height="260" fill="#fff" />
                        <motion.path d={TRAJ_FRONT} fill="none" stroke="#000" strokeWidth={7} style={{ pathLength: front }} />
                    </mask>
                </defs>
                <g aria-hidden fill="none" stroke="url(#reveal-finale-orbit)">
                    <motion.path d={TRAJ_BACK} strokeWidth={9} opacity={0.35} filter="url(#reveal-finale-blur)" style={{ pathLength: back }} />
                    <motion.path d={TRAJ_BACK} strokeWidth={2} style={{ pathLength: back }} />
                </g>
                <path d={WORD_PATH} clipPath="url(#reveal-finale-cap)" mask="url(#reveal-finale-cut)" fill="none" stroke="url(#reveal-finale-metal)" strokeWidth={STROKE} strokeLinejoin="miter" strokeMiterlimit={8} />
                <g aria-hidden fill="none" stroke="url(#reveal-finale-orbit)">
                    <motion.path d={TRAJ_FRONT} strokeWidth={9} opacity={0.35} filter="url(#reveal-finale-blur)" style={{ pathLength: front }} />
                    <motion.path d={TRAJ_FRONT} strokeWidth={2} style={{ pathLength: front }} />
                    <motion.circle cx={NUCLEUS.x} cy={NUCLEUS.y} r={3.2} fill="#fffaf0" stroke="none" style={{ opacity: node }} />
                    <g transform={`translate(${HEAD.x} ${HEAD.y}) rotate(${HEAD.deg.toFixed(2)})`}>
                        <motion.path d="M-13 -6.5L0 0L-13 6.5" stroke="#fffaf0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ opacity: head }} />
                    </g>
                </g>
            </svg>
            <div className="relative flex flex-col items-center gap-3">
                <span className={cn(mono, "text-[11px] tracking-[0.35em] text-[var(--text-dim)]")}>START BUILDING</span>
                <span className="flex items-center gap-4">
                    <code translate="no" className={cn(mono, "reveal-metal text-[clamp(32px,6vw,80px)] font-medium tracking-[-0.03em]")}>npm i seyfert</code>
                    <CopyButton text="npm i seyfert" label="copy install command" className="text-[18px]" />
                </span>
            </div>
            <div className="relative flex flex-wrap items-center justify-center gap-3.5">
                <Link href="/docs/learn/getting-started" className="group inline-flex h-11 items-center gap-2 bg-[#f8f1e4] px-10 text-sm font-semibold text-[var(--space-void)] shadow-[0_0_34px_8px_rgba(240,206,142,0.25)] transition-[background-color,box-shadow] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]">
                    Get started
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="https://discord.gg/hEeJNaSqnS" target="_blank" className={cn(mono, "inline-flex h-11 items-center gap-2 border border-white/15 px-8 text-xs tracking-[0.22em] text-[var(--text-bright)] transition-colors hover:border-[var(--brand-indigo)] hover:bg-[var(--brand-indigo)]/10")}>
                    DISCORD ↗
                </Link>
            </div>
        </section>
    );
}
