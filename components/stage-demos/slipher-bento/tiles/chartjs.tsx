"use client";

import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import type { CodeLines } from "../../code";
import { SlotRow, Tile, usePictureWidth } from "../index";
import "./chartjs.css";

// @slipher/chartjs: kira runs /chart, the bot renders a Chart.js bar chart
// to a PNG and sends it as an attachment. On the left (wide only), the
// guide's renderToBuffer call with this run's numbers; on the right, the
// channel, each run's reply landing at the foot with its own image and the
// one before rising out of view. A sent image never changes; a new run is a
// new message.
//
// Strings: `canvas.renderToBuffer`, the configuration (`type: 'bar'`, the
// labels January–April, the dataset label "Messages") and the first run's
// data [120, 90, 200, 150] are the Chart.js guide's (content/docs/plugins/
// official/chartjs.mdx), as are the command's name, chart, and the 800 × 400
// white canvas the image is drawn at. @slipher/chartjs 0.0.5
// (tiramisulabs/extra main at 678b791, packages/chartjs) loads chart.js/auto
// (Chart.js 4.5.1), whose Colors plugin gives a dataset without colors
// rgb(54, 162, 235) at half opacity; the image is drawn after Chart.js's
// default bar look (legend box over the plot, light grid, gray ticks), not
// captured from a render. Invented: the second and third runs' numbers, kira
// and Orbit (the cooldown tile's), and the fixed 0–250 axis.
//
// The loop never rewinds: three runs, then a snap back one lap to the same
// picture.

const DATA = [
    [120, 90, 200, 150],
    [150, 110, 170, 210],
    [90, 160, 140, 180],
];
const LABELS = ["January", "February", "March", "April"];
const AXIS = 250;
const at = (k: number) => DATA[k % DATA.length];
// Replies kept mounted above the newest: more than the channel shows
const DEPTH = 2;

// n counts the runs sent; next means this run's numbers are in the call and
// its image is being rendered
type Runs = { n: number; next: boolean };
const START = DATA.length * 2;
const initial: Runs = { n: START, next: false };

// A run every 2.1s, the seam included
const runs = async (a: Act<Runs>) => {
    for (let k = START; k < START + DATA.length; k++) {
        await a.wait(k === START ? 600 : 1400);
        await a.set({ next: true });
        await a.wait(700);
        await a.set({ n: k + 1, next: false });
    }
    await a.wait(800);
    await a.snap({ n: START });
};

// The PNG, drawn in the canvas's own 800 × 400 pixels and shown scaled
// down, as Discord shows an attachment
function ChartImage({ data }: { data: number[] }) {
    const plot = { left: 58, right: 780, top: 52, bottom: 360 };
    const y = (v: number) => plot.bottom - (v / AXIS) * (plot.bottom - plot.top);
    const band = (plot.right - plot.left) / data.length;
    // Chart.js's categoryPercentage 0.8 × barPercentage 0.9
    const bar = band * 0.72;
    return (
        <svg className="sb-chart__img" viewBox="0 0 800 400" role="img" aria-label="Bar chart of Messages, January to April">
            <rect width="800" height="400" fill="#fff" />
            {/* legend: the dataset's box and label, centered over the plot */}
            <rect x="337" y="12" width="40" height="12" fill="rgba(54, 162, 235, 0.5)" />
            <text x="383" y="23" className="sb-chart__tick" textAnchor="start">
                Messages
            </text>
            {[0, 50, 100, 150, 200, 250].map((v) => (
                <g key={v}>
                    <line x1={plot.left} x2={plot.right} y1={y(v)} y2={y(v)} stroke="rgba(0, 0, 0, 0.1)" />
                    <text x={plot.left - 8} y={y(v) + 4} className="sb-chart__tick" textAnchor="end">
                        {v}
                    </text>
                </g>
            ))}
            {data.map((v, i) => (
                <rect key={i} x={plot.left + band * i + (band - bar) / 2} y={y(v)} width={bar} height={plot.bottom - y(v)} fill="rgba(54, 162, 235, 0.5)" />
            ))}
            {LABELS.map((label, i) => (
                <text key={label} x={plot.left + band * i + band / 2} y={plot.bottom + 22} className="sb-chart__tick" textAnchor="middle">
                    {label}
                </text>
            ))}
        </svg>
    );
}

export function ChartjsTile({ code }: { code: CodeLines }) {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 250 : 262;
    return (
        <Tile
            area="chartjs"
            pkg={["@slipher/chartjs"]}
            title="Charts as attachments."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Runs> width={width} height={height} theme="dark" initial={initial} play="loop" script={runs} className="sy sb-stage">
                        {(s) => {
                            // the numbers in the call: the newest run's, or the next one's while it renders
                            const shown = (s.n - 1 + (s.next ? 1 : 0)) % DATA.length;
                            return (
                                <div className="sb-chart" data-layout={compact ? "compact" : "wide"}>
                                    {!compact && (
                                        <div className="sb-chart__code" data-rendering={s.next || undefined}>
                                            {code.map((line, i) => (
                                                <div key={i} className="sb-editor__line">
                                                    <span className="sb-editor__code">
                                                        <SlotRow line={line} text={DATA[shown].join(", ")} slot={shown} />
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="sb-chart__channel">
                                        {/* oldest first, pinned to the foot; the next reply waits closed below */}
                                        {Array.from({ length: DEPTH + 1 }, (_, i) => s.n - DEPTH + i).map((k) => (
                                            <Collapse key={k} open={k < s.n} reveal="drop" from="below" className="sb-chart__turn">
                                                <div className="sb-chart__group">
                                                    <div className="sb-dc__used">
                                                        <span className="sb-dc__spine" />
                                                        <span className="sb-dc__who">kira</span> used <span className="sb-dc__cmd">/chart</span>
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
                                                            <ChartImage data={at(k)} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </Collapse>
                                        ))}
                                    </div>
                                </div>
                            );
                        }}
                    </Stage>
                </div>
            }
        >
            Chart.js rendered to a PNG, no browser needed.
        </Tile>
    );
}
