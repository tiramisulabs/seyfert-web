"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SlipherSection } from "@/components/stage-demos/slipher-bento";
import { useReducedMotion } from "@/components/stageshow/kit/reduced-motion";
import "./slipher-map.css";

// The map is drawn in the docs' own terms (card, border, primary, the
// section label of "On this page"), so it follows the page's theme; the
// viewer under it is a product demo like the guides' other plates.
//
// The official packages as a map of a Seyfert bot: Discord on the left, the
// edge between it and the bot (the HTTP adapters, webhooks, the REST proxy),
// the client with what plugs into it, its cache underneath, and the tools that
// only run while it's being built. Each package is a node; the one picked
// shows its tile in the viewer under the map, with its kind, line, install
// and guide. While nobody picks, the tiles take turns.
//
// The viewer keeps one height, so a turn never moves the page. Turns wait
// while the map is off screen, the tab is hidden or the pointer is over it,
// stop for good once a node is picked, and never start under reduced motion.
// In a phone column the map becomes its zones as rows of nodes, no wires.

export type Zone = "edge" | "client" | "cache" | "dev";

export type MapPackage = {
    name: string;
    kind: "Plugin" | "Adapter" | "Utility";
    zone: Zone;
    /** the table's line for it */
    line: string;
    install: string;
    href?: string;
    /** which tile shows it: packages that share a tile light together */
    tile: string;
    /** an edge package's way: from Discord into the client, or out to it */
    flow?: "in" | "out";
};

const ZONES: { zone: Zone; label: string }[] = [
    { zone: "edge", label: "Edge" },
    { zone: "client", label: "Client" },
    { zone: "cache", label: "Cache" },
    { zone: "dev", label: "Development" },
];

const TURN = 9000;
const HOVER_DELAY = 140;
// The map's own layout needs this much room; under it, the zones as rows
const WIDE = 600;

// `flows`: drawn from source to target, so its arrowhead and moving packets
// say which way the traffic goes; the cache's wire, read and written both
// ways, doesn't
type Wire = { d: string; lit: boolean; flows: boolean };

