"use client";

import { Fragment, type ReactNode } from "react";
import { Blocks, Files, GitBranch, Search } from "lucide-react";
import { Stage, Swap, Window, type Act, type Layout, type Rect } from "@/components/stageshow/kit";
import type { CodeLines } from "../code";
import "@/components/stageshow/seyfert.css";
import "./types.css";

// A close-up of the editor: the echo command's file, the whole window at
// 1.4x. The pointer rests on ctx.options.message and the editor's own hover
// says `message: string`; it double-clicks `required: true`, types `false`,
// and back on the same property the hover now reads `string | undefined`.
// Nothing else changes: ctx.write accepts an optional content, so there is
// no error to show, and none is drawn.
//
// Real strings: the window title, the file's path and the file itself, and
// the hover. Icons: Lucide at one stroke, a generic editor, no logos.

type S = {
    hover: boolean;
    /** the option is no longer required: the hover's type grows */
    optional: boolean;
    /** the value of `required`, as typed */
    value: string;
    sel: boolean;
    caret: boolean;
    typing: boolean;
};

const initial: S = { hover: false, optional: false, value: "true", sel: false, caret: false, typing: false };
const poster: S = { hover: true, optional: true, value: "false", sel: false, caret: true, typing: false };

/** The whole window is drawn at design size and scaled; the hover is placed in the same space */
const ZOOM: Record<Layout, number> = { wide: 1.4, compact: 1 };
const REST = { wide: { x: 780, y: 520 }, compact: { x: 300, y: 384 } };

async function script(a: Act<S>) {
    await a.wait(900);

    // Rest on the property: the editor's hover names its type
    await a.move({ at: "msg", x: 0.94, y: 0.72 });
    await a.wait(360);
    await a.set({ hover: true });
    a.mark("hover");
    await a.wait(1900);

    // Up to the option: double-click selects `true`
    a.put({ hover: false });
    await a.move({ at: "flag", x: 0.58, y: 0.62 });
    await a.wait(220);
    await a.click({ at: "flag", x: 0.58, y: 0.62 }, { double: true });
    await a.set({ sel: true, caret: true });
    a.mark("select");
    await a.wait(520);

    // The first key replaces the selection; the hand leaves the word as it types
    const off = a.move({ at: "flag", x: 2.4, y: 2.2 }, { duration: 620 });
    await a.wait(140);
    await a.set({ typing: true });
    for (const typed of ["f", "fa", "fal", "fals", "false"]) {
        await a.set({ value: typed, sel: false });
        await a.wait(typed === "f" ? 120 : 85);
    }
    await a.set({ typing: false });
    await off;
    await a.wait(650);

    // Back on the property: the type it reports has grown
    a.mark("back");
    await a.move({ at: "msg", x: 0.94, y: 0.72 });
    await a.wait(360);
    await a.set({ hover: true });
    await a.wait(420);
    await a.set({ optional: true });
    a.mark("payoff");
    await a.wait(2800);
}

type Tok = CodeLines[number][number];
type Mark = { from: number; to: number; render: (color: string) => ReactNode };

const lineText = (line: Tok[]) => line.map((t) => t.c).join("");

// One line of tokens, with spans cut out at character offsets so a word can
// be a target (or be replaced) without losing the colors around it.
function Tokens({ line, marks = [] }: { line: Tok[]; marks?: Mark[] }) {
    const out: ReactNode[] = [];
    let pos = 0;
    line.forEach((t, ti) => {
        let at = 0;
        while (at < t.c.length) {
            const abs = pos + at;
            const mark = marks.find((m) => abs >= m.from && abs < m.to);
            if (mark) {
                if (abs === mark.from) out.push(<Fragment key={`m${mark.from}`}>{mark.render(t.k)}</Fragment>);
                at = Math.min(t.c.length, mark.to - pos);
                continue;
            }
            const next = marks.reduce((n, m) => (m.from > abs ? Math.min(n, m.from) : n), Infinity);
            const end = Math.min(t.c.length, next - pos);
            out.push(
                <span key={`${ti}-${at}`} style={{ color: t.k }}>
                    {t.c.slice(at, end)}
                </span>,
            );
            at = end;
        }
        pos += t.c.length;
    });
    return <>{out.length ? out : " "}</>;
}

const HOVER = { prefix: "#a0a0a0", name: "#ffffff", punct: "#a0a0a0", type: "#ffc799" };

function HoverType({ optional }: { optional: boolean }) {
    return (
        <>
            <span style={{ color: HOVER.prefix }}>(property)</span> <span style={{ color: HOVER.name }}>message</span>
            <span style={{ color: HOVER.punct }}>:</span> <span style={{ color: HOVER.type }}>string</span>
            <Swap id={optional ? "optional" : "required"} className="tc-hover__more">
                {optional ? (
                    <>
                        {" "}
                        <span style={{ color: HOVER.punct }}>|</span> <span style={{ color: HOVER.type }}>undefined</span>
                    </>
                ) : (
                    ""
                )}
            </Swap>
        </>
    );
}

