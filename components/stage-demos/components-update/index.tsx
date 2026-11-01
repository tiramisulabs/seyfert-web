"use client";

import { Hash, Inbox, Plus, Smile, Users, Volume2 } from "lucide-react";
import { Avatar, Bar, Count, Follow, Stage, States, Text, Window, type Act } from "@/components/stageshow/kit";
import { CodeRow, type CodeLines } from "../code";
import "@/components/stageshow/seyfert.css";
import "./components-update.css";

// A button on a bot's message, handled in place. The visitor presses +1:
// Discord's press and its loading dots on the button, then the same message
// edits itself, only the changed digit rolling. Beside it the ComponentCommand
// that answered: its customId check lights as the click is routed to it, then
// the ctx.update line as the message changes. No new message ever lands.
//
// Real strings: the channel, the bot, the count, the button, the handler.
// Icons: Discord's own set isn't available; Lucide at one stroke stands in.

type Line = "route" | "update";

type S = {
    count: number;
    /** Discord's loading dots on the button while the interaction is answered */
    pending: boolean;
    lit: Line | null;
};

const initial: S = { count: 41, pending: false, lit: null };
const poster: S = { count: 42, pending: false, lit: "update" };

const REST = { wide: { x: 860, y: 250 }, compact: { x: 300, y: 150 } };
// the docs design is narrower: the pointer rests to the right of the button
const REST_DOCS = { wide: { x: 400, y: 170 }, compact: REST.compact };

async function script(a: Act<S>) {
    await a.wait(1200);

    // To the button: Discord darkens it under the pointer
    await a.move({ at: "plus", x: 0.82, y: 0.68 });
    await a.wait(320);

    // Press. The click reaches the bot and is routed by its customId
    a.mark("route");
    await a.click();
    await a.set({ pending: true, lit: "route" });
    await a.wait(1100);

    // ctx.update: the message edits itself, the button comes back
    a.mark("update");
    await a.set({ pending: false, count: 42, lit: "update" });
    await a.wait(900);
    // rest off the result, on empty channel to the button's right
    await a.move(a.layout === "compact" ? REST.compact : { at: "plus", x: 3.4, y: 0.4 }, { duration: 900 });
    await a.wait(3200);
    a.mark("done");
}

function Rail() {
    return (
        <nav className="cu-rail">
            <span className="cu-rail__home">
                <Bar w={22} h={22} r={7} tone={3} />
            </span>
            <span className="cu-rail__sep" />
            {[0, 1, 2, 3].map((i) => (
                <span key={i} className="cu-rail__guild" data-active={i === 1 || undefined}>
                    <span className="cu-rail__pill" />
                    <span className="cu-rail__disc" data-tone={i} />
                </span>
            ))}
            <span className="cu-rail__add">
                <Plus size={18} strokeWidth={1.75} aria-hidden />
            </span>
        </nav>
    );
}

function Channels() {
    return (
        <aside className="cu-side">
            <div className="cu-side__head">
                <Bar w={84} h={8} tone={4} />
            </div>
            <div className="cu-side__list">
                <div className="cu-side__group">
                    <Bar w={64} h={5} tone={2} />
                </div>
                <div className="cu-side__row">
                    <Hash size={16} strokeWidth={1.75} aria-hidden />
                    <Bar w={58} h={7} tone={3} />
                </div>
                <div className="cu-side__row" data-active>
                    <Hash size={16} strokeWidth={1.75} aria-hidden />
                    <Text className="cu-side__name">general</Text>
                </div>
                {[72, 46].map((w, i) => (
                    <div key={i} className="cu-side__row">
                        <Hash size={16} strokeWidth={1.75} aria-hidden />
                        <Bar w={w} h={7} tone={3} />
                    </div>
                ))}
                <div className="cu-side__group">
                    <Bar w={52} h={5} tone={2} />
                </div>
                {[54, 66].map((w, i) => (
                    <div key={i} className="cu-side__row">
                        <Volume2 size={16} strokeWidth={1.75} aria-hidden />
                        <Bar w={w} h={7} tone={3} />
                    </div>
                ))}
            </div>
        </aside>
    );
}

function Members() {
    return (
        <aside className="cu-members">
            <Bar w={60} h={5} tone={2} />
            {[64, 52, 70, 44, 58].map((w, i) => (
                <div key={i} className="cu-members__row">
                    <Avatar plain size={32} />
                    <Bar w={w} h={7} tone={3} />
                </div>
            ))}
        </aside>
    );
}

