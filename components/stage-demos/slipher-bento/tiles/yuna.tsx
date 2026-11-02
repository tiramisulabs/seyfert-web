"use client";

import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./yuna.css";

// yunaforseyfert: prefix commands read like slash commands. In a Discord
// channel kira runs !warn three ways, and each message is parsed as it
// lands: the option names light up, the values they take are marked, and
// the options the command receives show under the message. A conveyor of
// three messages a lap, the oldest leaving over the top, then a snap back to
// the same picture.
//
// The syntax is yunaforseyfert 1.1.3's parser (~/dev/yunaforseyfert,
// branch socram/seyfert-plugin-contract at b5397ad, src/package/utils/parser):
// - `--user` and `-reason` are named options with the `--` and `-` syntaxes,
//   the two the guide's Yuna.plugin() example enables (namedOptions:
//   ['-', '--']); named options may come in any order.
// - "spamming invites" and 'posting links' are long text tags (the parser's
//   `"` and `'`), one option value with spaces in it.
// - The third message has no names at all: values fill the options in order,
//   and the last option takes the rest of the content (the parser's
//   lastestLongWord), so the reason needs no quotes.
// - `!` is the guide's prefix (`commands.prefix: () => ['!', '?']`).
// Invented: the warn command (a user option, then a string reason), kira,
// mika, leo and noa, and the reasons. The strip under each message is the
// picture's device for ctx.options, the command's resolved options.

type Part = { text: string; role?: "name" | "value"; mention?: boolean };
type Run = { parts: Part[]; options: [name: string, value: string][] };

const sp: Part = { text: " " };
const RUNS: Run[] = [
    {
        parts: [{ text: "!warn" }, sp, { text: "--user", role: "name" }, sp, { text: "@mika", role: "value", mention: true }, sp, { text: "--reason", role: "name" }, sp, { text: '"spamming invites"', role: "value" }],
        options: [
            ["user", "@mika"],
            ["reason", "spamming invites"],
        ],
    },
    {
        parts: [{ text: "!warn" }, sp, { text: "-reason", role: "name" }, sp, { text: "'posting links'", role: "value" }, sp, { text: "-user", role: "name" }, sp, { text: "@leo", role: "value", mention: true }],
        options: [
            ["user", "@leo"],
            ["reason", "posting links"],
        ],
    },
    {
        parts: [{ text: "!warn" }, sp, { text: "@noa", role: "value", mention: true }, sp, { text: "off-topic in general, again", role: "value" }],
        options: [
            ["user", "@noa"],
            ["reason", "off-topic in general, again"],
        ],
    },
];
const runAt = (k: number) => RUNS[((k % RUNS.length) + RUNS.length) % RUNS.length];
// Messages kept mounted above the newest: more than the panel shows
const DEPTH = 3;

// n counts kira's messages; the newest is parsed once `parsed` is set
type Chat = { n: number; parsed: boolean };
const START = RUNS.length * 2;
const chatStart: Chat = { n: START, parsed: true };

const parsing = async (a: Act<Chat>) => {
    // 1.6s between a parse and the next message, the seam included
    for (let n = START + 1; n <= START + RUNS.length; n++) {
        await a.wait(n === START + 1 ? 700 : 1600);
        await a.set({ n, parsed: false });
        await a.wait(750);
        await a.set({ parsed: true });
    }
    await a.wait(900);
    await a.snap({ n: START });
};

function Message({ run, parsed }: { run: Run; parsed: boolean }) {
    return (
        <div className="sb-dc__group">
            <div className="sb-dc__msg">
                <span className="sb-yuna__face">k</span>
                <div className="sb-dc__body">
                    <div className="sb-dc__meta">
                        <span className="sb-dc__name">kira</span>
                    </div>
                    <p className="sb-dc__text sb-yuna__text" data-parsed={parsed || undefined}>
                        {run.parts.map((part, i) => (
                            <span key={i} className={part.mention ? "sb-yuna__mention" : undefined} data-role={part.role}>
                                {part.text}
                            </span>
                        ))}
                    </p>
                    <div className="sb-yuna__options" data-parsed={parsed || undefined}>
                        <span className="sb-yuna__label">ctx.options</span>
                        {run.options.map(([name, value]) => (
                            <span key={name} className="sb-yuna__option">
                                <span className="sb-yuna__name">{name}</span>
                                {` ${value}`}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function YunaTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    return (
        <Tile
            area="yuna"
            pkg={["yunaforseyfert"]}
            title="Prefix commands, parsed properly."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Chat> width={width} height={compact ? 250 : 270} theme="dark" initial={chatStart} play="loop" script={parsing} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-dc sb-yuna" data-layout={compact ? "compact" : "wide"}>
                                <div className="sb-dc__feed">
                                    {/* oldest first, pinned to the foot; the next message waits closed below */}
                                    {Array.from({ length: DEPTH + 1 }, (_, i) => s.n - DEPTH + i).map((k) => (
                                        <Collapse key={k} open={k < s.n} reveal="drop" from="below" className="sb-dc__turn">
                                            <Message run={runAt(k)} parsed={k < s.n - 1 || (k === s.n - 1 && s.parsed)} />
                                        </Collapse>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Named options in any order, quoted values.
        </Tile>
    );
}
