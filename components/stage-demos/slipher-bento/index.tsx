"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Bar, Collapse, Count, Stage, type Act } from "@/components/stageshow/kit";
import { CodeRow, type CodeLines } from "../code";
import "@/components/stageshow/seyfert.css";
import "./bento.css";

// The @slipher packages as a ruled grid on the observatory page: one rounded
// container, 1px rules between the cells, no gaps, the copy as page text and
// each picture its own Stage at 1:1, pinned to its cell's bottom.
//
//   Tile      Span   Kind        The one thing                                 Moves
//   Redis     2 × 1  Diagram+UI  three workers writing into one key list       keys arrive, the writer's line lights (leads)
//   Cooldown  1 × 1  Component   the plugin's denied reply in Discord          the relative timestamp ticks
//   ESLint    1 × 1  Component   a command class without @Declare, flagged     the squiggle and its hover arrive
//   HTTP      2 × 1  Diagram     POST /interactions into either HTTP adapter    still
//   The rest  3 × 1  Collection  the other @slipher packages, bleeding off      the rows drift apart
//
// Every string is the packages' own: the Redis keys are the cache's dotted
// keys under the adapter's default `seyfert` namespace (IDs from the cache
// docs), the reply is @slipher/cooldown's default middleware message, the
// lint message and rule id are require-declare's, and the adapter names and
// /interactions path are the ones the setup guide and uws-adapter use.

const STEP = 110;
const LEAD = 450;

type Beat = { on: boolean };
const before: Beat = { on: false };
const after: Beat = { on: true };
const beat = (i: number) => async (a: Act<Beat>) => {
    await a.wait(LEAD + i * STEP);
    await a.set({ on: true });
};

