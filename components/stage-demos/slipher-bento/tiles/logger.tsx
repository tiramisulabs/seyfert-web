"use client";

import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./logger.css";

// @slipher/logger: one wide event per interaction. The bot's console, as
// prettyRenderer() prints it in development: a /ping and a /deploy run, each
// leaving a `command received` breadcrumb and then ONE entry when it ends.
// Before that entry is emitted, it builds in place: the `ctx.logger` card at
// the foot collects the auto-extracted fields, then what the middleware and
// the command add(), and the deploy's immediate info() lands above it. When
// the command returns the card becomes the real `command completed` entry,
// with outcome and durationMs appended. The card is the picture's device;
// everything printed is the renderer's.
//
// Strings, from @slipher/logger 1.0.0 (tiramisulabs/extra main at bad00ca,
// packages/logger) and its guide (content/docs/plugins/official/logger.mdx):
// - "command received" is the observer's onBeforeMiddlewares debug(), and
//   "command completed" closeRun()'s `${kind} completed` (plugin.ts).
// - The fields are extractSeyfertLogContext()'s, in its order (command,
//   guildId, channelId, userId, interactionId), then `kind`, which
//   getContextLogger() adds afterwards, then the add()-ed fields, then the
//   emit()'s outcome and durationMs (core.ts).
// - The head is formatConsolePayload()'s: level upper-cased and padded to 5,
//   the `name` binding as [tag], the message; fields indented 4 with keys
//   padded to the longest key + 3. Colors are its ANSI 256 ones (time 245,
//   tag 110, key 73, info 75, debug 141). The time column is left out: its
//   value would differ on every lap and break the seam.
// - `name: 'slipher-bot'`, the deploy command with its audit middleware
//   (requestId, plan) and `context.logger.add({ projectId: 'web', plan })`
//   followed by `context.logger.info('deployment queued')`, `durationMs: 42`,
//   and userId 366779196975874049 are the guide's.
// Invented: the requestId (the guide's is crypto.randomUUID(), shown "7c5d…"),
// the interaction ids, the deploy's 118ms; the guild and channel ids are the
// docs' usual ones.

const NAME = "slipher-bot";
const GUILD = "1003825077969764412";
const CHANNEL = "1003825079328702529";
const USER = "366779196975874049";

type Field = [key: string, value: string];
type Line = { kind: "line"; level: "debug" | "info"; message: string };
type Wide = { kind: "wide"; fields: Field[]; outcome: Field[] };
type Entry = Line | Wide;

const auto = (command: string, interactionId: string): Field[] => [
    ["command", command],
    ["guildId", GUILD],
    ["channelId", CHANNEL],
    ["userId", USER],
    ["interactionId", interactionId],
    ["kind", "command"],
];

// One lap, oldest first: the stream repeats it forever
const LAP: Entry[] = [
    { kind: "line", level: "debug", message: "command received" },
    { kind: "wide", fields: auto("ping", "1435061848713236521"), outcome: [["outcome", "success"], ["durationMs", "42ms"]] },
    { kind: "line", level: "debug", message: "command received" },
    { kind: "line", level: "info", message: "deployment queued" },
    {
        kind: "wide",
        fields: [...auto("deploy", "1435061901377347614"), ["requestId", "7c5d9a4e-2f1b-4c8e-9d3a-6b0e1f2a7c44"], ["plan", "pro"], ["projectId", "web"]],
        outcome: [["outcome", "success"], ["durationMs", "118ms"]],
    },
];
const entryAt = (k: number) => LAP[((k % LAP.length) + LAP.length) % LAP.length];
// prettyRenderer pads every key to the entry's longest one + 3: interactionId
const KEY_WIDTH = "interactionId".length + 3;
// Entries kept mounted above the foot: more than the panel shows
const DEPTH = 6;

// n counts the entries printed so far; `built` is how many fields the next
// wide event holds while it builds, or -1 when none is building
type Log = { n: number; built: number };
const START = LAP.length * 2;
const logStart: Log = { n: START, built: -1 };
// The still: the deploy's entry building, its middleware fields in
const logPoster: Log = { n: START + 3, built: 8 };

