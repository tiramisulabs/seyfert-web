"use client";

import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./proxy.css";

// @slipher/proxy: three workers' REST calls through one proxy to Discord.
// Each request leaves a worker as a packet, crosses the proxy and reaches
// discord.com, and lands in the proxy's log of forwarded requests, newest on
// top. One createProxy holds the token and one ApiHandler for everyone, so
// the workers only need the proxy's address.
//
// Strings: `createProxy`, port 4444, the `/api` base, `Authorization: Bot
// <token>` and the forwarded route (the path after the base) are
// @slipher/proxy 0.0.7's (tiramisulabs/extra main at 678b791,
// packages/proxy: src/adapter.ts and its README's usage). Discord's
// discord.com and /api/v10 are Seyfert's ApiHandler defaults. On success the
// proxy answers with the result and no explicit status, so every row reads
// 200. Invented: the requests themselves, their worker, and their IDs (the
// docs' example IDs, as in the Redis tile).
//
// The loop never rewinds: the log is a conveyor of six distinct requests,
// more than it shows; a lap ends by snapping back one lap to the same
// picture, the packet already gone and the same worker lit.

type Request = { by: number; method: string; route: string };
const BASE = "/api";
// oldest first; no worker sends twice in a row, across the seam too
const REQUESTS: Request[] = [
    { by: 0, method: "GET", route: "/users/@me" },
    { by: 2, method: "POST", route: "/channels/1003825079328702529/messages" },
    { by: 1, method: "GET", route: "/guilds/1003825077969764412" },
    { by: 0, method: "PATCH", route: "/channels/1216337232047378462" },
    { by: 2, method: "DELETE", route: "/channels/1003825079328702529/messages/1529923192402088189" },
    { by: 1, method: "PUT", route: "/guilds/1003825077969764412/members/366779196975874049/roles/1115437277846458388" },
];
const DEPTH = 4;

// n counts the forwarded requests; fly is the one in flight (its packet),
// lit the worker that sent the newest
type Traffic = { n: number; fly: number | null; lit: number };
const START = REQUESTS.length * 2;
const at = (k: number) => REQUESTS[k % REQUESTS.length];
const initial: Traffic = { n: START, fly: null, lit: at(START - 1).by };

// One request every 1.4s, the seam included
const traffic = async (a: Act<Traffic>) => {
    for (let k = START; k < START + REQUESTS.length; k++) {
        await a.wait(k === START ? 200 : 500);
        await a.set({ fly: k, lit: at(k).by });
        // the packet's trip, worker to Discord
        await a.wait(900);
        await a.set({ n: k + 1 });
    }
    await a.wait(300);
    await a.snap({ n: START, fly: null });
};

type Point = { x: number; y: number };

export function ProxyTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 250 : 270;
    const pad = compact ? 24 : 28;

    // Wide: the workers down the left, the proxy in the middle, Discord on
    // the right. Compact: the workers across the top, the proxy and Discord
    // on one row under them.
    const workers: Point[] = compact
        ? [0, 1, 2].map((k) => ({ x: pad + 44 + (k * (width - pad * 2 - 88)) / 2, y: 17 }))
        : [0, 1, 2].map((k) => ({ x: pad + 52, y: 18 + k * 42 }));
    const proxy: Point = compact ? { x: Math.round(width * 0.36), y: 76 } : { x: Math.round(width * 0.5), y: 60 };
    const discord: Point = compact ? { x: Math.round(width * 0.78), y: 76 } : { x: width - pad - 72, y: 60 };
    const logTop = compact ? 108 : 120;

    // A worker's wire into the proxy, and the packet's whole route: through
    // the proxy and on to Discord
    const inbound = (w: Point) =>
        compact
            ? `M${w.x} ${w.y + 13} C${w.x} ${w.y + 40} ${proxy.x} ${proxy.y - 40} ${proxy.x} ${proxy.y - 15}`
            : `M${w.x + 52} ${w.y} C${w.x + 120} ${w.y} ${proxy.x - 110} ${proxy.y} ${proxy.x - 58} ${proxy.y}`;
    const outbound = `M${proxy.x + (compact ? 50 : 58)} ${proxy.y} L${discord.x - (compact ? 46 : 62)} ${discord.y}`;
    const route = (w: Point) => `${inbound(w)} L${proxy.x} ${proxy.y} ${outbound.replace("M", "L")}`;

    return (
        <Tile
            area="proxy"
            pkg={["@slipher/proxy"]}
            title="One door to Discord."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Traffic> width={width} height={height} theme="dark" initial={initial} play="loop" script={traffic} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-proxy" data-layout={compact ? "compact" : "wide"}>
                                <svg className="sb-proxy__lines" width={width} height={height} aria-hidden>
                                    {workers.map((w, k) => (
                                        <path key={k} d={inbound(w)} className="sb-wire" data-on={s.lit === k || undefined} />
                                    ))}
                                    <path d={outbound} className="sb-wire sb-proxy__out" />
                                </svg>
                                {s.fly !== null && (
                                    // keyed by the request: each one flies once, then is gone
                                    <span key={s.fly} className="sb-proxy__packet" style={{ offsetPath: `path("${route(workers[at(s.fly).by])}")` }} />
                                )}
                                {workers.map((w, k) => (
                                    <span key={k} className="sb-worker sb-proxy__worker" data-on={s.lit === k || undefined} style={{ left: w.x, top: w.y - 13 }}>
                                        <span className="sb-worker__dot" />
                                        worker {k}
                                    </span>
                                ))}
                                <span className="sb-proxy__node sb-proxy__node--proxy" style={{ left: proxy.x, top: proxy.y }}>
                                    createProxy{!compact && <span className="sb-proxy__sub">:4444{BASE}</span>}
                                </span>
                                <span className="sb-proxy__node" style={{ left: discord.x, top: discord.y }}>
                                    discord.com{!compact && <span className="sb-proxy__sub">/api/v10</span>}
                                </span>
                                <div className="sb-proxy__log" style={{ top: logTop, left: pad, right: pad }}>
                                    <div className="sb-proxy__head">
                                        <span>
                                            Authorization: Bot <span className="sb-proxy__token">&lt;token&gt;</span>
                                        </span>
                                        {!compact && <span className="sb-proxy__status">status</span>}
                                    </div>
                                    {/* the next request waits closed on top; the rest are open, newest first */}
                                    {Array.from({ length: DEPTH + 1 }, (_, i) => s.n - i).map((k) => {
                                        const r = at(k);
                                        return (
                                            <Collapse key={k} open={k < s.n} reveal="drop">
                                                <div className="sb-proxy__row" data-fresh={k === s.n - 1 || undefined}>
                                                    <span className="sb-proxy__method">{r.method}</span>
                                                    <span className="sb-proxy__route">
                                                        <span className="sb-proxy__base">{BASE}</span>
                                                        {r.route}
                                                    </span>
                                                    <span className="sb-proxy__status">200</span>
                                                </div>
                                            </Collapse>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Every worker&apos;s REST calls through one proxy that holds the token.
        </Tile>
    );
}
