"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useMotionValueEvent,
    useScroll,
    useSpring,
    useTransform,
    type MotionValue,
} from "motion/react";
import GalaxyCanvas from "@/components/home/galaxy/galaxy-canvas";
import GalaxyLite from "@/components/home/galaxy/galaxy-lite";
import { CopyButton } from "@/components/home/galaxy/copy-button";
import { cn } from "@/lib/utils";
import { medianMb } from "@/lib/benchmark";
import { CAP, NUCLEUS, STROKE, WORD_MASK_URL, WORD_PATH, WORD_W } from "./wordmark";
import { REVEAL_SEEN_KEY } from "./seen";
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

// Returning visitors get the compact cut: every chapter at its last frame,
// unpinned, the path reduced motion already takes. The full Reveal plays until
// someone has dived through the opening once (REVEAL_SEEN_KEY). The root
// layout's pre-paint script turns that into data-reveal="compact" on <html>,
// and global.css styles the server HTML to match until React renders it, so
// a returning visit never flashes the wordmark first. The mode is read from
// the attribute, not storage, so marking a visit as seen never collapses the
// page mid-scroll; it applies from the next load or client navigation.
const COMPACT_EVENT = "seyfert:reveal-mode";
function subscribeCompact(on: () => void) {
    window.addEventListener(COMPACT_EVENT, on);
    return () => window.removeEventListener(COMPACT_EVENT, on);
}
function useCompact() {
    return useSyncExternalStore(subscribeCompact, () => document.documentElement.dataset.reveal === "compact", () => false);
}
function setCompact(on: boolean) {
    if (on) document.documentElement.dataset.reveal = "compact";
    else delete document.documentElement.dataset.reveal;
    window.dispatchEvent(new Event(COMPACT_EVENT));
}
function hasSeen() {
    try {
        return localStorage.getItem(REVEAL_SEEN_KEY) !== null;
    } catch {
        return false;
    }
}
function markSeen() {
    try {
        localStorage.setItem(REVEAL_SEEN_KEY, "1");
    } catch {
        // private mode: the full Reveal plays every time
    }
}

// every chapter at its last frame: reduced motion, or the compact cut
const StillContext = createContext(false);

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
    const reduce = useReduce();
    const compact = useCompact();
    const still = reduce || compact;
    // leaving after the dive: a client navigation back opens on the compact cut
    useEffect(() => () => {
        if (hasSeen()) setCompact(true);
    }, []);
    return (
        <StillContext value={still}>
            <div className="spiral-page reveal-page relative overflow-x-clip">
                <Opening />
                <OneFile lines={echo} />
                <Ceremony djs={djs} boot={boot} />
                <Memory />
                <Orbit />
                <Finale />
            </div>
        </StillContext>
    );
}

/* ── pinning ─────────────────────────────────────────────────────────── */

// A chapter: `height` of scroll track, one viewport pinned inside it, and
// the track's 0→1 progress handed to the stage. Reduced motion and the compact
// cut get the final frame of every chapter, unpinned.
function Pin({ height, label, children }: { height: string; label: string; children: (p: MotionValue<number>, still: boolean) => ReactNode }) {
    const ref = useRef<HTMLElement>(null);
    const still = useContext(StillContext);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
    const progress = useGlide(scrollYProgress);
    const done = useMotionValue(1);
    // leaving the still cut (Replay): the track grows under a scroll position
    // that doesn't move, so nothing re-measures it and the stage would stay on
    // its last frame. Re-measure on the next frame, then land on the real
    // progress instead of gliding back through the chapter.
    useEffect(() => {
        if (still) return;
        let raf = requestAnimationFrame(() => {
            window.dispatchEvent(new Event("scroll"));
            raf = requestAnimationFrame(() => progress.jump(scrollYProgress.get()));
        });
        return () => cancelAnimationFrame(raf);
    }, [still, progress, scrollYProgress]);
    return (
        <section ref={ref} aria-label={label} className="reveal-pin relative" style={{ height: still ? "auto" : height }}>
            <div className={cn("reveal-stage overflow-hidden", still ? "relative min-h-svh py-24" : "sticky top-0 h-svh")}>
                {children(still ? done : progress, still)}
            </div>
        </section>
    );
}

