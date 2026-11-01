"use client";

import { Hash, Inbox, Plus, Smile, Users, Volume2 } from "lucide-react";
import { Avatar, Bar, Collapse, Follow, Popover, Stage, Text, Window, type Act } from "@/components/stageshow/kit";
import { CodeRow, type CodeLines } from "../code";
import "@/components/stageshow/seyfert.css";
import "./discord.css";

// The echo command from the home, used in Discord. The visitor types /ec,
// picks the command Seyfert registered, fills its one option and gets the
// reply. Beside it the file the command came from: each Discord string lights
// the line it was declared on, so nothing on the Discord side is invented.
//
// Icons: Discord's own set isn't available; Lucide at one stroke stands in.

type Line = "declare" | "option" | "run";

type S = {
    focus: boolean;
    typing: boolean;
    draft: string;
    picked: boolean;
    /** the composer's contents fade before it clears */
    clearing: boolean;
    sent: boolean;
    lit: Line | null;
};

const initial: S = { focus: false, typing: false, draft: "", picked: false, clearing: false, sent: false, lit: null };
const poster: S = { ...initial, sent: true, lit: "run" };

const NAME = "echo";
const DESCRIPTION = "Repeat after me";
const OPTION = "message";
const OPTION_HINT = "What should I echo back?";
const SAID = "hello from the core";

const REST = { wide: { x: 830, y: 300 }, compact: { x: 300, y: 330 } };

async function script(a: Act<S>) {
    await a.wait(1100);

    // Into the composer, start a slash command
    await a.move({ at: "composer", x: 0.42, y: 0.5 });
    await a.click();
    await a.set({ focus: true });
    await a.wait(260);
    await a.set({ typing: true });
    await a.type("draft", "/ec", { interval: 110 });
    await a.set({ typing: false, lit: "declare" });
    a.mark("menu");
    await a.wait(1300);

    // Pick it from the list: the option takes its place in the composer
    await a.move({ at: "cmd-echo", x: 0.86, y: 0.6 });
    await a.wait(180);
    await a.click();
    // the list closes as the command lands in the composer; its option's hint follows
    await a.set({ clearing: true });
    await a.wait(120);
    await a.set({ picked: true, draft: "", clearing: false, lit: "option" });
    a.mark("option");
    await a.wait(900);
    await a.set({ typing: true });
    await a.type("draft", SAID, { interval: 48 });
    await a.set({ typing: false });
    await a.wait(420);

    // Send: the reply lands and run() lights
    a.mark("send");
    await a.key("enter");
    await a.set({ clearing: true, focus: false });
    await a.wait(140);
    await a.set({ picked: false, draft: "", clearing: false, sent: true, lit: "run" });
    await a.wait(300);
    await a.move(a.layout === "compact" ? REST.compact : REST.wide, { duration: 900 });
    await a.wait(2600);
    a.mark("done");
}

function Rail() {
    return (
        <nav className="de-rail">
            <span className="de-rail__home">
                <Bar w={22} h={22} r={7} tone={3} />
            </span>
            <span className="de-rail__sep" />
            {[0, 1, 2, 3].map((i) => (
                <span key={i} className="de-rail__guild" data-active={i === 1 || undefined}>
                    <span className="de-rail__pill" />
                    <span className="de-rail__disc" data-tone={i} />
                </span>
            ))}
            <span className="de-rail__add">
                <Plus size={18} strokeWidth={1.75} aria-hidden />
            </span>
        </nav>
    );
}

