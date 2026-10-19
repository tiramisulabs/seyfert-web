"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import {
    motion,
    useReducedMotion,
    useScroll,
    useSpring,
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
    name: string;
    /** ASTRO colour of this depth — used for the packet + ring art only */
    glow: string;
    /** veil over the black hole while this stage is centred */
    veil: string;
};

// colour temperature rises as the packet falls: star-blue → copper → white-hot,
// then the reply leaves in brand indigo
const STAGES: Stage[] = [
    { id: "gateway", name: "Gateway", glow: "#c8d8f0", veil: "rgba(5,7,13,0.88)" },
    { id: "shards", name: "Shards", glow: "#b9c6e6", veil: "rgba(6,8,15,0.9)" },
    { id: "cache", name: "Cache", glow: "#e2c08f", veil: "rgba(10,9,13,0.9)" },
    { id: "command", name: "Command", glow: "#d9925c", veil: "rgba(14,10,10,0.9)" },
    { id: "middleware", name: "Middleware", glow: "#e8a46a", veil: "rgba(16,10,8,0.86)" },
    { id: "core", name: "Your code", glow: "#fff4e2", veil: "rgba(5,7,13,0.65)" },
    { id: "jet", name: "Back to Discord", glow: "#818cf8", veil: "rgba(5,7,13,0.9)" },
];

// stages whose veil is thick enough to hide the black hole's frame rate
const OPAQUE: ReadonlySet<StageId> = new Set(["gateway", "shards", "cache", "command", "middleware", "jet"]);
const VEIL_FADE_MS = 700;

// The fall, as a dive target for the shader (0 = rest, 1 = hero dive).
// Hero: a gentle first-viewport dive. Then free fall —
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

export type EchoPart = "imports" | "options" | "declare" | "run";

export function JourneyRefined({ echoHtml, loggerHtml }: { echoHtml: Record<EchoPart, string>; loggerHtml: string }) {
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
        <main className="spiral-page journey-refined-page relative overflow-x-clip">
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
                style={{ backgroundColor: stage ? stage.veil : "rgba(5,7,13,0.28)" }}
            />

            <div className="relative z-10">
                <Hero msg={msg} setMsg={setMsg} />

                <div className="mx-auto w-full max-w-6xl px-5 lg:grid lg:grid-cols-[200px_32px_minmax(0,1fr)] lg:gap-8">
                    <MobileStageNav stage={stage} />
                    <aside className="hidden lg:block">
                        <div className="sticky top-16 py-10">
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

        </main>
    );
}

/* ── the falling packet ──────────────────────────────────────────────── */

// The packet marks the reader's progress; the supporting sections stay still.
function FallTrack({ stage }: { stage: Stage | null }) {
    const trackRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start center", "end center"] });
    const lit = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
    const swallowed = stage?.id === "core" || stage?.id === "jet";
    const glow = stage?.glow ?? "#c8d8f0";

    return (
        <div ref={trackRef} aria-hidden className="relative hidden lg:block">
            <span className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
            <motion.span
                className="absolute inset-y-0 left-1/2 w-px origin-top bg-[#d9925c]/60"
                style={{ scaleY: reduce ? scrollYProgress : lit }}
            />
            <div className="sticky top-1/2 flex h-0 justify-center">
                <span
                    className="block size-2.5 -translate-y-1/2 rounded-full transition-opacity duration-300"
                    style={{ opacity: swallowed ? 0 : 1, background: glow, boxShadow: `0 0 16px ${glow}80` }}
                />
            </div>
        </div>
    );
}

/* ── hero ─────────────────────────────────────────────────────────────── */