// The playhead glides after the scrollbar instead of jumping with it. Scroll
// itself stays native; only the scrubbed scene eases toward it, so a wheel
// notch (100px, 7-16% of a chapter) plays as a short move, not a cut. A spring
// is a JS value, so this also keeps every chapter on the main-thread scrub:
// motion's native ScrollTimeline path drifted from the real progress here
// (opacity ~0.05 at p = 0.95).
function useGlide(v: MotionValue<number>) {
    return useSpring(v, { stiffness: 260, damping: 36, mass: 0.5, restDelta: 0.0005 });
}

/* ── 0 · the opening: through the wordmark ──────────────────────────── */

function Opening() {
    return <Pin height="170vh" label="Seyfert">{(p, still) => <OpeningStage p={p} still={still} />}</Pin>;
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
    // The headline lands by 60% of the 70vh track; the rest is a short read
    // before the scene dims. The iris still spans ~1.5 wheel notches (100px):
    // a single notch played as a cut rather than a move.
    const scale = useTransform(p, (v) => 1 + 5 * Math.pow(clamp01(v / 0.54), 2.2));
    const iris = useTransform(p, (v) => {
        const t = clamp01((v - 0.25) / 0.25);
        return `${(t * t * (3 - 2 * t) * 150).toFixed(2)}vmax`;
    });
    const plate = useTransform(p, [0.47, 0.52], [1, 0]);
    // glass, plane and nucleus thicken under scale, so they leave early
    const glass = useTransform(p, [0.08, 0.28], [1, 0]);
    const intro = useTransform(p, [0, 0.11], [1, 0]);
    const head = useTransform(p, [0.38, 0.57], [0, 1]);
    const headY = useTransform(p, [0.38, 0.6], [40, 0]);
    const out = useTransform(p, [0.85, 1], [1, 0.35]);
    // past the iris and the headline: this visitor has seen the dive
    const marked = useRef(false);
    useMotionValueEvent(p, "change", (v) => {
        if (v <= 0.6 || marked.current) return;
        marked.current = true;
        markSeen();
    });

    // the camera falls in with you while the wordmark opens
    const dive = useCallback(() => clamp01(p.get() / 0.63) * 1.35, [p]);
    const irisMask = useMotionTemplate`radial-gradient(circle at var(--ox) var(--oy), transparent ${iris}, #000 calc(${iris} + 1.5px))`;

    return (
        <div className="absolute inset-0" style={wordVars}>
            <motion.div className="reveal-scene absolute inset-0" style={{ opacity: out }}>
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
                <motion.div aria-hidden className="reveal-dive pointer-events-none absolute inset-0" style={{ maskImage: irisMask, WebkitMaskImage: irisMask, opacity: plate }}>
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
                <motion.div style={{ opacity: intro }} className="reveal-dive pointer-events-none absolute inset-0">
                    <span className={cn(mono, "reveal-cue absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-[11px] tracking-[0.35em] text-[var(--text-dim)]")}>
                        SCROLL TO ENTER
                        <span className="reveal-drop block h-10 w-px bg-gradient-to-b from-[#ffd9a0] to-transparent" />
                    </span>
                </motion.div>
            )}

            <Link href="/docs/learn/getting-started" className="absolute bottom-8 left-1/2 z-20 inline-flex h-11 -translate-x-1/2 items-center gap-3 bg-[var(--core-white)] px-6 text-sm font-semibold text-[var(--space-void)] transition-colors hover:bg-[var(--core-amber)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--core-white)]">
                Get started <span aria-hidden="true">→</span>
            </Link>
            <motion.div style={{ opacity: head, y: headY }} className="reveal-head absolute inset-x-0 bottom-[18%] flex flex-col items-center gap-5 px-6 text-center">
                <h1 className="max-w-[16ch] text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] [text-shadow:0_2px_40px_rgba(0,0,0,0.95)] sm:text-7xl">
                    The TypeScript framework for Discord
                </h1>
                <code translate="no" className={cn(mono, "text-[14px] tracking-[0.08em] text-[#efe6d2] [text-shadow:0_1px_16px_rgba(0,0,0,0.95)]")}>npm i seyfert</code>
                {/* proof beside the promise, from the same measurements the
                    Memory chapter shows */}
                <p className={cn(mono, "flex flex-col gap-1 text-[11px] leading-relaxed tracking-[0.2em] text-[var(--text-dim)] [text-shadow:0_1px_16px_rgba(0,0,0,0.95)]")}>
                    <span>{(DISCORD_RSS / SEYFERT_RSS).toFixed(2)}× LESS MEMORY THAN DISCORD.JS</span>
                    <span>POWERING BOTS IN PRODUCTION</span>
                </p>
                {/* always in the HTML, shown by global.css in the compact cut
                    only, so it doesn't push the headline up when React
                    hydrates */}
                <button
                    type="button"
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: "instant" });
                        setCompact(false);
                    }}
                    className={cn(mono, "reveal-replay hidden min-h-11 items-center text-[11px] tracking-[0.25em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current")}
                >
                    REPLAY THE INTRO ↺
                </button>
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
        <Pin height="250vh" label="A command is one file">
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
    const strike = useTransform(p, [at, at + 0.036], [0, 1]);
    const dim = useTransform(p, [at, at + 0.036], [1, 0.4]);
    return (
        <motion.div style={{ opacity: dim }} className="relative whitespace-pre">
            {line.length === 0 ? " " : line.map((t, i) => <span key={i} style={{ color: t.k }}>{t.c}</span>)}
            {line.length > 0 && <motion.span aria-hidden style={{ scaleX: strike }} className="absolute inset-x-0 top-1/2 h-[1.5px] origin-left bg-[#d9925c]" />}
        </motion.div>
    );
}

