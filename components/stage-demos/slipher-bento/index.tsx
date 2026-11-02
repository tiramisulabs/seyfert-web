"use client";

import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Collapse, Count, Stage, type Act } from "@/components/stageshow/kit";
import { CodeRow, type CodeLines } from "../code";
import { SLOT } from "./source";
import "@/components/stageshow/seyfert.css";
import "./bento.css";

// The @slipher packages as a ruled grid on the observatory page: one rounded
// container, 1px rules between the cells, no gaps, the copy as page text and
// each picture its own Stage at 1:1, pinned to its cell's bottom.
//
//   Tile      Span   Kind        The one thing                                 Moves
//   Redis     2 × 1  Diagram+UI  three workers writing into one key list       keys keep arriving, the writer's line lights (leads)
//   Cooldown  1 × 1  Component   the plugin's denied reply in Discord          /ping after /ping: Pong!, a denial counting down, Pong!
//   ESLint    1 × 1  Component   a command class without @Declare, flagged     the squiggle and its hover arrive
//   HTTP      2 × 1  Diagram     POST /interactions into either HTTP adapter    still
//   The rest  3 × 1  Collection  the other @slipher packages, bleeding off      the rows glide past, opposite ways
//
// Two more for the docs' Utilities section only, outside the grid:
//
//   Testing   Editor+terminal  the echo test and Vitest's rows    reruns on one message after another
//   Watcher   Editor+terminal  ping.ts and the watcher's log      edit, save, change detected, built
//
// Every string is the packages' own: the Redis keys are the cache's dotted
// keys under the adapter's default `seyfert` namespace (IDs from the docs'
// examples), the reply is @slipher/cooldown's default middleware message, the
// lint message and rule id are require-declare's, and the adapter names and
// /interactions path are the ones the setup guide and uws-adapter use.
//
// The cooldown reply only reaches Discord through an onMiddlewaresError that
// sends it: Seyfert's default just logs. With the handler from Handling
// errors (`context.editOrReply({ content: error })`) @slipher/cooldown 1.0.0
// answers a blocked /ping with exactly this text, not ephemeral (checked with
// @slipher/testing's mock bot).

const STEP = 110;
export const LEAD = 450;

type Beat = { on: boolean };
const before: Beat = { on: false };
const after: Beat = { on: true };
const beat = (i: number) => async (a: Act<Beat>) => {
    await a.wait(LEAD + i * STEP);
    await a.set({ on: true });
};

