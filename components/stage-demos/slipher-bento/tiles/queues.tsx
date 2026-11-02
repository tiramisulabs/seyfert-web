"use client";

import type { CSSProperties } from "react";
import { Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./queues.css";

// @slipher/queues as a job board: a producer adds jobs to the `audio` queue
// and each card moves across the queue's states, waiting, then active in one
// of the processor's four slots, then completed, newest on top. One job is
// added per beat and each runs three beats, so three slots are busy at a
// time.
//
// Strings: `ctx.queues.get('audio').add(…)`, the queue name `audio`, the job
// names `transcode` and `concatenate`, the payloads (fileId 'file-2' as
// 'ogg', fileIds 'a' and 'b') and `concurrency: 4` are the queues guide's own
// (content/docs/plugins/official/queues.mdx: Usage and Producing Jobs). The
// column names are @slipher/queues 1.0.0's JobStatus values (`waiting`,
// `active`, `completed`; tiramisulabs/extra at 678b791, packages/queues/src/
// core.ts). Invented: 'file-3' and 'file-4', and the card shorthand
// "file-2 · ogg" for a payload.
//
// A conveyor: the four jobs repeat, and each lap ends by snapping the beat
// back one lap. Cards are keyed by their place in the stream, and a job's
// slot and payload repeat every four, so the picture is the same across it.

type Job = { name: "transcode" | "concatenate"; data: string };
const JOBS: Job[] = [
    { name: "transcode", data: "file-2 · ogg" },
    { name: "concatenate", data: "a + b" },
    { name: "transcode", data: "file-3 · mp3" },
    { name: "transcode", data: "file-4 · ogg" },
];
const SLOTS = 4;
// Beats a job spends waiting, then active
const WAITS = 2;
const RUNS = 3;

// t is the beat; job k is added on beat k
type Board = { t: number };
const START = JOBS.length * 3;
const start: Board = { t: START };
const jobAt = (k: number) => JOBS[k % JOBS.length];

const board = async (a: Act<Board>) => {
    // the same 900ms beat throughout, the seam included: the last move
    // settles (700ms), the snap, then the rest
    for (let t = START + 1; t <= START + JOBS.length; t++) {
        await a.wait(t === START + 1 ? 200 : 900);
        await a.set({ t });
    }
    await a.wait(700);
    await a.snap({ t: START });
};

type Where = { col: number; row: number; shown: boolean; state: "pending" | "waiting" | "active" | "completed" };

// Where job k sits on beat t
function place(k: number, t: number): Where {
    const age = t - k;
    if (age < 0) return { col: 0, row: -1, shown: false, state: "pending" };
    if (age < WAITS) return { col: 0, row: WAITS - 1 - age, shown: true, state: "waiting" };
    if (age < WAITS + RUNS) return { col: 1, row: k % SLOTS, shown: true, state: "active" };
    const row = age - WAITS - RUNS;
    return { col: 2, row, shown: row < 4, state: "completed" };
}

const COLUMNS = ["waiting", "active", "completed"];

export function QueuesTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const pad = compact ? 24 : 28;
    const gap = compact ? 8 : 14;
    const colW = (width - pad * 2 - gap * 2) / 3;
    const top = 70;
    const cardH = compact ? 28 : 30;
    const step = cardH + 8;
    const height = 236;
    const xy = (col: number, row: number) => ({ x: pad + col * (colW + gap), y: top + row * step });
    return (
        <Tile area="queues" pkg={["@slipher/queues"]} title="Work that waits its turn." picture={
            <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                <Stage<Board> width={width} height={height} theme="dark" initial={start} play="loop" script={board} className="sy sb-stage">
                    {(s) => {
                        const added = jobAt(s.t);
                        return (
                            <div className="sb-queue" data-layout={compact ? "compact" : "wide"} style={{ ["--card-h" as string]: `${cardH}px`, ["--col-w" as string]: `${colW}px` } as CSSProperties}>
                                {/* the producer, naming the job it just added */}
                                <div className="sb-queue__producer" style={{ left: pad }}>
                                    <span className="sb-queue__dim">ctx.queues.get(</span>
                                    <span className="sb-queue__str">&apos;audio&apos;</span>
                                    <span className="sb-queue__dim">).add(</span>
                                    <span key={s.t % JOBS.length} className="sb-queue__str sb-queue__added">
                                        &apos;{added.name}&apos;
                                    </span>
                                    <span className="sb-queue__dim">, …)</span>
                                </div>
                                {COLUMNS.map((name, col) => (
                                    <div key={name} className="sb-queue__head" style={{ left: xy(col, 0).x, width: colW }}>
                                        {name}
                                        {col === 1 && !compact && <span className="sb-queue__note">concurrency: {SLOTS}</span>}
                                    </div>
                                ))}
                                {/* the processor's slots, under whatever runs in them */}
                                {Array.from({ length: SLOTS }, (_, slot) => {
                                    const p = xy(1, slot);
                                    return <span key={slot} className="sb-queue__slot" style={{ left: p.x, top: p.y, width: colW }} />;
                                })}
                                {Array.from({ length: 12 }, (_, i) => s.t + 1 - i).map((k) => {
                                    const at = place(k, s.t);
                                    // a job not yet added waits just above the waiting column
                                    const p = at.state === "pending" ? { x: xy(0, 0).x, y: top - 18 } : xy(at.col, at.row);
                                    const job = jobAt(k);
                                    return (
                                        <div
                                            key={k}
                                            className="sb-queue__card"
                                            data-state={at.state}
                                            style={{ transform: `translate(${p.x}px, ${p.y}px)`, opacity: at.shown ? 1 : 0, width: colW }}
                                        >
                                            {at.state === "completed" && <span className="sb-queue__done">✓</span>}
                                            <span className="sb-queue__name">{job.name}</span>
                                            {!compact && <span className="sb-queue__data">{job.data}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }}
                </Stage>
            </div>
        }>
            Typed jobs added from any command, run by processor classes, in memory or on BullMQ.
        </Tile>
    );
}
