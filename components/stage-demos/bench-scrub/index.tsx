"use client";

import { useState } from "react";
import { Bar, Chart, Count, Roll, Stage, chartPoints, type Act, type Layout } from "@/components/stageshow/kit";
import "@/components/stageshow/seyfert.css";
import "./scrub.css";

// The /benchmark memory panel, scrubbed. Two RSS lines from the same twelve
// hour run (Node.js, 30-minute averages): Seyfert low in amber, discord.js
// high in gray. The pointer comes onto the plot, a hairline picks up the half
// hour under it, and both headline figures roll to that point while a small
// dimension on the hairline reads the gap between them. It runs to the last
// sample and rests there: twelve hours in, the gap hasn't closed.
//
// The headline is the readout (no tooltip box), the readout is always a real
// sample (the nearest one) while the hairline sits at the pointer, and over
// the plot the pointer is a crosshair. Every figure on screen is one of the
// samples or a difference of two of them.

export type BenchSeries = {
    seyfert: number[];
    discord: number[];
    /** medianMb of each series, the figure the landing and /benchmark quote */
    median: { seyfert: number; discord: number };
};

type S = { i: number | null; x: number | null };

/** the plot's top, in MB: a round step over discord.js's highest sample */
const MAX = 250;
const GRID = [200, 100, 0];
const PLOT = { wide: { width: 540, height: 216 }, compact: { width: 254, height: 150 } };
/** the pointer comes onto the line at 1h 30m and runs to the last sample */
const START = 3;

const clock = (i: number) => {
    const minutes = i * 30;
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
};
const mb = (n: number) => `${n} MB`;
/** placed by a transform, so the scrubbed parts glide on subpixels instead of snapping */
const at = (x: number, y: number) => ({ transform: `translate(${x}px, ${y}px)` });

function makeScript(data: BenchSeries) {
    const last = data.seyfert.length - 1;
    return async function script(a: Act<S>) {
        // the lines draw in first
        await a.wait(1500);
        const box = a.rect("plot");
        const plot = PLOT[a.layout];
        const pts = chartPoints({ data: data.seyfert, width: box.width, height: plot.height, dot: false, max: MAX });
        // in the quiet band under Seyfert's line, clear of the gap's label
        const at = (i: number) => ({ x: box.x + pts[i].x, y: box.y + pts[i].y + 24 });
        a.mark("hover");
        await a.move(at(START), { duration: 800 });
        a.put({ i: START, x: pts[START].x });
        await a.wait(900);
        a.mark("scrub");
        // one eased stroke along the run; the readout is the sample nearest the hairline
        await a.move(at(last), {
            duration: 2800,
            path: (e, from, to) => ({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e }),
            onMove: (pt) => {
                const x = Math.max(0, Math.min(box.width, pt.x - box.x));
                let near = 0;
                for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - x) < Math.abs(pts[near].x - x)) near = i;
                a.put({ i: near, x });
            },
        });
        a.put({ i: last, x: pts[last].x });
        a.mark("rest");
        await a.wait(2600);
    };
}

// The y of a drawn line at x: a short search along the path's length
function yOn(path: SVGPathElement | null | undefined, x: number) {
    if (!path) return null;
    let lo = 0;
    let hi = path.getTotalLength();
    for (let k = 0; k < 24; k++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).x < x) lo = mid;
        else hi = mid;
    }
    return path.getPointAtLength(hi).y;
}

function Header({ layout }: { layout: Layout }) {
    return (
        <div className="bs-head">
            <div className="bs-head__copy">
                <div className="bs-title">Memory usage</div>
                <div className="bs-sub">{layout === "wide" ? "RSS · total memory held by the process" : "RSS in MB · Node.js"}</div>
            </div>
            {layout === "wide" && (
                <div className="bs-seg" aria-hidden>
                    <span data-on>Node.js</span>
                    <span>Deno</span>
                    <span>Bun</span>
                </div>
            )}
        </div>
    );
}

function Figure({ lib, name, value }: { lib: "seyfert" | "discord"; name: string; value: number }) {
    return (
        <div className="bs-fig" data-lib={lib}>
            <span className="bs-fig__name">
                <span className="bs-swatch" />
                {name}
            </span>
            <span className="bs-fig__value">
                <Count value={value} format={mb} duration={280} stagger={24} />
            </span>
        </div>
    );
}