const streaming = async (a: Act<Log>) => {
    // 1.6s between one interaction's entry and the next one's breadcrumb,
    // the seam included (900ms before the snap, 700ms after)
    await a.wait(700);
    // /ping: the breadcrumb, the card with the auto fields, then the entry
    await a.set({ n: START + 1, built: 6 });
    await a.wait(900);
    await a.set({ n: START + 2, built: -1 });
    await a.wait(1600);
    // /deploy: the breadcrumb and the auto fields, the middleware's add(),
    // the command's add() and info(), then the one entry
    await a.set({ n: START + 3, built: 6 });
    await a.wait(700);
    await a.set({ built: 8 });
    await a.wait(700);
    await a.set({ built: 9 });
    await a.wait(500);
    await a.set({ n: START + 4 });
    await a.wait(700);
    await a.set({ n: START + 5, built: -1 });
    await a.wait(900);
    await a.snap({ n: START });
};

function Head({ level, message }: { level: "debug" | "info"; message: string }) {
    return (
        <div className="sb-log__row">
            <span className={`sb-log__level sb-log__level--${level}`}>{level.toUpperCase().padEnd(5)}</span>
            {" "}
            <span className="sb-log__tag">[{NAME}]</span>
            {` ${message}`}
        </div>
    );
}

function FieldRow({ field }: { field: Field }) {
    return (
        <div className="sb-log__row">
            {"    "}
            <span className="sb-log__key" style={{ width: `${KEY_WIDTH}ch` }}>
                {field[0]}
            </span>
            {field[1]}
        </div>
    );
}

// A wide event: the card while it builds, the printed entry once emitted.
// One element throughout, so the card turns into the entry where it stands.
function WideEntry({ entry, printed, built }: { entry: Wide; printed: boolean; built: number }) {
    const shown = printed ? entry.fields.length : built;
    return (
        <div className="sb-log__wide" data-printed={printed || undefined}>
            <div className="sb-log__swap">
                <div className="sb-log__card-head" aria-hidden={printed || undefined}>
                    {"ctx.logger "}
                    <span className="sb-log__hint">wide event, building</span>
                </div>
                <div className="sb-log__entry-head" aria-hidden={!printed || undefined}>
                    <Head level="info" message="command completed" />
                </div>
            </div>
            {entry.fields.map((field, i) => (
                <Collapse key={field[0]} open={i < shown}>
                    <FieldRow field={field} />
                </Collapse>
            ))}
            {entry.outcome.map((field) => (
                <Collapse key={field[0]} open={printed}>
                    <FieldRow field={field} />
                </Collapse>
            ))}
        </div>
    );
}

export function LoggerTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    return (
        <Tile
            area="logger"
            pkg={["@slipher/logger"]}
            title="One entry per interaction."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Log> width={width} height={compact ? 250 : 270} theme="dark" initial={logStart} poster={logPoster} play="loop" script={streaming} className="sy sb-stage">
                        {(s) => {
                            // the next wide event, if one is building
                            let building = -1;
                            if (s.built >= 0) for (let k = s.n; building < 0; k++) if (entryAt(k).kind === "wide") building = k;
                            const last = Math.max(s.n, building + 1);
                            return (
                                <div className="sb-log" data-layout={compact ? "compact" : "wide"}>
                                    <div className="sb-log__stream">
                                        {Array.from({ length: last - (s.n - DEPTH) }, (_, i) => s.n - DEPTH + i).map((k) => {
                                            const entry = entryAt(k);
                                            const printed = k < s.n;
                                            return (
                                                <Collapse key={k} open={printed || k === building} className="sb-log__entry">
                                                    {entry.kind === "line" ? <Head level={entry.level} message={entry.message} /> : <WideEntry entry={entry} printed={printed} built={k === building ? s.built : 0} />}
                                                </Collapse>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        }}
                    </Stage>
                </div>
            }
        >
            Fields add up through the command, then print once when it ends.
        </Tile>
    );
}
