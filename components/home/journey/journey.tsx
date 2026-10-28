"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import {
    AnimatePresence,
    MotionConfig,
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
    useTransform,
    useVelocity,
} from "motion/react";
import GalaxyCanvas from "@/components/home/galaxy/galaxy-canvas";
import GalaxyLite from "@/components/home/galaxy/galaxy-lite";
import { InstallPill } from "@/components/home/galaxy/install-pill";
import { cn } from "@/lib/utils";

// THE JOURNEY — the landing as one continuous fall. The visitor writes a
// /echo in the hero; that exact text rides a packet down through every ring
// Seyfert really has (gateway → shards → cache → command → middleware → your
// run()) and is shot back out of the core as a Discord reply. The black hole
// is fixed behind the whole page: a veil thickens over the rings so copy
// reads, then clears at the core so you arrive at the real thing.

const mono = GeistMono.className;

type StageId = "gateway" | "shards" | "cache" | "command" | "middleware" | "core" | "jet";

type Stage = {
    id: StageId;
    ring: string;
    name: string;
    /** ASTRO colour of this depth — used for the packet + ring art only */
    glow: string;
    /** veil over the black hole while this stage is centred */
    veil: string;
};

// colour temperature rises as the packet falls: star-blue → copper → white-hot,
// then the reply leaves in brand indigo
const STAGES: Stage[] = [
    { id: "gateway", ring: "Outside", name: "Gateway", glow: "#c8d8f0", veil: "rgba(5,7,13,0.88)" },
    { id: "shards", ring: "Ring 1", name: "Shards", glow: "#b9c6e6", veil: "rgba(6,8,15,0.9)" },
    { id: "cache", ring: "Ring 2", name: "Cache", glow: "#e2c08f", veil: "rgba(10,9,13,0.9)" },
    { id: "command", ring: "Ring 3", name: "Command", glow: "#d9925c", veil: "rgba(14,10,10,0.9)" },
    { id: "middleware", ring: "Ring 4", name: "Middleware", glow: "#e8a46a", veil: "rgba(16,10,8,0.86)" },
    { id: "core", ring: "The core", name: "Your code", glow: "#fff4e2", veil: "rgba(5,7,13,0.18)" },
    { id: "jet", ring: "The jet", name: "Back to Discord", glow: "#818cf8", veil: "rgba(5,7,13,0.9)" },
];

// stages whose veil is thick enough to hide the black hole's frame rate
const OPAQUE: ReadonlySet<StageId> = new Set(["gateway", "shards", "cache", "command", "middleware", "jet"]);
const VEIL_FADE_MS = 700;

// The fall, as a dive target for the shader (0 = rest, 1 = hero dive).
// Hero: the same first-viewport dive as the spiral home. Then free fall —
// slow at first, accelerating (t^2.2) until the core is centred at the
// peak. Past the core the camera pulls back out with the jet.
const DIVE_PEAK = 1;
function journeyDive(y: number, heroEnd: number, coreAt: number) {
    const clamp = (x: number) => Math.min(1, Math.max(0, x));
    const smooth = (x: number) => {
        const t = clamp(x);
        return t * t * (3 - 2 * t);
    };
    if (y <= heroEnd) return smooth(y / heroEnd);
    if (y <= coreAt) return 1 + DIVE_PEAK * Math.pow(clamp((y - heroEnd) / Math.max(1, coreAt - heroEnd)), 2.2);
    return 1 + DIVE_PEAK * (1 - smooth((y - coreAt) / (heroEnd * 1.2)));
}

const BOTS = [
    { name: "Listen", avatar: "/bots/thumbs/listen.webp", text: "RAM under 1 GB (from almost 4 GB) while handling 200% more servers." },
    { name: "CactusFire", avatar: "/bots/thumbs/cactusfire.webp", text: "For large scale bots... nothing better than Seyfert." },
    { name: "Button Bot", avatar: "/bots/thumbs/buttonbot.gif", text: "It handled everything seamlessly for our premium custom bots." },
    { name: "Kenium", avatar: "/bots/thumbs/kenium.webp", text: "The most resource-efficient I ever used." },
    { name: "Stelle", avatar: "/bots/thumbs/stelle.webp", text: "Open-source music, built on Seyfert." },
    { name: "Multiversal", avatar: "/bots/thumbs/multiversal.webp", text: "A global chat bot, recognised by numerous servers." },
    { name: "Lumi", avatar: "/bots/thumbs/lumi.webp", text: "Moved from discord.js for the light memory footprint." },
    { name: "Hiraku Shinzou", avatar: "/bots/thumbs/hiraku.webp", text: "All my homies use Seyfert so that's why I use it too." },
];

const BARS = [
    { name: "seyfert", mb: 84 },
    { name: "eris", mb: 90 },
    { name: "detritus", mb: 111 },
    { name: "oceanic", mb: 119 },
    { name: "discord.js", mb: 206 },
] as const;