function Ceremony({ djs, boot }: { djs: CodeLines; boot: CodeLines }) {
    return (
        <Pin height="260vh" label="Leave the ceremony behind">
            {(p) => <CeremonyStage p={p} djs={djs} boot={boot} />}
        </Pin>
    );
}

function CeremonyStage({ p, djs, boot }: { p: MotionValue<number>; djs: CodeLines; boot: CodeLines }) {
    const wide = useWide();
    const written = (c: CodeLines) => c.filter((l) => l.some((t) => t.c.trim() && !t.c.trim().startsWith("//"))).length;
    const before = written(djs);
    const after = written(boot);

    const intro = useTransform(p, [0, 0.1], [0, 1]);
    // discord.js: struck line by line, then crushed and pushed aside
    const djsScale = useTransform(p, [0.61, 0.78], [1, 0.62]);
    const djsX = useTransform(p, [0.61, 0.78], wide ? ["0%", "-34%"] : ["0%", "-18%"]);
    const djsO = useTransform(p, [0.61, 0.78], [1, 0.28]);
    // seyfert: flies in over it
    const bootO = useTransform(p, [0.7, 0.85], [0, 1]);
    const bootX = useTransform(p, [0.7, 0.9], wide ? ["40%", "12%"] : ["40%", "0%"]);
    const count = useTransform(p, [0.15, 0.9], [before, after], { clamp: true });
    const countText = useTransform(count, (v) => String(Math.round(v)));
    const label = useTransform(p, [0.8, 0.88], [0, 1]);
    const labelOld = useTransform(p, [0.8, 0.88], [1, 0]);

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
                        {djs.map((line, i) => <StruckLine key={i} line={line} p={p} at={0.15 + (i / nd) * 0.41} />)}
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

const SEYFERT_RSS = medianMb(seyfertMemory.rss);
const DISCORD_RSS = medianMb(discordMemory.rss);
const RSS_CEILING = Math.ceil((DISCORD_RSS * 1.05) / 10) * 10;

function Memory() {
    return <Pin height="225vh" label="Memory under load">{(p) => <MemoryStage p={p} />}</Pin>;
}

function MemoryStage({ p }: { p: MotionValue<number> }) {
    const mb = useTransform(p, [0.19, 0.71], [DISCORD_RSS, SEYFERT_RSS], { clamp: true });
    const mbText = useTransform(mb, (v) => String(Math.round(v)));
    const bar = useTransform(p, [0.19, 0.71], [DISCORD_RSS / RSS_CEILING, SEYFERT_RSS / RSS_CEILING], { clamp: true });
    const ghost = useTransform(p, [0.19, 0.32], [0, 1]);
    const heat = useTransform(p, [0.43, 0.71], ["#fafafa", "#ffd9a0"]);
    // each label only names a real measurement: discord.js before the count
    // starts, seyfert once it lands — mid-scrub numbers belong to nobody
    const nameOld = useTransform(p, [0.19, 0.26], [1, 0]);
    const nameNew = useTransform(p, [0.64, 0.71], [0, 1]);
    const tail = useTransform(p, [0.77, 0.9], [0, 1]);
    const intro = useTransform(p, [0, 0.11], [0, 1]);

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

// The orbit: an inclined ring around the word, on the plane its middle
// strokes share, in word units. Tilted just enough that the far half dips
// behind the S and the near half rises across the T's stem, parting the
// metal there; everywhere else it clears the letters. A photon rides it once
// it's drawn, slipping behind the word and coming back out in front.
const ORBIT = { cx: WORD_W / 2, cy: NUCLEUS.y, rx: 390, ry: 70, tilt: -5 };
const ORBIT_L = `${ORBIT.cx - ORBIT.rx} ${ORBIT.cy}`;
const ORBIT_R = `${ORBIT.cx + ORBIT.rx} ${ORBIT.cy}`;
const ORBIT_ARC = `A${ORBIT.rx} ${ORBIT.ry} 0 0 1`;
const ORBIT_FAR = `M${ORBIT_L}${ORBIT_ARC} ${ORBIT_R}`;
const ORBIT_NEAR = `M${ORBIT_R}${ORBIT_ARC} ${ORBIT_L}`;
const ORBIT_FULL = `M${ORBIT_L}${ORBIT_ARC} ${ORBIT_R}${ORBIT_ARC} ${ORBIT_L}`;
const ORBIT_TILT = `rotate(${ORBIT.tilt} ${ORBIT.cx} ${ORBIT.cy})`;
// the photon: a round head and a fading tail, as dashes on a 100-unit path
// whose heads line up (offset = length - travelled)
const PHOTON = [
    { len: 28, width: 1.25, opacity: 0.1 },
    { len: 12, width: 1.75, opacity: 0.22 },
    { len: 4, width: 2.5, opacity: 0.5 },
    { len: 0.01, width: 5, opacity: 1 },
];

function Photon() {
    return (
        <g fill="none" stroke="#fffaf0" strokeLinecap="round">
            {PHOTON.map((d) => (
                <path key={d.len} d={ORBIT_FULL} pathLength={100} strokeWidth={d.width} strokeOpacity={d.opacity} strokeDasharray={`${d.len} ${100 - d.len}`}>
                    <animate attributeName="stroke-dashoffset" from={d.len} to={d.len - 100} dur="11s" repeatCount="indefinite" />
                </path>
            ))}
        </g>
    );
}

function Finale() {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReduce();
    const still = useContext(StillContext);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
    const p = useGlide(scrollYProgress);
    // scrubbed like every chapter: the ring closes while the word rises into
    // view, far half first, then the near half sweeping back under it
    const draw = useTransform(p, (v) => (still ? 1 : clamp01((v - 0.2) / 0.55)));
    const far = useTransform(draw, (v) => clamp01(v / 0.5));
    const near = useTransform(draw, (v) => clamp01((v - 0.5) / 0.5));
    const photon = useTransform(draw, [0.94, 1], [0, 1]);
    return (
        <section ref={ref} aria-label="Get started" className="relative flex min-h-svh flex-col items-center justify-center gap-10 px-5 pb-28 text-center">
            <div aria-hidden className="core-glow absolute left-1/2 top-[38%] size-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-2xl" />
            {/* bookends the opening: the same drawn wordmark, now solid ground,
                with its orbit around it */}
            <svg role="img" aria-label="Seyfert" viewBox={`0 0 ${WORD_W} ${CAP}`} className="relative my-12 h-auto w-[min(80vw,860px)] overflow-visible">
                <defs>
                    <linearGradient id="reveal-finale-metal" x1="0" y1="0" x2={WORD_W} y2={CAP} gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#f2d7a6" />
                        <stop offset="0.35" stopColor="#fff3d8" />
                        <stop offset="0.5" stopColor="#ffffff" />
                        <stop offset="1" stopColor="#c9d0da" />
                    </linearGradient>
                    {/* perspective: the far side dims toward its middle, the
                        near side is brightest where it's closest */}
                    <linearGradient id="reveal-finale-far" x1={ORBIT.cx - ORBIT.rx} x2={ORBIT.cx + ORBIT.rx} y1="0" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#f0cf8c" stopOpacity="0.7" />
                        <stop offset="0.5" stopColor="#b4683c" stopOpacity="0.25" />
                        <stop offset="1" stopColor="#f0cf8c" stopOpacity="0.7" />
                    </linearGradient>
                    <linearGradient id="reveal-finale-near" x1={ORBIT.cx - ORBIT.rx} x2={ORBIT.cx + ORBIT.rx} y1="0" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#f0cf8c" stopOpacity="0.7" />
                        <stop offset="0.5" stopColor="#fff3d8" />
                        <stop offset="1" stopColor="#f0cf8c" stopOpacity="0.7" />
                    </linearGradient>
                    <filter id="reveal-finale-blur" x="-20%" y="-100%" width="140%" height="300%">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                    <clipPath id="reveal-finale-cap"><rect width={WORD_W} height={CAP} /></clipPath>
                    {/* the near half only, in the ring's tilted frame */}
                    <clipPath id="reveal-finale-near-half">
                        <rect x={ORBIT.cx - ORBIT.rx - 20} y={ORBIT.cy} width={ORBIT.rx * 2 + 40} height={ORBIT.ry + 20} />
                    </clipPath>
                    {/* where the near half passes in front, the metal parts
                        around it so the crossing reads as over, not on */}
                    <mask id="reveal-finale-cut" maskUnits="userSpaceOnUse" x="-80" y="-80" width={WORD_W + 160} height="260">
                        <rect x="-80" y="-80" width={WORD_W + 160} height="260" fill="#fff" />
                        <motion.path d={ORBIT_NEAR} transform={ORBIT_TILT} fill="none" stroke="#000" strokeWidth={8} style={{ pathLength: near }} />
                    </mask>
                </defs>
                <g aria-hidden fill="none" transform={ORBIT_TILT}>
                    <motion.path d={ORBIT_FAR} stroke="url(#reveal-finale-far)" strokeWidth={1.25} style={{ pathLength: far }} />
                    {!reduce && <motion.g style={{ opacity: photon }}><Photon /></motion.g>}
                </g>
                <path d={WORD_PATH} clipPath="url(#reveal-finale-cap)" mask="url(#reveal-finale-cut)" fill="none" stroke="url(#reveal-finale-metal)" strokeWidth={STROKE} strokeLinejoin="miter" strokeMiterlimit={8} />
                <g aria-hidden fill="none" transform={ORBIT_TILT}>
                    <motion.path d={ORBIT_NEAR} stroke="url(#reveal-finale-near)" strokeWidth={6} opacity={0.3} filter="url(#reveal-finale-blur)" style={{ pathLength: near }} />
                    <motion.path d={ORBIT_NEAR} stroke="url(#reveal-finale-near)" strokeWidth={1.75} style={{ pathLength: near }} />
                    {!reduce && (
                        <motion.g clipPath="url(#reveal-finale-near-half)" style={{ opacity: photon }}>
                            <g filter="url(#reveal-finale-blur)"><Photon /></g>
                            <Photon />
                        </motion.g>
                    )}
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