function Older({ name, lines }: { name: number; lines: number[] }) {
    return (
        <div className="cu-msg">
            <Avatar plain size={40} />
            <div className="cu-msg__body">
                <div className="cu-msg__meta">
                    <Bar w={name} h={8} tone={4} />
                    <Bar w={44} h={5} tone={2} />
                </div>
                {lines.map((w, i) => (
                    <div key={i} className="cu-msg__bar">
                        <Bar w={w} h={7} tone={3} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function BotFace({ size }: { size: number }) {
    return (
        <span className="cu-bot" style={{ width: size, height: size }}>
            <img src="/logo.svg" alt="" />
        </span>
    );
}

// The bot's message: its content is the count, and the button under it.
// Only the digit that changes rolls; the message never moves.
function Counter({ s }: { s: S }) {
    return (
        <div className="cu-msg cu-msg--bot">
            <BotFace size={40} />
            <div className="cu-msg__body">
                <div className="cu-msg__meta">
                    <span className="cu-msg__name">Echo</span>
                    <span className="cu-app">APP</span>
                    <span className="cu-msg__time">Today at 21:06</span>
                </div>
                {/* 41 clicks in, Discord already marks the message as edited:
                    an UPDATE_MESSAGE response edits it, like any other edit */}
                <p className="cu-msg__text">
                    <Count value={s.count} duration={520} /> clicks <span className="cu-edited">(edited)</span>
                </p>
                <div className="cu-actions">
                    <span className="cu-button" data-target="plus" data-pending={s.pending || undefined}>
                        <States
                            value={s.pending ? "pending" : "label"}
                            states={{
                                label: <span className="cu-button__label">+1</span>,
                                pending: (
                                    <span className="cu-dots" aria-label="Loading">
                                        <i />
                                        <i />
                                        <i />
                                    </span>
                                ),
                            }}
                        />
                    </span>
                </div>
            </div>
        </div>
    );
}

function Composer() {
    return (
        <div className="cu-compose">
            <span className="cu-compose__plus">
                <Plus size={16} strokeWidth={2.25} aria-hidden />
            </span>
            <span className="cu-compose__placeholder">Message #general</span>
            <span className="cu-compose__tools">
                <Smile size={20} strokeWidth={1.75} aria-hidden />
            </span>
        </div>
    );
}

function Channel({ s, compact }: { s: S; compact: boolean }) {
    return (
        <section className="cu-channel">
            <header className="cu-channel__head">
                <Hash size={20} strokeWidth={1.75} aria-hidden />
                <Text className="cu-channel__title">general</Text>
                {!compact && (
                    <span className="cu-channel__topic">
                        <Bar w={120} h={6} tone={2} />
                    </span>
                )}
                <span className="cu-grow" />
                <Users size={18} strokeWidth={1.75} aria-hidden />
            </header>
            <div className="cu-feed">
                {!compact && <Older name={46} lines={[160]} />}
                <Older name={54} lines={[236, 148]} />
                <Older name={70} lines={[190]} />
                <Counter s={s} />
            </div>
            {/* Narrow, the handler covers the window's foot: no composer under it */}
            {!compact && (
                <div className="cu-channel__foot">
                    <Composer />
                </div>
            )}
        </section>
    );
}

// The handler, its two lines tied to what Discord does
function Source({ lines, rect, lit, from }: { lines: CodeLines; rect: (name: string) => ReturnType<Act<S>["rect"]>; lit: Line | null; from: number }) {
    // Each tag names its lines: the customId check, and the whole ctx.update call
    const text = lines.map((l) => l.map((t) => t.c).join(""));
    const routeAt = text.findIndex((t) => t.includes("ctx.customId"));
    const updateAt = text.findIndex((t) => t.includes("ctx.update"));
    const updateEnd = text.findIndex((t, i) => i >= updateAt && t.includes("});"));
    const span: Record<Line, [number, number]> = { route: [routeAt, routeAt], update: [updateAt, updateEnd] };
    const target = (i: number) => {
        for (const k of Object.keys(span) as Line[]) {
            if (i === span[k][0]) return `code-${k}`;
            if (i === span[k][1]) return `code-${k}-end`;
        }
        return undefined;
    };
    // the band is drawn inside the code box, behind its lines
    const first = lit ? rect(`code-${lit}`) : null;
    const last = lit && span[lit][1] !== span[lit][0] ? rect(`code-${lit}-end`) : first;
    const box = rect("src-code");
    const band = first && last ? { x: first.x - box.x - 8, y: first.y - box.y, width: Math.max(first.width, last.width) + 16, height: last.y + last.height - first.y } : null;
    return (
        <div className="cu-src">
            <div className="cu-src__tab">
                <span className="cu-src__file">src/components/count.ts</span>
            </div>
            <div className="cu-src__code" data-target="src-code">
                <Follow to={band} className="cu-src__band" />
                {lines.map((line, i) => {
                    if (i < from) return null;
                    return (
                        <div key={i} className="cu-src__line" data-target={target(i)}>
                            <CodeRow line={line} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// `compactBelow`: the container width under which the compact design takes
// over (a docs column wants the wide design longer than a page section).
// `still`: the poster only, no script, for the Reveal's still cut.
// `variant="docs"`: a 640-wide design for the guides' column, the channel over
// its handler, instead of the page's 960 window with the handler beside it.
export default function ComponentsUpdate({ code, compactBelow = 720, still = false, variant = "page" }: { code: CodeLines; compactBelow?: number; still?: boolean; variant?: "page" | "docs" }) {
    const docs = variant === "docs";
    // Narrow, the card starts at filter(): the class line would only run off the edge
    const filterAt = Math.max(
        0,
        code.findIndex((l) => l.map((t) => t.c).join("").includes("filter(")),
    );
    return (
        <Stage
            width={docs ? 640 : 960}
            height={docs ? 560 : 480}
            fill={docs}
            compact={{ below: compactBelow, width: 358, height: 512 }}
            initial={initial}
            poster={poster}
            script={still ? undefined : script}
            play="once"
            theme="dark"
            cursor={still ? undefined : { at: docs ? REST_DOCS : REST }}
            className={docs ? "sy cu cu-docs" : "sy cu"}
        >
            {(s, rect, layout) => {
                // the docs design and the phone share a composition: the channel on its own, the handler under it
                const narrow = layout === "compact" || docs;
                return (
                    <>
                        <Window className="cu-win" toolbar={<Inbox size={16} strokeWidth={1.75} aria-hidden className="cu-top__icon" />}>
                            <div className="cu-body">
                                {!narrow && <Rail />}
                                {!narrow && <Channels />}
                                <Channel s={s} compact={narrow} />
                                {!narrow && <Members />}
                            </div>
                        </Window>
                        <Source lines={code} rect={rect} lit={s.lit} from={narrow ? filterAt : 0} />
                    </>
                );
            }}
        </Stage>
    );
}