export function Journey({ echoHtml, loggerHtml }: { echoHtml: string; loggerHtml: string }) {
    const [msg, setMsg] = useState("hello from the core");
    const [active, setActive] = useState(-1);
    const text = msg.trim() === "" ? "…" : msg;

    // whichever stage crosses the middle band of the viewport is "where the
    // packet is" — drives the HUD, the veil and the rail
    useEffect(() => {
        const els = STAGES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
        const hero = document.getElementById("journey-hero");
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (!e.isIntersecting) continue;
                    if (e.target === hero) setActive(-1);
                    else setActive(STAGES.findIndex((s) => s.id === e.target.id));
                }
            },
            { rootMargin: "-45% 0px -45% 0px" },
        );
        els.forEach((el) => io.observe(el));
        if (hero) io.observe(hero);
        return () => io.disconnect();
    }, []);

    const stage = active >= 0 ? STAGES[active] : null;

    // where the hero ends and where the core sits centred, in scroll px —
    // re-measured whenever layout can move (resize, fonts, images)
    const geo = useRef({ heroEnd: 1, coreAt: 1 });
    useEffect(() => {
        const measure = () => {
            const vh = window.innerHeight;
            const core = document.getElementById("core");
            const top = core ? core.getBoundingClientRect().top + window.scrollY : vh * 6;
            geo.current = { heroEnd: vh, coreAt: top + (core?.offsetHeight ?? 0) / 2 - vh / 2 };
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(document.body);
        window.addEventListener("resize", measure);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
    }, []);

    // the shader may idle only once the veil has finished thickening
    const veil = useRef({ stage: null as StageId | null, at: 0 });
    useEffect(() => {
        veil.current = { stage: stage?.id ?? null, at: performance.now() };
    }, [stage?.id]);

    const dive = useCallback(() => journeyDive(window.scrollY, geo.current.heroEnd, geo.current.coreAt), []);
    const quiet = useCallback(() => {
        const v = veil.current;
        return v.stage !== null && OPAQUE.has(v.stage) && performance.now() - v.at > VEIL_FADE_MS;
    }, []);

    return (
        <MotionConfig reducedMotion="user">
            <div className="spiral-page journey-page relative overflow-x-clip">
                {/* the black hole, fixed behind everything — and falling with you */}
                <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
                    <div data-galaxy-fallback className="core-glow absolute left-1/2 top-1/2 size-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60" />
                    <GalaxyCanvas dive={dive} quiet={quiet} centered />
                    <GalaxyLite dive={dive} quiet={quiet} centered />
                </div>
                {/* the veil: thick over the rings, clear at the core */}
                <div
                    aria-hidden
                    className="pointer-events-none fixed inset-0 z-[1] transition-[background-color] duration-700 ease-out"
                    style={{ backgroundColor: stage ? stage.veil : "rgba(5,7,13,0)" }}
                />
                <div aria-hidden className="journey-grain pointer-events-none fixed inset-0 z-[2]" />

                <div className="relative z-10">
                    <Hero msg={msg} setMsg={setMsg} />

                    <div className="mx-auto w-full max-w-6xl px-5 lg:grid lg:grid-cols-[240px_56px_minmax(0,1fr)] lg:gap-8">
                        <aside className="hidden lg:block">
                            <div className="sticky top-24 pt-24">
                                <PacketHud stage={stage} index={active} text={text} />
                            </div>
                        </aside>

                        <FallTrack stage={stage} />

                        <div className="min-w-0">
                            <GatewayStage text={text} />
                            <ShardsStage />
                            <CacheStage />
                            <CommandStage text={text} />
                            <MiddlewareStage loggerHtml={loggerHtml} />
                            <CoreStage echoHtml={echoHtml} text={text} />
                            <JetStage text={text} />
                        </div>
                    </div>

                    <Finale />
                </div>

                {/* phones: the packet rides along as a bottom readout */}
                <AnimatePresence>
                    {stage && (
                        <motion.div
                            initial={false}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 12 }}
                            className={cn(mono, "fixed inset-x-4 bottom-4 z-30 flex items-center gap-3 rounded-full border border-white/10 bg-[#080a12]/90 px-4 py-2.5 text-[11px] tracking-[0.12em] text-[var(--text-dim)] backdrop-blur lg:hidden")}
                        >
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: stage.glow, boxShadow: `0 0 12px ${stage.glow}` }} />
                            <span className="shrink-0 whitespace-nowrap uppercase text-[var(--text-bright)]">{stage.name}</span>
                            <span className="min-w-0 truncate">{hudLines(stage.id, text)[0]}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </MotionConfig>
    );
}

/* ── the falling packet ──────────────────────────────────────────────── */