// Measure the tile, not the page: a wide page can still hold a narrow tile.
export function usePictureWidth(initial = 340) {
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

export function Tile({ area, pkg, title, children, picture }: { area: string; pkg: string[]; title: ReactNode; children: ReactNode; picture: ReactNode }) {
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
// The writes, oldest first, as a conveyor: they repeat forever, the newest
// lands on top and the oldest slides out under the tile's bottom edge. Each
// resource writes under its own key shape (Seyfert's hashId / hashGuildId):
// member is guild-scoped, the rest are one id. Seven distinct keys, more than
// the panel ever shows, so no key is on screen twice. The member key is too
// long for a phone column, so compact leaves it out. No worker writes twice in
// a row, across the lap's seam too, so every write lights a new line.
const WRITES: Key[] = [
    { id: "member.1003825077969764412.366779196975874049", by: 0 },
    { id: "user.366779196975874049", by: 2 },
    { id: "channel.1003825079328702529", by: 1 },
    { id: "guild.1003825077969764412", by: 0 },
    { id: "role.1115437277846458388", by: 1 },
    { id: "message.1529923192402088189", by: 2 },
    { id: "user.576805413148688424", by: 1 },
];
const COMPACT_WRITES = WRITES.filter((key) => !key.id.startsWith("member."));
// Rows kept mounted under the newest: more than the panel shows
const DEPTH = 6;

// n counts the writes so far; the stream starts a full lap in, so the list is
// full on the first frame, and each lap ends by snapping n back one lap: the
// same picture with smaller numbers.
type Cache = { n: number; lit: number };
const startOf = (writes: Key[]) => writes.length * 2;
const keyAt = (writes: Key[], k: number) => writes[k % writes.length];
const cacheStart = (writes: Key[]): Cache => ({ n: startOf(writes), lit: keyAt(writes, startOf(writes) - 1).by });

function cacheScript(writes: Key[]) {
    return async (a: Act<Cache>) => {
        const start = startOf(writes);
        // The same 880ms beat between writes, the seam included: the last key
        // finishes landing (its drop takes 800ms), the snap, then the rest.
        for (let n = start; n < start + writes.length; n++) {
            await a.wait(n === start ? 80 : 880);
            // the writer's line carries the write, then the key lands on top of the list
            await a.set({ lit: keyAt(writes, n).by });
            await a.wait(520);
            await a.set({ n: n + 1 });
        }
        await a.wait(800);
        await a.snap({ n: start });
    };
}

export function Redis() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const writes = compact ? COMPACT_WRITES : WRITES;
    // one script and start per layout: a new one restarts the stage
    const script = useMemo(() => cacheScript(writes), [writes]);
    const initial = useMemo(() => cacheStart(writes), [writes]);
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
                        initial={initial}
                        play="loop"
                        script={script}
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
                                    {/* the next write waits closed on top; the rest are open, newest first */}
                                    {Array.from({ length: DEPTH + 1 }, (_, i) => s.n - i).map((k) => {
                                        const key = keyAt(writes, k);
                                        return (
                                            <Collapse key={k} open={k < s.n} reveal="drop">
                                                <KeyRow id={key.id} by={key.by} fresh={k === s.n - 1} compact={compact} />
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

// kira keeps running /ping, a conveyor of two replies that never rewinds in
// view. A lap is six seconds on a clock t: Pong! at t = 5 starts a 5s user
// cooldown, so it runs out at t = 4 of the next lap; the /ping at t = 1 is
// denied with 3 seconds left, and the one at t = 5 gets Pong! again. Replies
// land at the foot as Discord's do and the oldest leave over the top.
//
// Each denial's timestamp is Discord's relative one, read against the clock:
// "in 3 seconds" counting down, then "1 second ago", "2 seconds ago" as it
// rises out of view. The snap at the end of a lap moves the clock and every
// reply back by one lap together, so each label reads the same across it.
//
// "Pong!" is the reply of the ping command in the cooldown guide.
type Reply = "pong" | "denied";
const REPLIES: Reply[] = ["denied", "pong"];
const LAP = 6;
// Within the lap a denial arrives in: when it comes, and when its cooldown ends
const DENIED_AT = 1;
const EXPIRES_AT = 4;
const PONG_AT = 5;

// n counts the replies so far (the newest is n - 1); t is the lap's clock
type Chat = { n: number; t: number };
const CHAT_START = REPLIES.length * 2;
const chatStart: Chat = { n: CHAT_START, t: 0 };
// The still: the newest reply is the denial, as it arrives
const chatPoster: Chat = { n: CHAT_START + 1, t: DENIED_AT };
const replyAt = (k: number) => REPLIES[k % REPLIES.length];
// Replies kept mounted above the newest: more than the panel shows
const CHAT_DEPTH = 3;

// Seconds from the clock to denial k's expiry, against the lap that started
// at CHAT_START (denials are the even replies, one a lap). Not yet arrived,
// it reads as it will when it lands.
function untilExpiry(k: number, s: Chat) {
    const lap = Math.floor((k - CHAT_START) / REPLIES.length);
    const expires = EXPIRES_AT + lap * LAP;
    return k >= s.n ? expires - (DENIED_AT + lap * LAP) : expires - s.t;
}

const cooldown = async (a: Act<Chat>) => {
    // one tick a second, the seam included: the snap is the sixth
    for (let t = 1; t < LAP; t++) {
        await a.wait(1000);
        if (t === DENIED_AT) await a.set({ n: CHAT_START + 1, t });
        else if (t === PONG_AT) await a.set({ n: CHAT_START + 2, t });
        else await a.set({ t });
    }
    await a.wait(1000);
    await a.snap({ n: CHAT_START, t: 0 });
};

const seconds = (n: number) => `${n} ${n === 1 ? "second" : "seconds"}`;

// Discord's relative timestamp, ahead or behind. At the second it runs out
// it still reads "in 1 second", as Discord's updates trail the clock.
function Relative({ until }: { until: number }) {
    const ahead = until >= 0;
    return (
        <span className="sb-dc__time">
            {ahead && "in "}
            <Count value={ahead ? Math.max(until, 1) : -until} format={seconds} duration={420} />
            {!ahead && " ago"}
        </span>
    );
}

function ReplyBody({ reply, until }: { reply: Reply; until: number }) {
    if (reply === "pong") return <p className="sb-dc__text">Pong!</p>;
    return (
        <p className="sb-dc__text">
            This command is cooling down. Try again <Relative until={until} />.
        </p>
    );
}

export function Cooldown() {
    const [ref, width, ready] = usePictureWidth(330);
    return (
        <Tile
            area="cool"
            pkg={["@slipher/cooldown"]}
            title="Cooldowns from a decorator."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Chat> width={width} height={214} theme="dark" initial={chatStart} poster={chatPoster} play="loop" script={cooldown} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-dc">
                                <div className="sb-dc__feed">
                                    {/* oldest first, pinned to the foot as Discord pins it; the next reply waits closed below */}
                                    {Array.from({ length: CHAT_DEPTH + 1 }, (_, i) => s.n - CHAT_DEPTH + i).map((k) => (
                                        <Collapse key={k} open={k < s.n} reveal="drop" from="below" className="sb-dc__turn">
                                            <div className="sb-dc__group">
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
                                                        <ReplyBody reply={replyAt(k)} until={untilExpiry(k, s)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </Collapse>
                                    ))}
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

export function Lint({ code }: { code: CodeLines }) {
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

/* ---------------- Editor + terminal (testing, watcher) ---------------- */

// A code line with the slot's text set in place, in the slot token's color.
// The text is keyed by `slot`, so a new string arrives (and the same one
// across a lap's seam doesn't).
export function SlotRow({ line, text, slot }: { line: CodeLines[number]; text: string; slot: number }) {
    if (line.length === 0) return <> </>;
    return (
        <>
            {line.map((t, i) => {
                const at = t.c.indexOf(SLOT);
                if (at < 0) return <span key={i} style={{ color: t.k }}>{t.c}</span>;
                return (
                    <span key={i} style={{ color: t.k }}>
                        {t.c.slice(0, at)}
                        <span key={slot} className="sb-slot">
                            {text}
                        </span>
                        {t.c.slice(at + SLOT.length)}
                    </span>
                );
            })}
        </>
    );
}

// The editor pane over its integrated terminal, bleeding off the tile's
// right and bottom like the ESLint editor
export function Ide({ file, dirty, code, from, to, text, slot, children }: { file: string; dirty?: boolean; code: CodeLines; from: number; to: number; text: string; slot: number; children: ReactNode }) {
    return (
        <div className="sb-ide">
            <div className="sb-ide__tab">
                {file}
                <span className="sb-ide__dirty" data-on={dirty || undefined} />
            </div>
            <div className="sb-ide__code">
                {code.slice(from, to).map((line, i) => (
                    <div key={from + i} className="sb-editor__line">
                        <span className="sb-editor__no">{from + i + 1}</span>
                        <span className="sb-editor__code">
                            <SlotRow line={line} text={text} slot={slot} />
                        </span>
                    </div>
                ))}
            </div>
            <div className="sb-ide__term">{children}</div>
        </div>
    );
}

/* ---------------- Testing ---------------- */

// The echo test reruns on one message after another: the file's row goes
// back to queued, then passes, its test listed under it. The rows are
// TestingRun's (Vitest 5.0.5's default reporter, that run's durations). The
// first message is the docs' own; a lap is the three, then a snap back to
// the same picture.
const MESSAGES = ["hello from the core", "no token needed", "no gateway either"];
type Run = { n: number; passed: boolean };
const RUN_START = MESSAGES.length;
const runStart: Run = { n: RUN_START, passed: true };

const testing = async (a: Act<Run>) => {
    // 1.8s on each pass, split across the seam
    await a.wait(900);
    for (let n = RUN_START + 1; n <= RUN_START + MESSAGES.length; n++) {
        await a.set({ n, passed: false });
        await a.wait(700);
        await a.set({ passed: true });
        await a.wait(n === RUN_START + MESSAGES.length ? 900 : 1800);
    }
    await a.snap({ n: RUN_START });
};

export function Testing({ code }: { code: CodeLines }) {
    const [ref, width, ready] = usePictureWidth(330);
    return (
        <Tile
            area="test"
            pkg={["@slipher/testing"]}
            title="Commands under test."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Run> width={width} height={236} theme="dark" initial={runStart} play="loop" script={testing} className="sy sb-stage">
                        {(s) => (
                            <Ide file="test/echo.test.ts" code={code} from={8} to={14} text={MESSAGES[s.n % MESSAGES.length]} slot={s.n % MESSAGES.length}>
                                <div className="sb-term__row">
                                    {s.passed ? <span className="sb-ok">✓</span> : <span className="sb-dim">❯</span>} test/echo.test.ts{" "}
                                    {s.passed ? (
                                        <>
                                            <span className="sb-dim">(1 test)</span> 7ms
                                        </>
                                    ) : (
                                        <span className="sb-dim">[queued]</span>
                                    )}
                                </div>
                                <div className="sb-term__row sb-term__row--sub" data-on={s.passed || undefined}>
                                    {"  "}
                                    <span className="sb-ok">✓</span> echo repeats the message <span className="sb-dim">6ms</span>
                                </div>
                            </Ide>
                        )}
                    </Stage>
                </div>
            }
        >
            A mock bot runs the real command in-process, no token or gateway.
        </Tile>
    );
}

/* ---------------- Watcher ---------------- */

// The ping reply edited back and forth, saved each time: Chokidar reports the
// change, the watcher rebuilds and swaps the worker in, the gateway stays up.
// The log lines are @slipher/watcher's (its Logger named "[Watcher]", debug
// then info) without the RAM and clock prefix Seyfert's Logger puts first,
// which would differ on every line and break the lap's seam.
const REPLY_EDITS = ["Pong!", "Pong! 🏓"];
// Saves so far, whether the newest has built, and an edit not yet saved
type Saves = { n: number; built: boolean; dirty: boolean };
const SAVE_START = 4;
const saveStart: Saves = { n: SAVE_START, built: true, dirty: false };
// Saves kept mounted above the newest: more than the terminal shows
const SAVE_DEPTH = 3;

const watching = async (a: Act<Saves>) => {
    for (let n = SAVE_START + 1; n <= SAVE_START + REPLY_EDITS.length; n++) {
        await a.wait(n === SAVE_START + 1 ? 700 : 1400);
        // the edit, then the save a beat later
        await a.set({ dirty: true });
        await a.wait(700);
        await a.set({ n, built: false, dirty: false });
        await a.wait(600);
        await a.set({ built: true });
    }
    await a.wait(700);
    await a.snap({ n: SAVE_START });
};

export function Watch({ code }: { code: CodeLines }) {
    const [ref, width, ready] = usePictureWidth(330);
    return (
        <Tile
            area="watch"
            pkg={["@slipher/watcher"]}
            title="Save, and it's live."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Saves> width={width} height={236} theme="dark" initial={saveStart} play="loop" script={watching} className="sy sb-stage">
                        {(s) => {
                            // an unsaved edit shows the next reply already
                            const edit = (s.n + (s.dirty ? 1 : 0)) % REPLY_EDITS.length;
                            return (
                                <Ide file="src/commands/ping.ts" dirty={s.dirty} code={code} from={4} to={7} text={REPLY_EDITS[edit]} slot={edit}>
                                    <div className="sb-term__feed">
                                        {Array.from({ length: SAVE_DEPTH + 1 }, (_, i) => s.n - SAVE_DEPTH + i).map((k) => (
                                            <Collapse key={k} open={k < s.n} className="sb-term__save">
                                                <div className="sb-term__row">
                                                    <span className="sb-debug">DEBUG</span>{" [Watcher] > change event detected, building"}
                                                </div>
                                                <Collapse open={k < s.n - 1 || s.built}>
                                                    <div className="sb-term__row">
                                                        <span className="sb-info">INFO</span>{" [Watcher] > Builded"}
                                                    </div>
                                                </Collapse>
                                            </Collapse>
                                        ))}
                                    </div>
                                </Ide>
                            );
                        }}
                    </Stage>
                </div>
            }
        >
            The watcher keeps the gateway connected while it rebuilds and restarts the bot.
        </Tile>
    );
}

/* ---------------- HTTP adapters ---------------- */

// `wideHeight`: a taller cell (the docs' adapters frame, sized for Redis)
// gives the wide diagram more room, its nodes kept centered in it
export function Http({ wideHeight = 186 }: { wideHeight?: number }) {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 250 : wideHeight;
    // the request's row, a little above the middle as the stage bleeds below
    const row = wideHeight / 2 - 11;
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
                  req: { x: left + 78, y: row },
                  uws: { x: left + 324, y: row - 42 },
                  gen: { x: left + 324, y: row + 42 },
                  http: { x: left + 556, y: row },
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
                                    <div
                                        key={r}
                                        className="sb-row"
                                        style={{ ["--off" as string]: `${[-60, 40][r]}px`, ["--way" as string]: r % 2 ? "reverse" : "normal", ["--lap" as string]: `${row.length * 6}s` }}
                                    >
                                        {/* four copies: the track is wider than the band for a full lap either way */}
                                        <div className="sb-track">
                                            {Array.from({ length: 4 }, (_, c) =>
                                                row.map((name) => (
                                                    <span key={`${c}-${name}`} className="sb-chip" aria-hidden={c > 0 || undefined}>
                                                        <span className="sb-chip__scope">@slipher/</span>
                                                        {name}
                                                    </span>
                                                )),
                                            )}
                                        </div>
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

// The same tiles split by the official packages page's sections: each section
// opens with its own stack of tiles, one per row, instead of the whole grid.
export function SlipherSection({ children }: { children: ReactNode }) {
    return (
        <div className="sb">
            <div className="sb-grid sb-grid--section">{children}</div>
        </div>
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
