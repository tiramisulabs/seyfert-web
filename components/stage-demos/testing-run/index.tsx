"use client";

import { Caret, Prompt, Stage, Window, type Act } from "@/components/stageshow/kit";
import { CodeRow, type CodeLines } from "../code";
import { TEST_FILE } from "./source";
import "@/components/stageshow/seyfert.css";
import "./testing.css";

// The echo command's test, and the terminal that runs it. The test file is
// on screen from the first frame; the command is typed, Vitest queues the
// file, the file and its test pass and the summary lands under them. No
// token, no gateway: the mock bot runs the real command in-process, which is
// the whole point.
//
// The report is Vitest 5.0.5's default reporter as a person's terminal shows
// it, captured from a TTY run of this exact test against seyfert 5.2.1 and
// @slipher/testing 1.0.0 (outside an agent: Vitest switches to its minimal
// reporter when it detects one, which drops the file and test lines). While
// it runs, the file's row reads "❯ … [queued]"; when it settles the same row
// becomes the passed file. The durations are that run's. Like a real
// terminal of this width, long lines wrap at the column.
//
// Wide, the terminal is a satellite straddling the editor's right edge, over
// the margin the code never reaches; in a phone column the two stack at one
// width, 12px apart, the terminal off the bottom.

type S = {
    cmd: string;
    typing: boolean;
    /** Vitest has started: the header prints and the file is queued */
    ran: boolean;
    /** the file and its test have passed */
    passed: boolean;
    /** summary rows shown so far */
    summary: number;
};

const COMMAND = "pnpm vitest run";
const PROMPT = "~/echo-bot";
const ROOT = "/Users/kira/echo-bot";
const TEST_NAME = "echo repeats the message";

const initial: S = { cmd: "", typing: false, ran: false, passed: false, summary: 0 };
const poster: S = { cmd: COMMAND, typing: false, ran: true, passed: true, summary: 4 };

async function script(a: Act<S>) {
    await a.wait(1000);
    await a.set({ typing: true });
    await a.type("cmd", COMMAND, { interval: 60 });
    await a.set({ typing: false });
    await a.wait(420);

    // Enter: Vitest starts and queues the one file
    a.mark("run");
    await a.set({ ran: true });
    await a.wait(900);

    // It passes: the file's row settles, its test lists under it, then the summary
    a.mark("pass");
    await a.set({ passed: true });
    await a.wait(320);
    await a.stagger([1, 2, 3, 4], (n) => a.set({ summary: n }), 90);
    a.mark("passed");
    await a.wait(2800);
}

const show = (on: boolean) => ({ "data-show": on || undefined });

// One cell, one character wide: the queued mark until the tick takes its place
function Mark({ ok }: { ok: boolean }) {
    return (
        <span className="tr-mark" data-ok={ok || undefined}>
            <span className="tr-mark__queued">❯</span>
            <span className="tr-mark__tick ok">✓</span>
        </span>
    );
}

function Terminal({ s }: { s: S }) {
    return (
        <Window chrome="terminal" lights="grey" title="echo-bot — zsh" className="tr-term">
            <Prompt path={PROMPT}>
                {s.cmd}
                {!s.ran && <Caret still={s.typing} />}
            </Prompt>
            <div className="tr-out tr-gap" {...show(s.ran)}>
                {" "}
                <span className="tr-run"> RUN </span> <span className="tr-ver">v5.0.5</span> <span className="dim">{ROOT}</span>
            </div>
            <div className="tr-out tr-gap" {...show(s.ran)}>
                {" "}
                <Mark ok={s.passed} /> test/echo.test.ts{" "}
                <span className="tr-swap">
                    <span className="dim tr-swap__a" {...show(!s.passed)}>[queued]</span>
                    <span className="tr-swap__b" {...show(s.passed)}>
                        <span className="dim">(1 test)</span> 7ms
                    </span>
                </span>
            </div>
            <div className="tr-out" {...show(s.passed)}>
                {"   "}
                <span className="ok">✓</span> {TEST_NAME} <span className="dim">6ms</span>
            </div>
            <div className="tr-out tr-gap" {...show(s.summary >= 1)}>
                <span className="dim"> Test Files </span> <span className="ok">1 passed</span> <span className="dim">(1)</span>
            </div>
            <div className="tr-out" {...show(s.summary >= 2)}>
                <span className="dim">{"      Tests "}</span> <span className="ok">1 passed</span> <span className="dim">(1)</span>
            </div>
            <div className="tr-out" {...show(s.summary >= 3)}>
                <span className="dim">{"   Start at "}</span> 21:04:12
            </div>
            <div className="tr-out" {...show(s.summary >= 4)}>
                <span className="dim">{"   Duration "}</span> 104ms <span className="dim">(import 67%, transform 20%, tests 11%, worker 2%)</span>
            </div>
        </Window>
    );
}

// The site's editor card: the file's path in amber over the code. In the
// phone column it wraps its long lines and opens on the test itself
function Editor({ lines, from }: { lines: CodeLines; from: number }) {
    return (
        <section className="tr-ed">
            <div className="tr-ed__tab">
                <span className="tr-ed__file">{TEST_FILE}</span>
            </div>
            <div className="tr-ed__code">
                {lines.slice(from).map((line, i) => {
                    const indent = line.map((t) => t.c).join("").match(/^ */)?.[0].length ?? 0;
                    return (
                        <div key={from + i} className="tr-ed__row">
                            <span className="tr-ed__ln">{from + i + 1}</span>
                            <span className="tr-ed__text" style={{ ["--ind" as string]: indent }}>
                                <CodeRow line={line} />
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

// `compactBelow`: the container width under which the compact design takes
// over (a docs column wants the wide design longer than a page section).
// `still`: the poster only, no script, for the Reveal's still cut.
export default function TestingRun({ code, compactBelow = 640, still = false }: { code: CodeLines; compactBelow?: number; still?: boolean }) {
    return (
        <Stage
            width={868}
            height={400}
            compact={{ below: compactBelow, width: 358, height: 604 }}
            initial={initial}
            poster={poster}
            script={still ? undefined : script}
            play="once"
            theme="dark"
            className="sy tr"
        >
            {(s, _rect, layout) => (
                <div className="tr-stack">
                    <Editor lines={code} from={layout === "compact" ? 4 : 0} />
                    <Terminal s={s} />
                </div>
            )}
        </Stage>
    );
}