// The editor's hover, under the word it describes and held inside the
// editor: shifted left as far as its longest text needs, never past the edge
function Hover({ s, rect, layout }: { s: S; rect: (name: string) => Rect; layout: Layout }) {
    const z = ZOOM[layout];
    const area = rect("code");
    const word = rect("msg");
    const ghost = rect("hover-ghost");
    const measured = area.width > 0 && word.width > 0 && ghost.width > 0;
    const left = measured ? Math.min(word.x - area.x - 9 * z, area.width - ghost.width - 10 * z) / z : 0;
    const top = measured ? (word.y + word.height - area.y) / z + 3 : 0;
    return (
        <>
            <div className="tc-hover tc-hover--ghost" data-target="hover-ghost" aria-hidden>
                <HoverType optional />
            </div>
            <div className="tc-hover" data-show={(s.hover && measured) || undefined} style={{ left, top }}>
                <HoverType optional={s.optional} />
            </div>
        </>
    );
}

function Editor({ lines, s, rect, layout }: { lines: CodeLines; s: S; rect: (name: string) => Rect; layout: Layout }) {
    const texts = lines.map(lineText);
    const flagLine = texts.findIndex((t) => /required: true/.test(t));
    const msgLine = texts.findIndex((t) => t.includes("ctx.options.message"));
    const flagAt = texts[flagLine]?.indexOf("true") ?? -1;
    const msgAt = texts[msgLine] ? texts[msgLine].lastIndexOf("message") : -1;

    const flag: Mark = {
        from: flagAt,
        to: flagAt + 4,
        render: (color) => (
            <span className="tc-flag" data-target="flag" style={{ color }}>
                <span className="tc-flag__text" data-sel={s.sel || undefined}>
                    {s.value}
                </span>
                <span className="tc-caret" data-show={(s.caret && !s.sel) || undefined} data-typing={s.typing || undefined} />
            </span>
        ),
    };
    const msg: Mark = {
        from: msgAt,
        to: msgAt + 7,
        render: (color) => (
            <span className="tc-msg" data-target="msg" style={{ color }}>
                message
            </span>
        ),
    };

    return (
        <div className="tc-editor">
            <div className="tc-tabs">
                <span className="tc-tab">src/commands/echo.ts</span>
            </div>
            <div className="tc-code" data-target="code" data-cursor="ibeam">
                {lines.map((line, i) => {
                    const indent = texts[i].match(/^ */)?.[0].length ?? 0;
                    const active = s.caret && i === flagLine;
                    return (
                        <div key={i} className="tc-row" data-active={active || undefined}>
                            <span className="tc-ln">{i + 1}</span>
                            <span className="tc-text" style={{ ["--ind" as string]: indent }}>
                                <Tokens line={line} marks={i === flagLine ? [flag] : i === msgLine ? [msg] : undefined} />
                            </span>
                        </div>
                    );
                })}
                <Hover s={s} rect={rect} layout={layout} />
            </div>
        </div>
    );
}

function ActivityBar() {
    const icons = [Files, Search, GitBranch, Blocks];
    return (
        <nav className="tc-activity" aria-hidden>
            {icons.map((Icon, i) => (
                <span key={i} className="tc-activity__item" data-active={i === 0 || undefined}>
                    <Icon size={18} strokeWidth={1.5} />
                </span>
            ))}
        </nav>
    );
}

// `compactBelow`: the container width under which the compact design takes
// over (a docs column wants the wide design longer than a page section).
// `still`: the poster only, no script, for the Reveal's still cut.
export default function TypesCloseup({ code, compactBelow = 640, still = false }: { code: CodeLines; compactBelow?: number; still?: boolean }) {
    return (
        <Stage
            width={880}
            height={560}
            compact={{ below: compactBelow, width: 358, height: 408 }}
            initial={initial}
            poster={poster}
            script={still ? undefined : script}
            play="once"
            theme="dark"
            cursor={still ? undefined : { at: REST, style: "large" }}
            className="sy tc"
        >
            {(s, rect, layout) => (
                <div className="tc-zoom" style={{ transform: `scale(${ZOOM[layout]})` }}>
                    {layout === "wide" ? (
                        <Window title="echo-bot" className="tc-win">
                            <div className="tc-body">
                                <ActivityBar />
                                <Editor lines={code} s={s} rect={rect} layout={layout} />
                            </div>
                        </Window>
                    ) : (
                        // In a phone column the file is the site's own code card,
                        // wrapping its long lines, rather than a desktop window
                        // squeezed to a portrait
                        <div className="tc-card">
                            <Editor lines={code} s={s} rect={rect} layout={layout} />
                        </div>
                    )}
                </div>
            )}
        </Stage>
    );
}