// Measure the tile, not the page: a wide page can still hold a narrow tile.
function usePictureWidth(initial = 340) {
    const ref = useRef<HTMLDivElement>(null);
    // null until measured: the server can't know the tile's width, and a
    // guessed design shown for one frame would swap to the real one in view
    const [width, setWidth] = useState<number | null>(null);
    useLayoutEffect(() => {
        const node = ref.current;
        if (!node) return;
        const measure = () => setWidth(node.clientWidth);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);
    return [ref, width ?? initial, width !== null] as const;
}

function Tile({ area, pkg, title, children, picture }: { area: string; pkg: string[]; title: ReactNode; children: ReactNode; picture: ReactNode }) {
    return (
        <section className={`sb-cell sb-cell--${area}`}>
            <div className="sb-copy">
                {/* lines break between package names, never inside one */}
                <span className="sb-pkg">
                    {pkg.map((name, i) => (
                        <span key={name}>
                            {i > 0 && " · "}
                            <span className="sb-pkg__name">{name}</span>
                        </span>
                    ))}
                </span>
                <p className="sb-line">
                    <b>{title}</b> {children}
                </p>
            </div>
            {picture}
        </section>
    );
}

/* ---------------- Redis (hero) ---------------- */

type Key = { id: string; by: number };
const NAMESPACE = "seyfert:";
const OLDER: Key[] = [{ id: "guild.1003825077969764412", by: 0 }];
// newest last; the member key is too long for a phone column, so compact starts one write later
const WRITES: Key[] = [
    { id: "member.1003825077969764412.366779196975874049", by: 0 },
    { id: "user.366779196975874049", by: 2 },
    { id: "user.576805413148688424", by: 1 },
];

type Cache = { n: number; lit: number | null };

function cacheScript(writes: Key[]) {
    return async (a: Act<Cache>) => {
        await a.wait(LEAD);
        for (let k = 0; k < writes.length; k++) {
            // the writer's line carries the write, then the key lands on top of the list
            await a.set({ lit: writes[k].by });
            await a.wait(520);
            await a.set({ n: k + 1 });
            await a.wait(k === writes.length - 1 ? 300 : 900);
        }
    };
}

function Redis() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const writes = compact ? WRITES.slice(1) : WRITES;
    const height = compact ? 228 : 262;
    const pad = compact ? 24 : 28;
    // three workers across the top, their lines fanning into the panel's one entry
    const pillW = compact ? 88 : 172;
    const span = width - pad * 2;
    const cx = [0, 1, 2].map((k) => pad + pillW / 2 + (k * (span - pillW)) / 2);
    const mid = width / 2;
    const top = 30;
    const entry = 86;
    const path = (x: number) => `M${x} ${top} C${x} ${top + 34} ${mid} ${entry - 34} ${mid} ${entry}`;
    return (
        <Tile
            area="hero"
            pkg={["@slipher/redis-adapter"]}
            title="One cache for every worker."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Cache>
                        width={width}
                        height={height}
                        theme="dark"
                        initial={{ n: 0, lit: null }}
                        poster={{ n: writes.length, lit: writes[writes.length - 1].by }}
                        play="once"
                        script={cacheScript(writes)}
                        className="sy sb-stage"
                    >
                        {(s) => (
                            <div className="sb-cache" data-layout={compact ? "compact" : "wide"}>
                                <svg className="sb-cache__lines" width={width} height={height} aria-hidden>
                                    {cx.map((x, k) => (
                                        <g key={k}>
                                            <path d={path(x)} className="sb-wire" />
                                            <path d={path(x)} className="sb-wire sb-wire--lit" pathLength={1} data-on={s.lit === k || undefined} />
                                        </g>
                                    ))}
                                </svg>
                                {cx.map((x, k) => (
                                    <span key={k} className="sb-worker" data-on={s.lit === k || undefined} style={{ left: x, width: pillW }}>
                                        <span className="sb-worker__dot" />
                                        worker {k}
                                        {!compact && <span className="sb-worker__shards">shards {k * 8}–{k * 8 + 7}</span>}
                                    </span>
                                ))}
                                <div className="sb-keys" style={{ top: entry, left: pad, width: span }}>
                                    <div className="sb-keys__head">
                                        <span>
                                            SCAN 0 MATCH <span className="sb-keys__ns">{NAMESPACE}*</span>
                                        </span>
                                        <span className="sb-keys__type">hash</span>
                                    </div>
                                    {writes
                                        .map((key, k) => ({ key, k }))
                                        .reverse()
                                        .map(({ key, k }) => (
                                            <Collapse key={key.id} open={k < s.n} reveal="drop">
                                                <KeyRow id={key.id} by={key.by} fresh={k === s.n - 1} compact={compact} />
                                            </Collapse>
                                        ))}
                                    {OLDER.map((key) => (
                                        <KeyRow key={key.id} id={key.id} by={key.by} compact={compact} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Threads, processes and hosts share one source of truth in Redis.
        </Tile>
    );
}

function KeyRow({ id, by, fresh, compact }: { id: string; by: number; fresh?: boolean; compact: boolean }) {
    return (
        <div className="sb-key" data-fresh={fresh || undefined}>
            <span className="sb-key__mark" />
            <span className="sb-key__id">
                <span className="sb-key__ns">{NAMESPACE}</span>
                {id}
            </span>
            {!compact && <span className="sb-key__by">worker {by}</span>}
        </div>
    );
}

/* ---------------- Cooldown ---------------- */

type Tick = { left: number };

const cooldown = async (a: Act<Tick>) => {
    await a.wait(LEAD + STEP + 700);
    await a.set({ left: 4 });
    await a.wait(1000);
    await a.set({ left: 3 });
};

function Cooldown() {
    const [ref, width, ready] = usePictureWidth(330);
    return (
        <Tile
            area="cool"
            pkg={["@slipher/cooldown"]}
            title="Cooldowns from a decorator."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Tick> width={width} height={214} theme="dark" initial={{ left: 5 }} poster={{ left: 3 }} play="once" script={cooldown} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-dc">
                                {/* the channel's history above, pinned to the foot as Discord pins it */}
                                <div className="sb-dc__older" aria-hidden>
                                    <span className="sb-dc__disc" />
                                    <span className="sb-dc__bars">
                                        <Bar w={58} h={8} tone={3} />
                                        <Bar w={148} h={7} tone={2} />
                                    </span>
                                </div>
                                <div className="sb-dc__used">
                                    <span className="sb-dc__spine" />
                                    <span className="sb-dc__who">kira</span> used <span className="sb-dc__cmd">/ping</span>
                                </div>
                                <div className="sb-dc__msg">
                                    <span className="sb-dc__face">
                                        <img src="/logo.svg" alt="" />
                                    </span>
                                    <div className="sb-dc__body">
                                        <div className="sb-dc__meta">
                                            <span className="sb-dc__name">Orbit</span>
                                            <span className="sb-dc__app">APP</span>
                                        </div>
                                        <p className="sb-dc__text">
                                            This command is cooling down. Try again{" "}
                                            <span className="sb-dc__time">
                                                in <Count value={s.left} format={(n) => `${n} seconds`} duration={420} />
                                            </span>
                                            .
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Per user, guild, channel or across the bot.
        </Tile>
    );
}

/* ---------------- ESLint ---------------- */

function Lint({ code }: { code: CodeLines }) {
    const [ref, width, ready] = usePictureWidth(330);
    return (
        <Tile
            area="lint"
            pkg={["@slipher/eslint-plugin"]}
            title="Caught as you write."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Beat> width={width} height={190} theme="dark" initial={before} poster={after} play="once" script={beat(2)} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-lint" data-on={s.on || undefined}>
                                <div className="sb-editor">
                                    {code.map((line, i) => (
                                        <div key={i} className="sb-editor__line">
                                            <span className="sb-editor__no">{i + 1}</span>
                                            <span className="sb-editor__code">
                                                {line.length === 0 ? (
                                                    " "
                                                ) : (
                                                    line.map((t, k) =>
                                                        t.c === "PingCommand" ? (
                                                            <span key={k} className="sb-squiggle" style={{ color: t.k }}>
                                                                {t.c}
                                                            </span>
                                                        ) : (
                                                            <CodeRow key={k} line={[t]} />
                                                        ),
                                                    )
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="sb-hover">
                                    <p className="sb-hover__msg">
                                        This class extends a Seyfert command but is missing the <code>@Declare</code> decorator.
                                    </p>
                                    <span className="sb-hover__rule">eslint(seyfert/require-declare)</span>
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Type-aware rules for what would crash at runtime.
        </Tile>
    );
}

/* ---------------- HTTP adapters ---------------- */

function Http() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 250 : 186;
    // node centers; the adapters sit on either side of the request's line
    const n = compact
        ? {
              req: { x: width / 2, y: 38 },
              uws: { x: width / 2 - 72, y: 128 },
              gen: { x: width / 2 + 72, y: 128 },
              http: { x: width / 2, y: 218 },
          }
        : (() => {
              const left = Math.max(28, (width - 610) / 2);
              return {
                  req: { x: left + 78, y: 82 },
                  uws: { x: left + 324, y: 40 },
                  gen: { x: left + 324, y: 124 },
                  http: { x: left + 556, y: 82 },
              };
          })();
    const curve = (a: { x: number; y: number }, b: { x: number; y: number }) =>
        compact ? `M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}` : `M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`;
    return (
        <Tile
            area="http"
            pkg={["@slipher/uws-adapter", "@slipher/generic-adapter"]}
            title="Interactions over HTTP."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage width={width} height={height} theme="dark" className="sy sb-stage">
                        {() => (
                            <div className="sb-flow" data-layout={compact ? "compact" : "wide"}>
                                <span className="sb-flow__dots" aria-hidden />
                                <svg className="sb-flow__lines" width={width} height={height} aria-hidden>
                                    {[curve(n.req, n.uws), curve(n.req, n.gen), curve(n.uws, n.http), curve(n.gen, n.http)].map((d, k) => (
                                        <path key={k} d={d} className="sb-wire sb-wire--flow" />
                                    ))}
                                </svg>
                                <span className="sb-node sb-node--req" style={{ left: n.req.x, top: n.req.y }}>
                                    <span className="sb-node__verb">POST</span> /interactions
                                </span>
                                <span className="sb-node" style={{ left: n.uws.x, top: n.uws.y }}>
                                    UwsAdapter{!compact && <span className="sb-node__sub">uWebSockets.js</span>}
                                </span>
                                <span className="sb-node" style={{ left: n.gen.x, top: n.gen.y }}>
                                    GenericAdapter{!compact && <span className="sb-node__sub">fetch(Request)</span>}
                                </span>
                                <span className="sb-node sb-node--client" style={{ left: n.http.x, top: n.http.y }}>
                                    HttpClient
                                </span>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            uWebSockets.js on your own server, or a fetch handler on Workers.
        </Tile>
    );
}

/* ---------------- The rest of @slipher ---------------- */

const REST = [
    ["voice", "player", "scheduler", "queues", "logger", "opentelemetry", "cache-integrity"],
    ["testing", "watcher", "proxy", "webhooks", "chartjs", "scaler"],
];

function Rest() {
    return (
        <Tile
            area="rest"
            pkg={["@slipher/*"]}
            title="And the rest of the toolkit."
            picture={
                <div className="sb-picture sb-picture--band">
                    <Stage<Beat> width={1200} height={128} theme="dark" initial={before} poster={after} play="once" script={beat(4)} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-rows" data-on={s.on || undefined}>
                                {REST.map((row, r) => (
                                    <div key={r} className="sb-row" style={{ ["--dir" as string]: r % 2 ? 1 : -1, ["--off" as string]: `${[-60, 40][r]}px` }}>
                                        {row.map((name, k) => (
                                            <span key={`${name}-${k}`} className="sb-chip">
                                                <span className="sb-chip__scope">@slipher/</span>
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Voice, queues, tracing and tests, maintained by the Seyfert team.
        </Tile>
    );
}

export default function SlipherBento({ code }: { code: CodeLines }) {
    return (
        <div className="sb">
            <div className="sb-grid">
                <Redis />
                <Cooldown />
                <Lint code={code} />
                <Http />
                <Rest />
            </div>
        </div>
    );
}