// A gutter between the HUD and the rings: the path is drawn the whole way
// down, the stretch already travelled glows, and the packet itself rides
// sticky at mid-screen — so it is always exactly where you are. Fast scrolls
// stretch its trail; at the core it is swallowed, the jet takes over.
function FallTrack({ stage }: { stage: Stage | null }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress, scrollY } = useScroll({ target: trackRef, offset: ["start center", "end center"] });
    const lit = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
    const speed = useVelocity(scrollY);
    const trail = useSpring(useTransform(speed, [-4000, 0, 4000], [1, 1, reduce ? 1 : 3.2]), { stiffness: 200, damping: 30 });

    const swallowed = stage?.id === "core" || stage?.id === "jet";
    const glow = stage?.glow ?? "#c8d8f0";

    return (
        <div ref={trackRef} aria-hidden className="relative hidden lg:block">
            <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.14)_0_2px,transparent_2px_10px)]" />
            <motion.span
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 origin-top bg-gradient-to-b from-[#c8d8f0] via-[#d9925c] to-[#fff4e2]"
                style={{ scaleY: lit }}
            />
            <div className="sticky top-1/2 flex h-0 justify-center">
                <motion.div
                    className="relative -translate-y-1/2"
                    animate={{ opacity: swallowed ? 0 : 1, scale: swallowed ? 0.2 : 1 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <motion.span
                        className="absolute bottom-1/2 left-1/2 h-20 w-[3px] -translate-x-1/2 origin-bottom rounded-full"
                        style={{ scaleY: trail, background: `linear-gradient(to top, ${glow}, transparent)` }}
                    />
                    <span
                        className="journey-orb relative block size-4 rounded-full transition-[background,box-shadow] duration-700"
                        style={{ background: `radial-gradient(circle, #fff 0%, ${glow} 55%)`, boxShadow: `0 0 0 5px ${glow}22, 0 0 28px 6px ${glow}99` }}
                    />
                </motion.div>
            </div>
        </div>
    );
}

/* ── hero ─────────────────────────────────────────────────────────────── */

function Hero({ msg, setMsg }: { msg: string; setMsg: (v: string) => void }) {
    return (
        <section id="journey-hero" className="relative flex min-h-screen flex-col items-center justify-center gap-12 px-5 pb-16 pt-28 text-center">
            <div aria-hidden className="absolute left-1/2 top-[46%] -z-10 h-[80%] w-[140%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(3,5,11,0.6)_14%,rgba(3,5,11,0.2)_44%,transparent_68%)]" />

            <div className="flex flex-col items-center gap-5">
                <h1 className="bg-[linear-gradient(125deg,#f2d7a6_0%,#fff3d8_27%,#ffffff_39%,#eef2f7_49%,#d6dce5_78%,#c9d0da_100%)] bg-clip-text text-5xl font-semibold uppercase leading-[0.92] tracking-[0.14em] text-transparent [filter:drop-shadow(0_3px_22px_rgba(0,0,0,0.9))] sm:text-8xl lg:text-[8rem]">
                    Seyfert
                </h1>
                <p className="max-w-[34ch] text-balance text-lg leading-relaxed text-[#e7e9ee] [text-shadow:0_1px_18px_rgba(0,0,0,0.95)] sm:text-xl">
                    The TypeScript framework for Discord. Write a command, then follow it all the way into the core.
                </p>
            </div>

            {/* the composer — the packet is born here */}
            <div className="w-full max-w-xl rounded-xl border border-[#c8d8f0]/20 bg-[#0e1019]/85 p-3 text-left shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-md">
                <div className="flex items-center justify-between px-1 pb-2 text-xs text-[#8e95a8]">
                    <span># general</span>
                    <span className={cn(mono, "tracking-[0.12em]")}>SLASH COMMAND</span>
                </div>
                <label className={cn(mono, "flex items-center gap-2.5 rounded-lg bg-[#171a26] px-3 py-3 text-[15px] focus-within:ring-1 focus-within:ring-[var(--brand-indigo)]/60")}>
                    <span className="text-[#c7cbff]">/echo</span>
                    <span className="rounded bg-[#262a3a] px-1.5 py-px text-[12px] text-[#a3acc2]">message</span>
                    <input
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        maxLength={40}
                        spellCheck={false}
                        aria-label="Message for /echo"
                        className="min-w-0 flex-1 bg-transparent text-[var(--text-bright)] outline-none"
                    />
                    <span aria-hidden className="journey-caret h-4 w-px bg-[var(--text-bright)]/70" />
                </label>
                <p className="px-1 pt-2 text-xs text-[#8e95a8]">Edit it. Every ring below shows what Seyfert does with your text.</p>
            </div>

            <div className="flex flex-col items-center gap-5">
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                    <Link
                        href="/docs/learn/getting-started"
                        className="group inline-flex h-11 items-center gap-2 bg-[#f8f1e4] px-10 text-sm font-semibold text-[var(--space-void)] shadow-[0_0_34px_8px_rgba(240,206,142,0.3)] transition-all hover:bg-white hover:shadow-[0_0_48px_13px_rgba(240,206,142,0.48)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]"
                    >
                        Get started
                        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <InstallPill />
                </div>
                <a href="#gateway" className={cn(mono, "group flex flex-col items-center gap-2 text-[11px] tracking-[0.28em] text-[var(--text-dim)] hover:text-[var(--text-bright)]")}>
                    FOLLOW YOUR COMMAND
                    <span aria-hidden className="journey-drop block h-10 w-px bg-gradient-to-b from-[#c8d8f0] to-transparent" />
                </a>
            </div>
        </section>
    );
}

/* ── the packet HUD (desktop rail) ───────────────────────────────────── */

function hudLines(id: StageId, text: string): string[] {
    switch (id) {
        case "gateway": return ["op 0 · INTERACTION_CREATE", `options[0].value = "${text}"`, "types: none yet"];
        case "shards": return ["ShardManager → shard 11", "WorkerManager → worker 1", "socket: open"];
        case "cache": return ["MemoryAdapter ← user, member", "next lookup: no REST call", "84 MB at load"];
        case "command": return ["HandleCommand → EchoCommand", "ctx.options.message: string", `= "${text}"`];
        case "middleware": return ["logger ✓", "next()", "→ run()"];
        case "core": return ["EchoCommand.run(ctx)", `ctx.write({ content: "${text}" })`, "your response: ctx.write()"];
        case "jet": return ["POST /interactions/…/callback", "delivered to #general", `"${text}"`];
    }
}

// HUD readouts print in like a terminal. Remounted per line (key = text), so
// the effect only ever advances the cursor — the full text is laid out from
// the first frame (invisible tail) and nothing reflows while it types.
function TypeLine({ text, delay }: { text: string; delay: number }) {
    const reduce = useReducedMotion();
    const [shown, setShown] = useState(0);
    useEffect(() => {
        if (reduce) return;
        let id: ReturnType<typeof setInterval> | undefined;
        const start = setTimeout(() => {
            let n = 0;
            id = setInterval(() => {
                n += 2;
                setShown(Math.min(n, text.length));
                if (n >= text.length) clearInterval(id);
            }, 18);
        }, delay);
        return () => {
            clearTimeout(start);
            if (id) clearInterval(id);
        };
    }, [text, delay, reduce]);
    const n = reduce ? text.length : shown;
    return (
        <span className="break-words text-[12px] text-[#d6d9e2]">
            <span className="sr-only">{text}</span>
            <span aria-hidden>
                {text.slice(0, n)}
                <span className="opacity-0">{text.slice(n)}</span>
            </span>
        </span>
    );
}

function PacketHud({ stage, index, text }: { stage: Stage | null; index: number; text: string }) {
    return (
        <div className={cn(mono, "flex flex-col gap-6 text-[11px] tracking-[0.12em]")}>
            <div className="flex items-center gap-4">
                <span className="relative flex size-12 items-center justify-center">
                    <span
                        className="journey-orb absolute inset-0 rounded-full transition-[background,box-shadow] duration-700"
                        style={{
                            background: `radial-gradient(circle, #fff 0%, ${stage?.glow ?? "#c8d8f0"} 35%, transparent 70%)`,
                            boxShadow: `0 0 34px 6px ${(stage?.glow ?? "#c8d8f0")}55`,
                        }}
                    />
                </span>
                <div className="flex flex-col gap-1">
                    <span className="text-[var(--text-dim)]">YOUR PACKET</span>
                    <span className="text-[13px] text-[var(--text-bright)]">/echo “{text}”</span>
                </div>
            </div>

            <div className="relative min-h-[92px] rounded-lg border border-white/10 bg-[#080a12]/80 p-4 backdrop-blur">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={stage?.id ?? "hero"}
                        initial={false}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                        transition={{ duration: 0.28 }}
                        className="flex flex-col gap-1.5 normal-case tracking-normal"
                    >
                        {stage ? (
                            hudLines(stage.id, text).filter(Boolean).map((l, i) => (
                                <TypeLine key={l} text={l} delay={i * 140} />
                            ))
                        ) : (
                            <span className="text-[12px] text-[var(--text-dim)]">Waiting in #general. Scroll to send it.</span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* backed like the readout above: at the core the disk behind is bright */}
            <ol className="flex flex-col rounded-lg bg-[#080a12]/70 py-2 pr-3 backdrop-blur">
                {STAGES.map((s, i) => {
                    const passed = i < index;
                    const here = i === index;
                    return (
                        <li key={s.id}>
                            <a
                                href={`#${s.id}`}
                                className={cn(
                                    "flex items-center gap-3 border-l py-2 pl-4 uppercase transition-colors focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]",
                                    here ? "border-[var(--text-bright)] text-[var(--text-bright)]" : passed ? "border-white/25 text-[var(--text-dim)]" : "border-white/8 text-[var(--text-dim)]/60 hover:text-[var(--text-dim)]",
                                )}
                            >
                                <span className="size-1.5 rounded-full transition-colors" style={{ background: here || passed ? s.glow : "rgba(255,255,255,0.15)" }} />
                                {s.name}
                            </a>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ── stage scaffolding ───────────────────────────────────────────────── */

function StageShell({
    stage,
    title,
    intro,
    depth,
    children,
    className,
}: {
    stage: StageId;
    title: React.ReactNode;
    intro: React.ReactNode;
    /** 0 = outermost ring; the arc tightens as we fall */
    depth: number;
    children: React.ReactNode;
    className?: string;
}) {
    const s = STAGES.find((x) => x.id === stage)!;
    const width = 100 - depth * 11;
    return (
        <section id={stage} className={cn("relative scroll-mt-24 py-28", className)}>
            {/* the ring we are crossing, in perspective */}
            <svg aria-hidden viewBox="0 0 1000 140" preserveAspectRatio="none" className="pointer-events-none absolute left-1/2 top-0 h-[64px] -translate-x-1/2 overflow-visible sm:h-[140px]" style={{ width: `${width}%` }}>
                <ellipse cx="500" cy="140" rx="498" ry="132" fill="none" stroke={s.glow} strokeOpacity="0.22" strokeWidth="1" />
                <ellipse className="journey-ring" cx="500" cy="140" rx="498" ry="132" fill="none" stroke={s.glow} strokeOpacity="0.75" strokeWidth="1.4" strokeDasharray="2 18" />
                <ellipse cx="500" cy="140" rx="498" ry="132" fill="none" stroke={s.glow} strokeOpacity="0.08" strokeWidth="14" />
            </svg>
            {/* ghost name of the ring — texture, not content */}
            <span aria-hidden className="journey-ghost pointer-events-none absolute -top-2 right-0 select-none text-[clamp(72px,12vw,176px)] font-semibold uppercase leading-none tracking-[0.08em]">
                {s.name.split(" ")[0]}
            </span>

            <div className="relative flex flex-col gap-5 pt-16">
                <div className={cn(mono, "flex items-center gap-3 text-[11px] tracking-[0.25em] text-[var(--text-dim)]")}>
                    <span className="size-2 rounded-full" style={{ background: s.glow, boxShadow: `0 0 12px ${s.glow}` }} />
                    <span className="uppercase">{s.ring}</span>
                    <span className="h-px w-10 bg-white/15" />
                    <span className="uppercase text-[var(--text-bright)]">{s.name}</span>
                </div>
                <h2 className="max-w-[20ch] text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.02em] sm:text-5xl">{title}</h2>
                <div className="max-w-[56ch] text-[16px] leading-relaxed text-[var(--text-dim)]">{intro}</div>
            </div>
            <div className="relative mt-12">{children}</div>
        </section>
    );
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            className={className}
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

function Panel({ label, aside, glow, children, className }: { label: string; aside?: React.ReactNode; glow?: string; children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn("overflow-hidden rounded-lg border bg-[#080a12]/85 backdrop-blur-sm", className)}
            style={{ borderColor: glow ? `${glow}40` : "rgba(255,255,255,0.1)", boxShadow: glow ? `0 0 60px ${glow}12, inset 0 1px 0 rgba(255,255,255,0.04)` : undefined }}
        >
            <div className={cn(mono, "flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-2.5 text-[11px] tracking-[0.1em] text-[var(--text-dim)]")}>
                <span style={glow ? { color: glow } : undefined}>{label}</span>
                {aside && <span className="truncate">{aside}</span>}
            </div>
            {children}
        </div>
    );
}

/* ── 0 · gateway ─────────────────────────────────────────────────────── */

const TRAFFIC = ["GUILD_CREATE", "PRESENCE_UPDATE", "MESSAGE_CREATE", "TYPING_START", "VOICE_STATE_UPDATE", "GUILD_MEMBER_UPDATE", "MESSAGE_REACTION_ADD"];

function GatewayStage({ text }: { text: string }) {
    const reduce = useReducedMotion();
    // traffic keeps flowing past; your packet (s18342) stays pinned below it
    const [seq, setSeq] = useState(18348);
    const lines = Array.from({ length: 6 }, (_, i) => {
        const n = seq - (5 - i);
        // 3 is coprime with the 7 event names, so consecutive lines differ
        return { n, t: TRAFFIC[(n * 3) % TRAFFIC.length] };
    });
    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => setSeq((s) => s + 1), 1100);
        return () => clearInterval(id);
    }, [reduce]);

    return (
        <StageShell
            stage="gateway"
            depth={0}
            title="It arrives as raw JSON"
            intro={<p>Discord streams events over a websocket, thousands of them. Yours is one line in the noise: an op code, an event name and a payload with your text inside. Nothing is typed yet.</p>}
        >
            <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <Reveal>
                    <Panel label="wss://gateway.discord.gg" aside="example">
                        <ol className={cn(mono, "flex flex-col gap-1 px-4 py-4 text-[12px]")}>
                            {lines.map((l, i) => (
                                <li key={l.n} className="journey-log flex gap-3 text-[#7f8799]" style={{ opacity: 0.35 + i * 0.1 }}>
                                    <span className="w-12 tabular-nums text-[#566]">s{l.n}</span>
                                    <span>op 0</span>
                                    <span className="truncate">{l.t}</span>
                                </li>
                            ))}
                            <li className="mt-1 flex items-center gap-3 rounded bg-[#c8d8f0]/10 px-2 py-1 text-[#e6eefb] ring-1 ring-[#c8d8f0]/30">
                                <span className="w-10 tabular-nums">s18342</span>
                                <span>op 0</span>
                                <span>INTERACTION_CREATE</span>
                                <span className="ml-auto text-[10px] tracking-[0.2em] text-[#c8d8f0]">YOURS</span>
                            </li>
                        </ol>
                    </Panel>
                </Reveal>
                <Reveal delay={0.08}>
                    <Panel label="payload" aside="d" glow="#c8d8f0">
                        <pre className={cn(mono, "overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.75] text-[#cfd6e4]")}>
{`{ "type": 2,
  "data": {
    "name": "echo",
    "options": [{
      "name": "message",
      "type": 3,
      "value": `}<span className="rounded bg-[#99ffe4]/10 px-1 text-[#99ffe4]">&quot;{text}&quot;</span>{`
    }]
  },
  "member": { … },
  "token": "…" }`}
                        </pre>
                    </Panel>
                </Reveal>
            </div>
        </StageShell>
    );
}

/* ── 1 · shards ──────────────────────────────────────────────────────── */

function ShardsStage() {
    const YOURS = 11;
    return (
        <StageShell
            stage="shards"
            depth={1}
            title="Caught by one of many shards"
            intro={<p>The <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>ShardManager</code> holds the websockets open. When one process is not enough, the <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>WorkerManager</code> spreads shards across workers. Same code, bigger bot.</p>}
        >
            <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
                <Reveal>
                    <div role="img" aria-label="32 shards across 4 workers; your packet lands on shard 11 in worker 1" className="flex flex-col gap-3">
                        {[0, 1, 2, 3].map((w) => (
                            <div key={w} className="flex items-center gap-3">
                                <span className={cn(mono, "w-6 shrink-0 text-[10px] tracking-[0.12em] text-[var(--text-dim)]/70 sm:w-16 sm:text-[10px] sm:tracking-[0.15em]")}>W<span className="hidden sm:inline">ORKER </span>{w}</span>
                                <div className="grid flex-1 grid-cols-8 gap-1.5">
                                    {Array.from({ length: 8 }, (_, k) => {
                                        const i = w * 8 + k;
                                        const yours = i === YOURS;
                                        return (
                                            <span
                                                key={i}
                                                className={cn("relative h-9 rounded-[3px] border", yours ? "border-[#e6eefb] bg-[#b9c6e6]/80" : "journey-shard border-[#b9c6e6]/15 bg-[#b9c6e6]/[0.03]")}
                                                style={yours ? { boxShadow: "0 0 0 4px rgba(185,198,230,0.12), 0 0 26px rgba(185,198,230,0.7)" } : { animationDelay: `${((i * 37) % 29) / 10}s` }}
                                            >
                                                {yours && <span className={cn(mono, "absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-[0.15em] text-[#e6eefb]")}>#{i}</span>}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        <span className={cn(mono, "pl-[36px] text-[11px] text-[var(--text-dim)]/70 sm:pl-[76px]")}>example layout · 32 shards · 4 workers</span>
                    </div>
                </Reveal>
                <Reveal delay={0.1}>
                    <figure className="flex flex-col gap-5 border-l border-[#b9c6e6]/30 pl-6">
                        <blockquote className="text-xl font-medium leading-snug tracking-[-0.01em] text-[var(--text-bright)]">
                            “Dropping our RAM usage to under 1&nbsp;GB (from almost 4&nbsp;GB) while handling 200% more servers.”
                        </blockquote>
                        <figcaption className="flex items-center gap-3 text-sm text-[var(--text-dim)]">
                            <Image src="/bots/thumbs/listen.webp" alt="" width={32} height={32} className="size-8 rounded-full" />
                            <span><span className="font-semibold text-[var(--text-bright)]">Listen</span> · large-scale music bot</span>
                        </figcaption>
                    </figure>
                </Reveal>
            </div>
        </StageShell>
    );
}

/* ── 2 · cache ───────────────────────────────────────────────────────── */

function CacheStage() {
    const multiplier = (BARS[4].mb / BARS[0].mb).toFixed(2);
    return (
        <StageShell
            stage="cache"
            depth={2}
            title="Remembered, cheaply"
            intro={<p>The user and member riding in your packet go straight into the cache, so the next command needs no REST call. <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>MemoryAdapter</code> by default, Redis with one adapter, and lighter than the rest either way.</p>}
        >
            <div id="benchmark" className="grid items-end gap-10 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
                <Reveal className="flex flex-col gap-3">
                    <span className="journey-metal text-[clamp(72px,9vw,128px)] font-semibold leading-none tracking-[-0.04em]">84<span className="text-[0.4em] tracking-normal"> MB</span></span>
                    <p className="text-[15px] text-[var(--text-dim)]">median memory under the same gateway load, <span className="text-[var(--text-bright)]">{multiplier}× lighter</span> than discord.js.</p>
                    <Link href="/benchmark" className={cn(mono, "mt-2 inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current text-[11px] tracking-[0.22em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline")}>FULL MEASUREMENTS ↗</Link>
                </Reveal>
                <Reveal delay={0.08}>
                    <div className="flex flex-col">
                        {BARS.map((b, i) => (
                            <div key={b.name} className="flex items-center gap-4 border-b border-white/[0.07] py-3.5 first:border-t">
                                <span className={cn(mono, "w-20 shrink-0 text-right text-[11px] tracking-[0.08em]", i === 0 ? "text-[var(--text-bright)]" : "text-[var(--text-dim)]")}>{b.name}</span>
                                <div className="relative h-2 flex-1 bg-white/[0.03]">
                                    <motion.div
                                        className={cn("bench-fill absolute inset-y-0 left-0 origin-left", i === 0 ? "bg-gradient-to-r from-[#b4683c] via-[#ffd9a0] to-[#fff4e2] shadow-[0_0_18px_rgba(255,217,160,0.5)]" : "bg-white/15")}
                                        style={{ width: `${(b.mb / 220) * 100}%` }}
                                        initial={false}
                                        whileInView={{ scaleX: 1 }}
                                        viewport={{ once: true, margin: "-60px" }}
                                        transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </div>
                                <span className={cn(mono, "w-14 text-right text-[12px] tabular-nums", i === 0 ? "text-[var(--text-bright)]" : "text-[var(--text-dim)]")}>{b.mb} MB</span>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </StageShell>
    );
}

/* ── 3 · command ─────────────────────────────────────────────────────── */

function CommandStage({ text }: { text: string }) {
    return (
        <StageShell
            stage="command"
            depth={3}
            title="The JSON becomes types"
            intro={<p><code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>HandleCommand</code> finds the class you declared and parses its options. By the time the packet reaches your code, <code className={cn(mono, "text-[14px] text-[#ffc799]")}>message</code> is a <code className={cn(mono, "text-[14px] text-[#ffc799]")}>string</code>, not an <code className={cn(mono, "text-[14px]")}>any</code>.</p>}
        >
            <div className="flex flex-col gap-10">
                <Reveal>
                    <div className="grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]">
                        <Panel label="before · raw option">
                            <pre className={cn(mono, "overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.75] text-[#9aa2b4]")}>{`{ "name": "message",
  "type": 3,
  "value": "${text}" }`}</pre>
                        </Panel>
                        <div aria-hidden className="hidden items-center md:flex">
                            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-[#d9925c]" />
                            <span className="text-[#d9925c]">▸</span>
                        </div>
                        <Panel label="after · CommandContext" glow="#d9925c">
                            <div className={cn(mono, "flex flex-col gap-3 px-4 py-4 text-[12.5px] leading-[1.75]")}>
                                <span className="text-[#e5e5e5]">ctx.options.<span className="text-[#ffc799]">message</span></span>
                                <span className="w-fit rounded-md border border-white/10 bg-[#15121a] px-2.5 py-1 text-[12px] text-[#d4d4d4] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                                    (property) message: <span className="text-[#ffc799]">string</span>
                                </span>
                                <span className="text-[#7d8590]">{"// = "}<span className="text-[#99ffe4]">&quot;{text}&quot;</span></span>
                            </div>
                        </Panel>
                    </div>
                </Reveal>
                <Reveal delay={0.08}>
                    <div className="flex flex-col gap-4 border-t border-white/[0.07] pt-6">
                        <span className={cn(mono, "text-[11px] tracking-[0.22em] text-[var(--text-dim)]")}>WHAT THIS RING SAVES YOU FROM WRITING</span>
                        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-[15px]">
                            {["a command loader", "an interaction dispatcher", "node deploy-commands.js"].map((t) => (
                                <li key={t} className="flex items-center gap-2.5 text-[var(--text-dim)]">
                                    <span className="line-through decoration-[#d9925c]/70 decoration-2">{t}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm text-[var(--text-dim)]/80">The discord.js guide has you write all three by hand. Here, <code className={cn(mono, "text-[13px] text-[var(--text-bright)]")}>client.start()</code> loads your commands and <code className={cn(mono, "text-[13px] text-[var(--text-bright)]")}>uploadCommands()</code> registers them.</p>
                    </div>
                </Reveal>
            </div>
        </StageShell>
    );
}

/* ── 4 · middleware ──────────────────────────────────────────────────── */

function MiddlewareStage({ loggerHtml }: { loggerHtml: string }) {
    const gates = [
        { name: "logger", note: "your middleware" },
        { name: "cooldown", note: "@slipher/cooldown" },
        { name: "permissions", note: "built in" },
    ];
    return (
        <StageShell
            stage="middleware"
            depth={4}
            title="Checked at the last ring"
            intro={<p>Logging, cooldowns, permissions. Each gate can let the packet through or stop it here. You attach yours with one decorator: <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>@Middlewares([&apos;logger&apos;])</code>.</p>}
        >
            <div className="flex flex-col gap-8">
                <Reveal>
                    <div className="relative py-6">
                        {/* the gate line: across on wide screens, down on phones */}
                        <span aria-hidden className="absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-[#e8a46a]/10 via-[#e8a46a]/50 to-[#fff4e2]/80 sm:block" />
                        <span aria-hidden className="absolute inset-y-0 left-[22px] w-px bg-gradient-to-b from-[#e8a46a]/10 via-[#e8a46a]/50 to-[#fff4e2]/80 sm:hidden" />
                        <span aria-hidden className="journey-travel absolute top-1/2 hidden size-3 -translate-y-1/2 rounded-full bg-[#fff4e2] shadow-[0_0_18px_4px_rgba(232,164,106,0.8)] sm:block" />
                        <ol className="relative grid gap-5 sm:grid-cols-3 sm:gap-4">
                            {gates.map((g) => (
                                <li key={g.name} className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
                                    <span className={cn(mono, "flex items-center gap-2 rounded-full border border-[#e8a46a]/40 bg-[#120c09]/90 px-4 py-2 text-[12px] text-[var(--text-bright)] backdrop-blur")}>
                                        <span className="text-[#99ffe4]">✓</span>{g.name}
                                    </span>
                                    <span className="text-[12px] text-[var(--text-dim)]">{g.note}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </Reveal>
                <Reveal delay={0.08}>
                    <Panel label="logger.middleware.ts" aside="[INFO] you ran /echo" glow="#e8a46a">
                        <div className={cn(mono, "journey-code overflow-x-auto px-4 py-4 text-[12.5px]")} dangerouslySetInnerHTML={{ __html: loggerHtml }} />
                    </Panel>
                </Reveal>
            </div>
        </StageShell>
    );
}

/* ── 5 · core ────────────────────────────────────────────────────────── */

function CoreStage({ echoHtml, text }: { echoHtml: string; text: string }) {
    return (
        // the gap above the copy is deliberate: the veil lifts and, for half a
        // screen, there is nothing between you and the hole you fell into
        <section id="core" className="relative flex min-h-[130vh] scroll-mt-24 flex-col items-center justify-end gap-10 pb-24 pt-[40vh] text-center sm:pt-[55vh]">
            <div className="flex max-w-2xl flex-col items-center gap-5">
                <div className={cn(mono, "flex items-center gap-3 text-[11px] tracking-[0.25em] text-[#e1e3e8] [text-shadow:0_1px_12px_rgba(0,0,0,0.95)]")}>
                    <span className="size-2 rounded-full bg-[#fff4e2] shadow-[0_0_14px_#ffd9a0]" />
                    THE CORE <span className="h-px w-10 bg-white/20" /> <span className="text-[var(--text-bright)]">YOUR CODE</span>
                </div>
                <h2 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.025em] [text-shadow:0_2px_30px_rgba(0,0,0,0.95)] sm:text-6xl">
                    Everything before this was the framework
                </h2>
                <p className="max-w-[44ch] text-[17px] leading-relaxed text-[#e1e3e8] [text-shadow:0_1px_18px_rgba(0,0,0,0.95)]">
                    At the center there is only the part you wrote. One file, one class, one <code className={cn(mono, "text-[15px] text-[#ffc799]")}>run</code>.
                </p>
            </div>
            <Reveal className="w-full max-w-2xl text-left">
                <Panel label="src/commands/echo.ts" aside="the whole file" glow="#ffd9a0" className="bg-[#0b0806]/90">
                    <div className={cn(mono, "journey-code overflow-x-auto px-4 py-4 text-[12.5px]")} dangerouslySetInnerHTML={{ __html: echoHtml }} />
                    <div className={cn(mono, "flex items-center gap-3 border-t border-white/[0.07] px-4 py-3 text-[12px] text-[var(--text-dim)]")}>
                        <span className="text-[#ffd9a0]">→</span>
                        ctx.write(&#123; content: <span className="text-[#99ffe4]">&quot;{text}&quot;</span> &#125;)
                    </div>
                </Panel>
            </Reveal>
        </section>
    );
}

/* ── 6 · jet ─────────────────────────────────────────────────────────── */

function JetStage({ text }: { text: string }) {
    return (
        <section id="jet" className="relative scroll-mt-24 pb-28 pt-8">
            <div className="relative flex flex-col items-center gap-10 text-center">
                {/* the relativistic jet: the reply leaves the core in brand
                    light, passes behind the copy and lands on the message card
                    (bottom-[-40px] = the gap-10 between this block and the card) */}
                <div className="relative flex w-full flex-col items-center">
                <div aria-hidden className="pointer-events-none absolute -bottom-10 left-1/2 top-[-30vh] w-24 -translate-x-1/2">
                    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-[#fff4e2] via-[#818cf8] to-[#818cf8]" />
                    <span className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-b from-[#ffd9a0]/25 via-[#818cf8]/15 to-[#818cf8]/30 blur-xl" />
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className="journey-jet absolute left-1/2 size-1 rounded-full bg-[#c7cbff]" style={{ animationDelay: `${i * 0.55}s`, marginLeft: `${((i * 13) % 9) - 4}px` }} />
                    ))}
                </div>

                {/* copy sits in its own pocket of dark so the beam reads as passing behind it */}
                <div className="relative flex max-w-xl flex-col items-center gap-5 before:absolute before:-inset-x-16 before:-inset-y-10 before:bg-[radial-gradient(ellipse_at_center,rgba(5,7,13,0.92)_35%,transparent_72%)] [&>*]:relative">
                    <div className={cn(mono, "flex items-center gap-3 text-[11px] tracking-[0.25em] text-[var(--text-dim)]")}>
                        <span className="size-2 rounded-full bg-[var(--brand-indigo)] shadow-[0_0_14px_var(--brand-indigo)]" />
                        THE JET <span className="h-px w-10 bg-white/20" /> <span className="text-[var(--text-bright)]">BACK TO DISCORD</span>
                    </div>
                    <h2 className="text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.02em] sm:text-5xl">And out it goes</h2>
                    <p className="text-[16px] leading-relaxed text-[var(--text-dim)]">A Seyfert galaxy shoots energy out of its core. So does your bot: <code className={cn(mono, "text-[14px] text-[#ffc799]")}>ctx.write</code> answers the interaction over REST and your text lands in the channel.</p>
                </div>
                </div>

                <Reveal className="w-full max-w-lg text-left">
                    <div className="rounded-xl border border-[#818cf8]/30 bg-[#0e1019]/90 p-4 shadow-[0_0_80px_rgba(129,140,248,0.15)] backdrop-blur">
                        <div className="pb-3 text-xs text-[#8e95a8]"># general</div>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3 text-sm">
                                <span aria-hidden className="size-9 shrink-0 rounded-full bg-[#2a2f45]" />
                                <div className="flex flex-col">
                                    <span><span className="font-semibold">you</span> <span className="text-xs text-[#8e95a8]">used <span className="text-[#c7cbff]">/echo</span></span></span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-indigo)]">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" fill="#05070d" /><ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="#05070d" strokeWidth="1.6" transform="rotate(-20 12 12)" /></svg>
                                </span>
                                <div className="flex min-w-0 flex-col gap-0.5">
                                    <span className="text-sm"><span className="font-semibold">Echo</span> <span className="rounded-[3px] bg-[#5865f2] px-1 py-px text-[10px] font-semibold text-white">APP</span></span>
                                    <span className="break-words text-[15px] text-[#e5e5e5]">{text}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Reveal>

                <Reveal delay={0.08} className="w-full">
                    <div className="flex flex-col items-center gap-6 pt-10">
                        <span className={cn(mono, "text-[11px] tracking-[0.22em] text-[var(--text-dim)]")}>THE SAME PATH, IN PRODUCTION</span>
                        <ul className="grid w-full grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 xl:grid-cols-4">
                            {BOTS.map((b) => (
                                <li key={b.name} className="group flex flex-col gap-3 bg-[#070910]/95 p-5 text-left transition-colors hover:bg-[#0c0f1a]">
                                    <span className="flex items-center gap-3">
                                        <Image src={b.avatar} alt="" width={32} height={32} unoptimized={b.avatar.endsWith(".gif")} className="size-8 rounded-full ring-1 ring-white/10 transition-shadow group-hover:ring-[var(--brand-indigo)]/60" />
                                        <span className="text-sm font-semibold">{b.name}</span>
                                    </span>
                                    <span className="text-[13px] leading-relaxed text-[var(--text-dim)]">“{b.text}”</span>
                                </li>
                            ))}
                        </ul>
                        <a href="https://github.com/tiramisulabs/seyfert-web" target="_blank" className={cn(mono, "inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current text-[11px] tracking-[0.22em] text-[var(--text-dim)] hover:text-[var(--text-bright)]")}>ADD YOURS — OPEN A PR ↗</a>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

/* ── finale ──────────────────────────────────────────────────────────── */

function Finale() {
    return (
        <section className="relative mx-auto flex max-w-6xl flex-col items-center gap-7 px-5 pb-36 pt-16 text-center">
            <h2 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.025em] sm:text-6xl">
                Your command is <span className="text-[var(--brand-indigo)]">next</span>
            </h2>
            <p className="max-w-[44ch] text-pretty text-[17px] text-[var(--text-dim)]">One file in, one reply out. The guide walks you through the first one.</p>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
                <Link href="/docs/learn/getting-started" className="group inline-flex h-11 items-center gap-2 bg-[#f8f1e4] px-10 text-sm font-semibold text-[var(--space-void)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]">
                    Write your first command
                    <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link href="https://discord.gg/hEeJNaSqnS" target="_blank" className={cn(mono, "inline-flex h-11 items-center gap-2 border border-white/15 px-8 text-xs tracking-[0.22em] text-[var(--text-bright)] transition-colors hover:border-[var(--brand-indigo)] hover:bg-[var(--brand-indigo)]/10")}>
                    DISCORD ↗
                </Link>
            </div>
            <InstallPill />
        </section>
    );
}