function Hero({ msg, setMsg }: { msg: string; setMsg: (v: string) => void }) {
    return (
        <section id="journey-hero" className="relative flex min-h-[calc(100svh-60px)] flex-col items-center justify-center gap-10 px-5 pb-16 pt-20 text-center">
            <div aria-hidden className="absolute left-1/2 top-[46%] -z-10 h-[80%] w-[140%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(3,5,11,0.6)_14%,rgba(3,5,11,0.2)_44%,transparent_68%)]" />

            <div className="flex flex-col items-center gap-5">
                <h1 className="bg-[linear-gradient(125deg,#f2d7a6_0%,#fff3d8_27%,#ffffff_39%,#eef2f7_49%,#d6dce5_78%,#c9d0da_100%)] bg-clip-text text-5xl font-semibold uppercase leading-[0.92] tracking-[0.14em] text-transparent [filter:drop-shadow(0_3px_22px_rgba(0,0,0,0.9))] sm:text-7xl lg:text-[6.5rem]">
                    Seyfert
                </h1>
                <p className="max-w-[34ch] text-balance text-lg leading-relaxed text-[#e7e9ee] [text-shadow:0_1px_18px_rgba(0,0,0,0.95)] sm:text-xl">
                    The TypeScript framework for Discord. Write a command, then follow it all the way into the core.
                </p>
            </div>

            {/* the composer — the packet is born here */}
            <div className="w-full max-w-xl rounded-xl border border-[#c8d8f0]/20 bg-[#0e1019]/90 p-3 text-left shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-md">
                <div className="flex items-center justify-between px-1 pb-2 text-xs text-[#9ba4b8]">
                    <span># general</span>
                    <span className={cn(mono, "text-[10px] tracking-[0.12em]")}>SLASH COMMAND</span>
                </div>
                <label className={cn(mono, "flex items-center gap-2 rounded-lg bg-[#171a26] px-3 py-3 text-sm focus-within:ring-2 focus-within:ring-[var(--brand-indigo)] sm:text-[15px]")}>
                    <span className="shrink-0 text-[#c7cbff]">/echo</span>
                    <span className="shrink-0 rounded bg-[#262a3a] px-1.5 py-px text-[11px] text-[#a3acc2]">message</span>
                    <input
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        maxLength={40}
                        spellCheck={false}
                        aria-label="Message for /echo"
                        aria-describedby="echo-hint"
                        className="min-w-0 flex-1 bg-transparent text-[var(--text-bright)] outline-none"
                    />
                </label>
                <p id="echo-hint" className="px-1 pt-2 text-xs leading-relaxed text-[#9ba4b8]">Edit it. Every ring below shows what Seyfert does with your text.</p>
            </div>

            <div className="flex flex-col items-center gap-5">
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                    <Link
                        href="/docs/learn/getting-started"
                        className="group inline-flex h-11 items-center gap-2 bg-[#f8f1e4] px-8 text-sm font-semibold text-[var(--space-void)] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]"
                    >
                        Get started
                        <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <InstallPill />
                </div>
                <a href="#gateway" className={cn(mono, "group flex min-h-11 flex-col items-center gap-2 text-[11px] tracking-[0.28em] text-[var(--text-dim)] hover:text-[var(--text-bright)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)]")}>
                    FOLLOW YOUR COMMAND
                    <span aria-hidden className="journey-refined-drop block h-10 w-px bg-gradient-to-b from-[#c8d8f0] to-transparent" />
                </a>
            </div>
        </section>
    );
}

/* ── the packet HUD (desktop rail) ───────────────────────────────────── */

function hudLines(id: StageId, text: string): string[] {
    switch (id) {
        case "gateway": return ["op 0 · INTERACTION_CREATE", `options[0].value = ${JSON.stringify(text)}`, "types: none yet"];
        case "shards": return ["ShardManager → shard 11", "WorkerManager → worker 1", "socket: open"];
        case "cache": return ["MemoryAdapter ← user, member", "reuse cached data on later lookups", "84 MB in the benchmark"];
        case "command": return ["HandleCommand → EchoCommand", "ctx.options.message: string", `= ${JSON.stringify(text)}`];
        case "middleware": return ["none attached to /echo", "yours: next() or stop()"];
        case "core": return ["EchoCommand.run(ctx)", `ctx.write({ content: ${JSON.stringify(text)} })`, "your code: 1 line"];
        case "jet": return ["POST /interactions/…/callback", "delivered to #general", JSON.stringify(text)];
    }
}