function Channels() {
    return (
        <aside className="de-side">
            <div className="de-side__head">
                <Bar w={84} h={8} tone={4} />
            </div>
            <div className="de-side__list">
                <div className="de-side__group">
                    <Bar w={64} h={5} tone={2} />
                </div>
                <div className="de-side__row">
                    <Hash size={16} strokeWidth={1.75} aria-hidden />
                    <Bar w={58} h={7} tone={3} />
                </div>
                <div className="de-side__row" data-active>
                    <Hash size={16} strokeWidth={1.75} aria-hidden />
                    <Text className="de-side__name">general</Text>
                </div>
                {[72, 46].map((w, i) => (
                    <div key={i} className="de-side__row">
                        <Hash size={16} strokeWidth={1.75} aria-hidden />
                        <Bar w={w} h={7} tone={3} />
                    </div>
                ))}
                <div className="de-side__group">
                    <Bar w={52} h={5} tone={2} />
                </div>
                {[54, 66].map((w, i) => (
                    <div key={i} className="de-side__row">
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
        <aside className="de-members">
            <Bar w={60} h={5} tone={2} />
            {[64, 52, 70, 44, 58].map((w, i) => (
                <div key={i} className="de-members__row">
                    <Avatar plain size={32} />
                    <Bar w={w} h={7} tone={3} />
                </div>
            ))}
        </aside>
    );
}

function Older({ name, lines }: { name: number; lines: number[] }) {
    return (
        <div className="de-msg">
            <Avatar plain size={40} />
            <div className="de-msg__body">
                <div className="de-msg__meta">
                    <Bar w={name} h={8} tone={4} />
                    <Bar w={44} h={5} tone={2} />
                </div>
                {lines.map((w, i) => (
                    <div key={i} className="de-msg__bar">
                        <Bar w={w} h={7} tone={3} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function BotFace({ size }: { size: number }) {
    return (
        <span className="de-bot" style={{ width: size, height: size }}>
            <img src="/logo.svg" alt="" />
        </span>
    );
}

function Reply() {
    return (
        <div className="de-msg de-msg--reply">
            <div className="de-used">
                <span className="de-used__spine" />
                <Avatar name="kira" size={16} />
                <span className="de-used__who">kira</span>
                <span className="de-used__verb">used</span>
                <span className="de-used__cmd">/{NAME}</span>
            </div>
            <div className="de-msg__row">
                <BotFace size={40} />
                <div className="de-msg__body">
                    <div className="de-msg__meta">
                        <span className="de-msg__name de-msg__name--bot">Echo</span>
                        <span className="de-app">APP</span>
                        <span className="de-msg__time">Today at 21:04</span>
                    </div>
                    <p className="de-msg__text">{SAID}</p>
                </div>
            </div>
        </div>
    );
}

function Composer({ s }: { s: S }) {
    const empty = !s.picked && s.draft.length === 0;
    return (
        <div className="de-compose" data-target="composer" data-cursor="ibeam" data-focus={s.focus || undefined}>
            <span className="de-compose__plus">
                <Plus size={16} strokeWidth={2.25} aria-hidden />
            </span>
            <div className="de-compose__text" data-clearing={s.clearing || undefined}>
                {s.picked && (
                    <>
                        <span className="de-compose__cmd">/{NAME}</span>
                        <span className="de-compose__opt">{OPTION}</span>
                    </>
                )}
                <span className="de-compose__draft">{s.draft}</span>
                <span className="de-caret" data-show={s.focus || undefined} data-typing={s.typing || undefined} />
                <span className="de-compose__placeholder" data-hide={!empty || undefined}>
                    Message #general
                </span>
            </div>
            <span className="de-compose__tools">
                <Smile size={20} strokeWidth={1.75} aria-hidden />
            </span>
        </div>
    );
}

// What Discord shows above the composer: the matching commands while the
// draft is a slash, then the option's own description once one is picked.
function Suggest({ s }: { s: S }) {
    const listing = s.draft.startsWith("/") && !s.picked && !s.clearing;
    return (
        <>
            <Popover show={listing} origin="bottom left" className="de-pop">
                <div className="de-pop__head">
                    <BotFace size={16} />
                    <span>Echo</span>
                </div>
                <div className="de-pop__row" data-target="cmd-echo" data-active>
                    <span className="de-pop__name">/{NAME}</span>
                    <span className="de-pop__param">{OPTION}</span>
                    <span className="de-pop__desc">{DESCRIPTION}</span>
                </div>
            </Popover>
            <Popover show={s.picked && !s.clearing} origin="bottom left" className="de-pop de-pop--hint">
                <div className="de-pop__hint">
                    <span className="de-pop__param de-pop__param--on">{OPTION}</span>
                    <span className="de-pop__desc">{OPTION_HINT}</span>
                </div>
            </Popover>
        </>
    );
}

function Channel({ s }: { s: S }) {
    return (
        <section className="de-channel">
            <header className="de-channel__head">
                <Hash size={20} strokeWidth={1.75} aria-hidden />
                <Text className="de-channel__title">general</Text>
                <span className="de-channel__topic">
                    <Bar w={120} h={6} tone={2} />
                </span>
                <span className="de-grow" />
                <Users size={18} strokeWidth={1.75} aria-hidden />
            </header>
            <div className="de-feed">
                <Older name={46} lines={[160]} />
                <Older name={54} lines={[236, 148]} />
                <Older name={70} lines={[190]} />
                <div className="de-msg">
                    <Avatar name="Nova" size={40} />
                    <div className="de-msg__body">
                        <div className="de-msg__meta">
                            <span className="de-msg__name" data-who="nova">Nova</span>
                            <span className="de-msg__time">Today at 21:03</span>
                        </div>
                        <p className="de-msg__text">does the bot do anything yet?</p>
                    </div>
                </div>
                <Collapse open={s.sent} reveal="drop" from="below">
                    <Reply />
                </Collapse>
            </div>
            <div className="de-channel__foot">
                <Suggest s={s} />
                <Composer s={s} />
            </div>
        </section>
    );
}

// The file the command came from, three of its lines tied to what Discord shows
function Source({ lines, rect, lit }: { lines: CodeLines; rect: (name: string) => ReturnType<Act<S>["rect"]>; lit: Line | null }) {
    const tag = (i: number): Line | undefined => {
        const text = lines[i].map((t) => t.c).join("");
        if (text.includes("@Declare")) return "declare";
        if (text.includes("description: 'What")) return "option";
        if (text.includes("ctx.write")) return "run";
        return undefined;
    };
    // the band is drawn inside the code box, behind its lines
    const line = lit ? rect(`code-${lit}`) : null;
    const box = rect("src-code");
    const band = line ? { x: line.x - box.x - 8, y: line.y - box.y, width: line.width + 16, height: line.height } : null;
    return (
        <div className="de-src">
            <div className="de-src__tab">
                <span className="de-src__file">src/commands/echo.ts</span>
            </div>
            <div className="de-src__code" data-target="src-code">
                <Follow to={band} className="de-src__band" />
                {lines.map((line, i) => {
                    const t = tag(i);
                    return (
                        <div key={i} className="de-src__line" data-target={t ? `code-${t}` : undefined} data-lit={(t && t === lit) || undefined}>
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
// `fill`: grow past the design size to the section's width (the home).
export default function DiscordEcho({ code, compactBelow = 720, still = false, fill = false }: { code: CodeLines; compactBelow?: number; still?: boolean; fill?: boolean }) {
    return (
        <Stage
            width={960}
            height={480}
            compact={{ below: compactBelow, width: 358, height: 460 }}
            initial={initial}
            poster={poster}
            script={still ? undefined : script}
            play="once"
            fill={fill}
            theme="dark"
            cursor={still ? undefined : { at: REST }}
            keys={{ wide: "bottom-right", compact: "top" }}
            className="sy de"
        >
            {(s, rect, layout) => (
                <>
                    <Window className="de-win" toolbar={<Inbox size={16} strokeWidth={1.75} aria-hidden className="de-top__icon" />}>
                        <div className="de-body">
                            {layout === "wide" && <Rail />}
                            {layout === "wide" && <Channels />}
                            <Channel s={s} />
                            {layout === "wide" && <Members />}
                        </div>
                    </Window>
                    {layout === "wide" && <Source lines={code} rect={rect} lit={s.lit} />}
                </>
            )}
        </Stage>
    );
}
