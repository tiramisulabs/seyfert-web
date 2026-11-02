"use client";

import type { CSSProperties } from "react";
import { Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./scheduler.css";

// @slipher/scheduler as a timeline: three tasks on lanes, their runs drawn as
// bars, the schedule gliding left under a fixed "now". What has passed now is
// lit, what is still ahead is dim, so a run lights as it starts and a long run
// fills as it goes. The second task skips the tick that comes while its
// previous run is still pending.
//
// Strings: the task ids `poller` and `refresh-cache`, the durations `'10s'`
// and `'30s'`, `overlap: 'skip'` and the `skipped` event are the scheduler
// guide's own (content/docs/plugins/official/scheduler.mdx: the registry
// `add('poller', '10s', …)` example, `ctx.scheduler.interval('refresh-cache',
// '30s', …, { overlap: 'skip' })`, "A skipped tick emits `skipped`"; the
// same names are in @slipher/scheduler 1.0.0's types, tiramisulabs/extra at
// 678b791). `heartbeat` is the guide's id too, though its examples use '5m'
// and '1h': the '1m' here is invented, so one run lands in every lap.
// Invented: how long each run takes.
//
// The clock runs ten times faster than real time: a lap is one schedule
// minute in six seconds. The runs repeat every lap, so the track is a
// pattern moved by exactly one lap, a CSS loop with no seam.

type Lane = { id: string; every: string; note?: string };
const LANES: Lane[] = [
    { id: "poller", every: "'10s'" },
    { id: "refresh-cache", every: "'30s'", note: "overlap: 'skip'" },
    { id: "heartbeat", every: "'1m'" },
];

// One lap's runs, in schedule seconds; the pattern repeats every lap
type Run = { lane: number; at: number; takes: number; skipped?: boolean };
const LAP = 60;
const LAP_MS = 6000;
const PATTERN: Run[] = [
    ...[0, 10, 20, 30, 40, 50].map((at) => ({ lane: 0, at, takes: 2 })),
    // the 30s tick comes while the 0s run is still pending: skipped
    { lane: 1, at: 0, takes: 36 },
    { lane: 1, at: 30, takes: 0, skipped: true },
    { lane: 2, at: 15, takes: 4 },
];
// Enough laps either side to cover the window through a whole lap's glide
const RUNS = [-2, -1, 0, 1, 2].flatMap((lap) => PATTERN.map((r) => ({ ...r, at: r.at + lap * LAP })));
// Schedule seconds across the window, and where "now" sits in it
const VISIBLE = 75;
const NOW = 0.62;

// Nothing to change: the CSS glide is the motion, the script keeps it playing
const hold = async (a: Act<{ lap: number }>) => {
    await a.wait(LAP_MS);
};

function Track({ pps, lit }: { pps: number; lit?: boolean }) {
    return (
        <div className="sb-sched__track" data-lit={lit || undefined}>
            {/* a faint line every 10 schedule seconds */}
            {Array.from({ length: (5 * LAP) / 10 + 1 }, (_, i) => -2 * LAP + i * 10).map((s) => (
                <span key={s} className="sb-sched__grid" style={{ left: s * pps }} />
            ))}
            {RUNS.map((r, i) =>
                r.skipped ? (
                    <span key={i} className="sb-sched__skip" style={{ left: r.at * pps, top: `var(--lane-${r.lane})` }}>
                        <span className="sb-sched__skip-mark" />
                        skipped
                    </span>
                ) : (
                    <span key={i} className="sb-sched__run" style={{ left: r.at * pps, width: Math.max(4, r.takes * pps), top: `var(--lane-${r.lane})` }} />
                ),
            )}
        </div>
    );
}

export function SchedulerTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const pad = compact ? 24 : 28;
    // wide: labels in a column on the left; compact: each label over its lane
    const labelW = compact ? 0 : 176;
    const x0 = pad + labelW;
    const trackW = width - x0 - pad;
    const pps = trackW / VISIBLE;
    const nowX = trackW * NOW;
    const laneY = compact ? [44, 112, 180] : [44, 104, 164];
    const barOffset = compact ? 22 : 0;
    const height = compact ? 236 : 214;
    const vars = {
        "--lap": `${LAP * pps}px`,
        "--lap-ms": `${LAP_MS}ms`,
        ...Object.fromEntries(laneY.map((y, i) => [`--lane-${i}`, `${y + barOffset}px`])),
    } as CSSProperties;
    return (
        <Tile area="scheduler" pkg={["@slipher/scheduler"]} title="Recurring work, on the clock." picture={
            <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                <Stage<{ lap: number }> width={width} height={height} theme="dark" initial={{ lap: 0 }} play="loop" script={hold} className="sy sb-stage">
                    {() => (
                        <div className="sb-sched" data-layout={compact ? "compact" : "wide"} style={vars}>
                            {LANES.map((lane, i) => (
                                <div key={lane.id} className="sb-sched__label" style={{ top: laneY[i], left: pad, width: compact ? trackW : labelW - 16 }}>
                                    <span className="sb-sched__id">{lane.id}</span> <span className="sb-sched__every">{lane.every}</span>
                                    {lane.note && <span className="sb-sched__note">{lane.note}</span>}
                                </div>
                            ))}
                            <div className="sb-sched__window" style={{ left: x0, width: trackW }}>
                                <div className="sb-sched__at" style={{ left: nowX }}>
                                    <Track pps={pps} />
                                </div>
                                {/* the same track, lit, only where it has passed now */}
                                <div className="sb-sched__past" style={{ clipPath: `inset(0 ${trackW - nowX}px 0 0)` }}>
                                    <div className="sb-sched__at" style={{ left: nowX }}>
                                        <Track pps={pps} lit />
                                    </div>
                                </div>
                                <span className="sb-sched__now" style={{ left: nowX }}>
                                    <span className="sb-sched__now-label">now</span>
                                </span>
                            </div>
                        </div>
                    )}
                </Stage>
            </div>
        }>
            Cron and interval tasks that start and stop with the client, in memory or on BullMQ.
        </Tile>
    );
}