function PacketHud({ stage, index, text }: { stage: Stage | null; index: number; text: string }) {
    return (
        <div className={cn(mono, "flex flex-col gap-6 text-[11px]")}>
            <div className="flex flex-col gap-2">
                <span className="tracking-[0.14em] text-[var(--text-dim)]">YOUR COMMAND</span>
                <span className="break-words text-[13px] leading-relaxed text-[var(--text-bright)]">/echo “{text}”</span>
            </div>
            <nav aria-label="Command stages">
                <ol className="flex flex-col border-l border-white/10">
                    {STAGES.map((s, i) => (
                        <li key={s.id}>
                            <a
                                href={`#${s.id}`}
                                aria-current={i === index ? "step" : undefined}
                                className={cn(
                                    "-ml-px flex min-h-11 items-center gap-3 border-l pl-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-indigo)]",
                                    i === index ? "border-[#ffd9a0] text-[var(--text-bright)]" : "border-transparent text-[var(--text-dim)] hover:text-[var(--text-bright)]",
                                )}
                            >
                                <span aria-hidden className="size-1 shrink-0 rounded-full" style={{ background: i <= index ? s.glow : "#505361" }} />
                                {s.name}
                            </a>
                        </li>
                    ))}
                </ol>
            </nav>
            <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-[#b6bdca]">
                {stage ? hudLines(stage.id, text).map((line) => <span key={line} className="break-words">{line}</span>) : <span>Follow your message from Discord to your code.</span>}
            </div>
        </div>
    );
}

function MobileStageNav({ stage }: { stage: Stage | null }) {
    return (
        <div className="sticky top-0 z-30 -mx-5 border-y border-white/10 bg-[#080a12]/95 px-5 backdrop-blur-md lg:hidden">
            <details className="group relative">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--brand-indigo)] [&::-webkit-details-marker]:hidden">
                    <span className={cn(mono, "text-xs text-[var(--text-dim)]")}>Follow /echo</span>
                    <span className="flex items-center gap-3">
                        <span>{stage?.name ?? "Choose a stage"}</span>
                        <svg aria-hidden viewBox="0 0 16 16" fill="none" className="size-4 transition-transform group-open:rotate-180"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </span>
                </summary>
                <nav aria-label="Command stages" className="absolute -inset-x-5 top-full max-h-[70svh] overflow-y-auto border-b border-white/15 bg-[#080a12] px-5 py-3 shadow-xl">
                    <a href="#journey-hero" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex min-h-11 items-center border-b border-white/10 text-sm text-[var(--text-dim)] focus-visible:outline-2 focus-visible:outline-[var(--brand-indigo)]">Your command ↑</a>
                    <ol>
                        {STAGES.map((s) => (
                            <li key={s.id}>
                                <a
                                    href={`#${s.id}`}
                                    aria-current={stage?.id === s.id ? "step" : undefined}
                                    onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
                                    className={cn("flex min-h-11 items-center gap-3 text-sm focus-visible:outline-2 focus-visible:outline-[var(--brand-indigo)]", stage?.id === s.id ? "text-[#fff4e2]" : "text-[var(--text-dim)] hover:text-white")}
                                >
                                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: s.glow }} />
                                    {s.name}
                                </a>
                            </li>
                        ))}
                    </ol>
                </nav>
            </details>
        </div>
    );
}

/* ── stage scaffolding ───────────────────────────────────────────────── */

function StageShell({ stage, title, intro, children }: {
    stage: StageId;
    title: React.ReactNode;
    intro: React.ReactNode;
    children: React.ReactNode;
}) {
    const s = STAGES.find((x) => x.id === stage)!;
    return (
        <section id={stage} className="relative scroll-mt-20 border-t border-white/10 py-14 sm:py-20">
            <div className="flex flex-col gap-4">
                <div className={cn(mono, "flex items-center gap-3 text-xs text-[var(--text-dim)]")}>
                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: s.glow }} />
                    {s.name}
                </div>
                <h2 className="max-w-[24ch] text-balance text-3xl font-semibold leading-[1.1] tracking-[-0.02em] sm:text-4xl">{title}</h2>
                <div className="max-w-[58ch] text-base leading-relaxed text-[var(--text-dim)]">{intro}</div>
            </div>
            <div className="mt-8">{children}</div>
        </section>
    );
}

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