export default function BenchScrub({ data }: { data: BenchSeries }) {
    const [plotEl, setPlotEl] = useState<HTMLDivElement | null>(null);
    const last = data.seyfert.length - 1;
    const script = makeScript(data);
    return (
        <Stage<S>
            width={960}
            height={430}
            compact={{ below: 720, width: 358, height: 470 }}
            initial={{ i: null, x: null }}
            poster={{ i: last, x: null }}
            script={script}
            play="once"
            theme="dark"
            cursor={{ at: { wide: { x: 200, y: 360 }, compact: { x: 300, y: 150 } } }}
            className="sy bs"
        >
            {(s, _rect, layout) => {
                const plot = PLOT[layout];
                const sey = chartPoints({ data: data.seyfert, width: plot.width, height: plot.height, dot: false, max: MAX });
                const djs = chartPoints({ data: data.discord, width: plot.width, height: plot.height, dot: false, max: MAX });
                // the hairline at the pointer (or on the sample, for the still); a dot on each curve under it
                const on = s.i !== null;
                // before the pointer arrives they wait, hidden, where it will land
                const i = s.i ?? START;
                const hx = s.x ?? sey[i].x;
                const lines = plotEl?.querySelectorAll<SVGPathElement>(".ss-chart__line");
                const ys = yOn(lines?.[0], hx) ?? sey[i].y;
                const yd = yOn(lines?.[1], hx) ?? djs[i].y;
                const gap = data.discord[i] - data.seyfert[i];
                const ticks = [0, Math.round(last / 2), last];
                return (
                    <div className="bs-panel">
                        <Header layout={layout} />
                        <div className="bs-body">
                        <div className="bs-read">
                            <div className="bs-when">
                                <Roll variant="fade">{on ? `At ${clock(i)}` : "Median over 12 hours"}</Roll>
                            </div>
                            {/* wide, the figures stack in the order their lines run */}
                            <div className="bs-figs">
                                {layout === "wide" && <Figure lib="discord" name="discord.js" value={on ? data.discord[i] : data.median.discord} />}
                                <Figure lib="seyfert" name="Seyfert" value={on ? data.seyfert[i] : data.median.seyfert} />
                                {layout === "compact" && <Figure lib="discord" name="discord.js" value={on ? data.discord[i] : data.median.discord} />}
                            </div>
                        </div>
                        <div className="bs-chart">
                            <div className="bs-grid" style={{ height: plot.height }}>
                                {GRID.map((v) => (
                                    <span key={v} className="bs-grid__label" style={{ top: (1 - v / MAX) * (plot.height - 2) + 1 }}>
                                        {v === 0 || layout === "compact" ? String(v) : `${v} MB`}
                                    </span>
                                ))}
                            </div>
                            <div ref={setPlotEl} className="bs-plot" data-target="plot" data-cursor="crosshair" style={{ width: plot.width, height: plot.height }}>
                                {GRID.map((v) => (
                                    <span key={v} className="bs-rule" style={{ top: Math.round((1 - v / MAX) * (plot.height - 2) + 1) }} />
                                ))}
                                <Chart data={data.seyfert} width={plot.width} height={plot.height} dot={false} max={MAX} className="bs-line bs-line--seyfert" />
                                <Chart data={data.discord} width={plot.width} height={plot.height} dot={false} max={MAX} area={false} className="bs-line bs-line--discord" />
                                <span className="bs-hair" data-on={on || undefined} style={at(hx, 0)} />
                                <span className="bs-span" data-on={on || undefined} style={{ ...at(hx, yd), height: ys - yd }} />
                                <span className="bs-tag" data-on={on || undefined} style={at(hx, (ys + yd) / 2)}>
                                    <Count value={gap} format={(n) => `−${n} MB`} duration={280} stagger={24} />
                                </span>
                                <span className="bs-dot bs-dot--discord" data-on={on || undefined} style={at(hx, yd)} />
                                <span className="bs-dot bs-dot--seyfert" data-on={on || undefined} style={at(hx, ys)} />
                            </div>
                            <div className="bs-axis" style={{ width: plot.width }}>
                                {ticks.map((t) => (
                                    <span key={t} style={{ left: sey[t].x }}>
                                        {t === 0 ? "0h" : clock(t).replace(" 00m", "")}
                                    </span>
                                ))}
                            </div>
                        </div>
                        </div>
                        <div className="bs-foot" aria-hidden>
                            {[64, 88, 52, 76].map((w, k) => (
                                <span key={k} className="bs-foot__cell">
                                    <Bar w={Math.round(w * 0.6)} h={5} tone={2} />
                                    <Bar w={w} h={8} tone={3} />
                                </span>
                            ))}
                        </div>
                    </div>
                );
            }}
        </Stage>
    );
}