const short = (name: string) => name.replace(/^@slipher\//, "");

export function SlipherMap({ packages, tiles, className }: { packages: MapPackage[]; tiles: Record<string, ReactNode>; className?: string }) {
    // the tiles in map order, each once
    const order = useMemo(() => packages.map((p) => p.tile).filter((t, i, all) => all.indexOf(t) === i), [packages]);
    const [active, setActive] = useState(order[0]);
    const [picked, setPicked] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [onScreen, setOnScreen] = useState(false);
    const [pageVisible, setPageVisible] = useState(true);
    // whether a node has been pointed at or picked yet: until then, a hint
    const [touched, setTouched] = useState(false);
    // what the hint says: unknown until mounted, a mouse or a finger after
    const [pointer, setPointer] = useState<"mouse" | "touch" | null>(null);
    const [width, setWidth] = useState(0);
    const [wires, setWires] = useState<Wire[]>([]);
    const reduced = useReducedMotion();
    const root = useRef<HTMLDivElement>(null);
    const map = useRef<HTMLDivElement>(null);
    const hoverTimer = useRef(0);
    // marker ids are document-wide
    const uid = useId().replace(/:/g, "");
    const wide = width === 0 || width >= WIDE;
    const shown = packages.filter((p) => p.tile === active);

    useEffect(() => {
        const node = root.current;
        if (!node) return;
        const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
        io.observe(node);
        const ro = new ResizeObserver(() => setWidth(node.clientWidth));
        ro.observe(node);
        const visibility = () => setPageVisible(!document.hidden);
        document.addEventListener("visibilitychange", visibility);
        setPointer(window.matchMedia("(hover: hover) and (pointer: fine)").matches ? "mouse" : "touch");
        return () => {
            io.disconnect();
            ro.disconnect();
            document.removeEventListener("visibilitychange", visibility);
        };
    }, []);

    // Wires from where the nodes actually sit, each drawn the way its traffic
    // goes: Discord through an inbound edge node into the client, the client
    // through the proxy out to Discord, and the client down to its cache
    useLayoutEffect(() => {
        const box = map.current;
        if (!box || !wide) return setWires([]);
        const origin = box.getBoundingClientRect();
        const rect = (name: string) => {
            const el = box.querySelector<HTMLElement>(`[data-node="${name}"]`);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { l: r.left - origin.left, r: r.right - origin.left, t: r.top - origin.top, b: r.bottom - origin.top, cy: r.top - origin.top + r.height / 2, cx: r.left - origin.left + r.width / 2 };
        };
        const discord = rect("discord");
        const client = rect("client");
        if (!discord || !client) return;
        const across = (a: { x: number; y: number }, b: { x: number; y: number }) => {
            const mx = (a.x + b.x) / 2;
            return `M${a.x} ${a.y} C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
        };
        const next: Wire[] = [];
        for (const p of packages) {
            const n = rect(p.name);
            if (!n) continue;
            const lit = p.tile === active;
            if (p.zone === "edge" && p.flow === "out") {
                // leaving from low on the client's side, apart from what arrives
                next.push({ d: across({ x: client.l, y: client.b - 8 }, { x: n.r, y: n.cy }), lit, flows: true });
                next.push({ d: across({ x: n.l, y: n.cy }, { x: discord.r, y: discord.cy }), lit, flows: true });
            } else if (p.zone === "edge") {
                next.push({ d: across({ x: discord.r, y: discord.cy }, { x: n.l, y: n.cy }), lit, flows: true });
                next.push({ d: across({ x: n.r, y: n.cy }, { x: client.l, y: client.cy }), lit, flows: true });
            }
            if (p.zone === "cache") {
                const from = { x: client.cx, y: client.b };
                const to = { x: n.cx, y: n.t };
                const my = (from.y + to.y) / 2;
                next.push({ d: `M${from.x} ${from.y} C${from.x} ${my} ${to.x} ${my} ${to.x} ${to.y}`, lit, flows: false });
            }
        }
        setWires(next);
    }, [width, wide, active, packages]);

    // Whether the tiles are taking turns right now; the active node shows the
    // turn running out, so the map reads as live and its nodes as the choice
    const turning = order.length > 1 && !picked && !hovering && onScreen && pageVisible && !reduced;
    useEffect(() => {
        if (!turning) return;
        const timer = window.setTimeout(() => setActive((t) => order[(order.indexOf(t) + 1) % order.length]), TURN);
        return () => window.clearTimeout(timer);
    }, [active, turning, order]);

    const node = (p: MapPackage) => (
        <button
            key={p.name}
            type="button"
            data-node={p.name}
            className="sm-node"
            aria-pressed={p.tile === active}
            onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                setTouched(true);
                window.clearTimeout(hoverTimer.current);
                hoverTimer.current = window.setTimeout(() => setActive(p.tile), HOVER_DELAY);
            }}
            onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
            onClick={() => {
                setActive(p.tile);
                setPicked(true);
                setTouched(true);
            }}
        >
            {short(p.name)}
            {/* keyed by the turn, so each one fills from empty, and a turn
                restarted after the pointer leaves starts its bar over too */}
            {turning && p.tile === active && <span key={active} className="sm-node__turn" style={{ animationDuration: `${TURN}ms` }} aria-hidden />}
        </button>
    );
    const zone = (z: Zone, label: string) => (
        <div key={z} className={`sm-zone sm-zone--${z}`}>
            {/* the docs' section label, as the page's "On this page" draws it */}
            <span className="sm-zone__label">
                <span className="sm-zone__slashes">{"//"}</span>
                {label}
            </span>
            {z === "client" && wide && (
                <span className="sm-core" data-node="client">
                    Client
                </span>
            )}
            <div className="sm-zone__nodes">{packages.filter((p) => p.zone === z).map(node)}</div>
        </div>
    );

    return (
        <div ref={root} className={`sm not-prose my-8 ${className ?? ""}`} data-idle={!onScreen || !pageVisible || undefined} onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
            <div ref={map} className="sm-map" data-layout={wide ? "wide" : "rows"}>
                {pointer && (
                    <span className="sm-hint" data-gone={touched || undefined} aria-hidden>
                        <span className="sm-hint__dot" />
                        {pointer === "mouse" ? "Hover a package to see it at work" : "Tap a package to see it at work"}
                    </span>
                )}
                {wide && (
                    <>
                        <svg className="sm-wires" aria-hidden>
                            <defs>
                                {(["dim", "lit"] as const).map((tone) => (
                                    <marker key={tone} id={`${uid}-${tone}`} viewBox="0 0 8 8" refX="7.5" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                                        <path d="M1 1 L7.5 4 L1 7" className={`sm-arrow sm-arrow--${tone}`} />
                                    </marker>
                                ))}
                            </defs>
                            {wires.map((w, i) => (
                                <g key={i}>
                                    <path d={w.d} className="sm-wire" data-lit={w.lit || undefined} markerEnd={w.flows ? `url(#${uid}-${w.lit ? "lit" : "dim"})` : undefined} />
                                    {w.flows && <path d={w.d} className="sm-flow" data-lit={w.lit || undefined} />}
                                </g>
                            ))}
                        </svg>
                        <span className="sm-discord" data-node="discord">
                            Discord
                        </span>
                    </>
                )}
                {ZONES.map(({ zone: z, label }) => zone(z, label))}
            </div>

            <figure className="sm-viewer sy-plate" style={{ "--sbx-h": "390px", "--sbx-h-narrow": "400px" } as CSSProperties}>
                <SlipherSection>
                    {/* keyed, so a new turn starts its tile from the top */}
                    <div key={active} className="sbx-turn">
                        {tiles[active]}
                    </div>
                </SlipherSection>
                <figcaption className="sm-meta">
                    {shown.map((p) => (
                        <span key={p.name} className="sm-meta__row">
                            <span className="sm-meta__kind">{p.kind}</span>
                            <span className="sm-meta__line">{p.line}</span>
                            <code className="sm-meta__install">{p.install}</code>
                            {p.href && (
                                <a className="sm-meta__guide" href={p.href}>
                                    Guide →
                                </a>
                            )}
                        </span>
                    ))}
                </figcaption>
            </figure>

            {/* The whole list as text, for search and screen readers */}
            <ul className="sr-only">
                {packages.map((p) => (
                    <li key={p.name}>
                        {p.href ? <a href={p.href}>{p.name}</a> : p.name} ({p.kind}): {p.line} <code>{p.install}</code>
                    </li>
                ))}
            </ul>
        </div>
    );
}