function Panel({ label, aside, glow, children, className }: { label: string; aside?: React.ReactNode; glow?: string; children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn("overflow-hidden rounded-lg border bg-[#080a12]/95", className)}
            style={{ borderColor: glow ? `${glow}40` : "rgba(255,255,255,0.1)" }}
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
    const lines = TRAFFIC.slice(0, 4).map((t, i) => ({ n: 18338 + i, t }));

    return (
        <StageShell
            stage="gateway"
            title="It arrives as raw JSON"
            intro={<p>Discord streams events over a websocket, thousands of them. Yours is one line in the noise: an op code, an event name and a payload with your text inside. Nothing is typed yet.</p>}
        >
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <Reveal>
                    <Panel label="wss://gateway.discord.gg" aside="example">
                        <ol className={cn(mono, "flex flex-col gap-1 px-4 py-4 text-[12px]")}>
                            {lines.map((l) => (
                                <li key={l.n} className="flex min-w-0 gap-2 text-[#8791a7]">
                                    <span className="w-12 shrink-0 tabular-nums text-[#8791a7]">s{l.n}</span>
                                    <span>op 0</span>
                                    <span className="truncate">{l.t}</span>
                                </li>
                            ))}
                            <li className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded bg-[#c8d8f0]/10 px-2 py-1 text-[#e6eefb] ring-1 ring-[#c8d8f0]/30">
                                <span className="w-10 tabular-nums">s18342</span>
                                <span>op 0</span>
                                <span className="break-all">INTERACTION_CREATE</span>
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
      "value": `}<span className="rounded bg-[#99ffe4]/10 px-1 text-[#99ffe4]">{JSON.stringify(text)}</span>{`
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
            title="Caught by one of many shards"
            intro={<p>The <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>ShardManager</code> holds the websockets open. When one process is not enough, the <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>WorkerManager</code> spreads shards across workers. Same code, bigger bot.</p>}
        >
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-10 xl:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
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
                                                className={cn("relative h-9 rounded-[3px] border", yours ? "border-[#e6eefb] bg-[#b9c6e6]/80" : "border-[#b9c6e6]/15 bg-[#b9c6e6]/[0.03]")}
                                                style={yours ? { boxShadow: "0 0 0 4px rgba(185,198,230,0.12), 0 0 26px rgba(185,198,230,0.7)" } : undefined}
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
            title="Remembered, cheaply"
            intro={<p>The user and member riding in your packet go into the cache, so later lookups can reuse them without a REST call. <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>MemoryAdapter</code> by default, Redis with one adapter, when you need shared storage.</p>}
        >
            <div id="benchmark" className="grid grid-cols-[minmax(0,1fr)] items-end gap-10 xl:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
                <Reveal className="flex flex-col gap-3">
                    <span className="journey-refined-metal text-[clamp(72px,9vw,128px)] font-semibold leading-none tracking-[-0.04em]">84<span className="text-[0.4em] tracking-normal"> MB</span></span>
                    <p className="text-[15px] text-[var(--text-dim)]">median memory under the same gateway load, <span className="text-[var(--text-bright)]">{multiplier}× lighter</span> than discord.js.</p>
                    <Link href="/benchmark" className={cn(mono, "mt-2 text-[11px] tracking-[0.22em] text-[var(--text-dim)] underline-offset-4 hover:text-[var(--text-bright)] hover:underline")}>FULL MEASUREMENTS ↗</Link>
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
                                        initial={{ scaleX: 0 }}
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
            title="The JSON becomes types"
            intro={<p><code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>HandleCommand</code> finds the class you declared and parses its options. By the time the packet reaches your code, <code className={cn(mono, "text-[14px] text-[#ffc799]")}>message</code> is a <code className={cn(mono, "text-[14px] text-[#ffc799]")}>string</code>, not an <code className={cn(mono, "text-[14px]")}>any</code>.</p>}
        >
            <div className="flex flex-col gap-10">
                <Reveal>
                    <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-4 md:grid-cols-[minmax(0,1fr)_56px_minmax(0,1fr)]">
                        <Panel label="before · raw option">
                            <pre className={cn(mono, "overflow-x-auto px-4 py-4 text-[12.5px] leading-[1.75] text-[#9aa2b4]")}>{`{ "name": "message",
  "type": 3,
  "value": ${JSON.stringify(text)} }`}</pre>
                        </Panel>
                        <div aria-hidden className="hidden items-center md:flex">
                            <span className="h-px flex-1 bg-gradient-to-r from-white/10 to-[#d9925c]" />
                            <span className="text-[#d9925c]">▸</span>
                        </div>
                        <Panel label="after · CommandContext" glow="#d9925c">
                            <div className={cn(mono, "flex flex-col gap-3 px-4 py-4 text-[12.5px] leading-[1.75]")}>
                                <span className="text-[#e5e5e5]">ctx.options.<span className="text-[#ffc799]">message</span></span>
                                <span className="w-fit rounded-md border border-white/10 bg-[#15121a] px-2.5 py-1 text-[12px] text-[#d4d4d4]">
                                    (property) message: <span className="text-[#ffc799]">string</span>
                                </span>
                                <span className="text-[#7d8590]">{"// = "}<span className="text-[#99ffe4]">{JSON.stringify(text)}</span></span>
                            </div>
                        </Panel>
                    </div>
                    <p className="mt-4 text-sm text-[var(--text-dim)]">
                        The type comes from what you declared: a required <code className={cn(mono, "text-[13px] text-[var(--text-bright)]")}>createStringOption</code>. <a href="#core" className="text-[#d9925c] underline-offset-4 hover:underline">See it in the file ↓</a>
                    </p>
                </Reveal>
                <Reveal delay={0.08}>
                    <div className="flex flex-col gap-4 border-t border-white/[0.07] pt-6">
                        <span className={cn(mono, "text-[11px] tracking-[0.22em] text-[var(--text-dim)]")}>LESS BOILERPLATE</span>
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
            title="Your checks, before your code"
            intro={<p>This /echo has none attached, so it falls straight through. When you need logging, cooldowns or permission checks, register a middleware and attach it with <code className={cn(mono, "text-[14px] text-[var(--text-bright)]")}>@Middlewares([&apos;logger&apos;])</code>.</p>}
        >
            <div className="flex flex-col gap-8">
                <Reveal>
                    <div className="relative py-6">
                        {/* the gate line: across on wide screens, down on phones */}
                        <span aria-hidden className="absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-[#e8a46a]/10 via-[#e8a46a]/50 to-[#fff4e2]/80 sm:block" />
                        <span aria-hidden className="absolute inset-y-0 left-[22px] w-px bg-gradient-to-b from-[#e8a46a]/10 via-[#e8a46a]/50 to-[#fff4e2]/80 sm:hidden" />
                        <ol className="relative grid gap-5 sm:grid-cols-3 sm:gap-4">
                            {gates.map((g) => (
                                <li key={g.name} className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
                                    <span className={cn(mono, "flex items-center gap-2 rounded-full border border-[#e8a46a]/40 bg-[#120c09]/90 px-4 py-2 text-[12px] text-[var(--text-bright)] backdrop-blur")}>
                                        {g.name}
                                    </span>
                                    <span className="text-[12px] text-[var(--text-dim)]">{g.note}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </Reveal>
                <Reveal delay={0.08}>
                    <Panel label="logger.middleware.ts" aside="example middleware" glow="#e8a46a">
                        <div className={cn(mono, "journey-refined-code overflow-x-auto px-4 py-4 text-[12.5px]")} dangerouslySetInnerHTML={{ __html: loggerHtml }} />
                    </Panel>
                </Reveal>
            </div>
        </StageShell>
    );
}

/* ── 5 · core ────────────────────────────────────────────────────────── */

// which ring read each part of the file — the journey, told backwards
const ECHO_NOTES: { part: EchoPart; stage?: StageId; note?: React.ReactNode }[] = [
    { part: "imports" },
    { part: "options", stage: "command", note: <>Turned the raw <code className={mono}>value</code> into a typed <code className={cn(mono, "text-[#ffc799]")}>string</code>.</> },
    { part: "declare", stage: "command", note: <>Matched the interaction named <code className={mono}>echo</code> to this class.</> },
    { part: "run", stage: "core", note: <>The only part that runs per message. <code className={cn(mono, "text-[#ffc799]")}>ctx.write</code> sends the reply back out.</> },
];

function CoreStage({ echoHtml, text }: { echoHtml: Record<EchoPart, string>; text: string }) {
    return (
        // the gap above the copy is deliberate: the veil lifts and, for a
        // moment, there is nothing between you and the hole you fell into
        <section id="core" className="relative flex scroll-mt-20 flex-col items-center gap-10 border-t border-white/10 pb-20 pt-[22vh] text-center sm:pt-[34vh]">
            <div className="flex max-w-2xl flex-col items-center gap-5">
                <div className={cn(mono, "flex items-center gap-3 text-[11px] tracking-[0.25em] text-[#e1e3e8] [text-shadow:0_1px_12px_rgba(0,0,0,0.95)]")}>
                    <span aria-hidden className="size-2 rounded-full bg-[#fff4e2] shadow-[0_0_14px_#ffd9a0]" />
                    THE CORE <span aria-hidden className="h-px w-10 bg-white/20" /> <span className="text-[var(--text-bright)]">YOUR CODE</span>
                </div>
                <h2 className="text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.025em] [text-shadow:0_2px_30px_rgba(0,0,0,0.95)] sm:text-5xl">
                    Everything before this was the framework
                </h2>
                <p className="max-w-[46ch] text-pretty text-[17px] leading-relaxed text-[#e1e3e8] [text-shadow:0_1px_18px_rgba(0,0,0,0.95)]">
                    At the center there is only the part you wrote: one file. Each piece of it is something a ring above already read.
                </p>
            </div>
            <Reveal className="w-full max-w-4xl text-left">
                <Panel label="src/commands/echo.ts" aside="the whole file" glow="#ffd9a0" className="bg-[#0b0806]/95">
                    <ol className="divide-y divide-white/[0.06]">
                        {ECHO_NOTES.map(({ part, stage, note }) => {
                            const s = stage && STAGES.find((x) => x.id === stage)!;
                            return (
                                <li key={part} className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_220px]">
                                    <div className={cn(mono, "journey-refined-code min-w-0 px-4 py-3 text-[12px] sm:text-[12.5px]")} dangerouslySetInnerHTML={{ __html: echoHtml[part] }} />
                                    {s && (
                                        <div className="flex flex-col gap-1 border-white/[0.06] px-4 pb-3 text-[13px] leading-snug text-[var(--text-dim)] md:border-l md:py-3">
                                            <a href={`#${s.id}`} className={cn(mono, "flex w-fit items-center gap-2 text-[11px] tracking-[0.08em] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--brand-indigo)]")} style={{ color: s.glow }}>
                                                <span aria-hidden className="size-1.5 rounded-full" style={{ background: s.glow }} />
                                                {s.id === "core" ? "Runs here" : `Read at ${s.name}`}
                                            </a>
                                            <span>{note}</span>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                    <div className={cn(mono, "flex items-start gap-3 border-t border-white/10 px-4 py-3 text-xs leading-relaxed text-[var(--text-dim)]")}>
                        <span aria-hidden className="text-[#ffd9a0]">→</span>
                        <span className="min-w-0 break-words">ctx.write(&#123; content: <span className="text-[#99ffe4]">{JSON.stringify(text)}</span> &#125;)</span>
                    </div>
                </Panel>
            </Reveal>
        </section>
    );
}

/* ── 6 · jet ─────────────────────────────────────────────────────────── */

function JetStage({ text }: { text: string }) {
    return (
        <section id="jet" className="relative scroll-mt-20 border-t border-white/10 py-14 sm:py-20">
            <div className="relative flex flex-col items-center gap-10 text-center">
                <div className="relative flex w-full flex-col items-center">
                {/* copy sits in its own pocket of dark so the beam reads as passing behind it */}
                <div className="relative flex max-w-xl flex-col items-center gap-5">
                    <div className={cn(mono, "flex items-center gap-3 text-[11px] tracking-[0.25em] text-[var(--text-dim)]")}>
                        <span className="size-2 rounded-full bg-[var(--brand-indigo)] shadow-[0_0_14px_var(--brand-indigo)]" />
                        BACK TO DISCORD
                    </div>
                    <h2 className="text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.02em] sm:text-5xl">And out it goes</h2>
                    <p className="text-[16px] leading-relaxed text-[var(--text-dim)]">A Seyfert galaxy shoots energy out of its core. So does your bot: <code className={cn(mono, "text-[14px] text-[#ffc799]")}>ctx.write</code> answers the interaction over REST and your text lands in the channel.</p>
                </div>
                </div>

                <Reveal className="w-full max-w-lg text-left">
                    <div className="rounded-xl border border-[#818cf8]/30 bg-[#0e1019]/95 p-4">
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
                                    <span className="break-words [overflow-wrap:anywhere] text-[15px] text-[#e5e5e5]">{text}</span>
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
                        <a href="https://github.com/tiramisulabs/seyfert-web" target="_blank" className={cn(mono, "text-[11px] tracking-[0.22em] text-[var(--text-dim)] hover:text-[var(--text-bright)]")}>ADD YOURS — OPEN A PR ↗</a>
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
