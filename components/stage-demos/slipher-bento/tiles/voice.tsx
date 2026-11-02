"use client";

import { Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./voice.css";

// @slipher/voice: the bot in a Discord voice channel, Opus packets running
// both ways. On the left, Discord's channel list as a member sees it: the
// voice channel, Orbit and kira in it, and the "Voice Connected" panel with a
// lock for a call protected end to end. On the right, the two directions the
// package exposes: connection.play(opusPackets) streams into the channel the
// whole time (Orbit's speaking ring stays lit), and connection.receive(userId)
// carries kira's packets out only while kira talks, as Discord sends a
// participant's audio only while they speak.
//
// Strings: `connection.play(opusPackets)`, `connection.receive(userId)`,
// "Opus", "DAVE" and "end-to-end encryption" are the voice guide's
// (content/docs/plugins/official/voice.mdx) and @slipher/voice 0.1.0's public
// API (tiramisulabs/extra main at d8fd3b7, packages/voice/src/connection.ts).
// "Voice Connected" is Discord's own panel label. Invented: the channel
// "lounge", the server "Seyfert", the member kira, and the bot's name Orbit
// (the cooldown tile's).
//
// The loop never rewinds: the packet lanes are a repeating pattern moved by
// exactly one period (CSS), and kira's turn ends silent, as it began.

type Talk = { kira: boolean };
const quiet: Talk = { kira: false };
// The still: both directions running
const poster: Talk = { kira: true };

// kira talks for a while, then pauses; Orbit never stops playing
const talking = async (a: Act<Talk>) => {
    await a.wait(1200);
    await a.set({ kira: true });
    await a.wait(2800);
    await a.set({ kira: false });
    await a.wait(1600);
};

function Lock() {
    return (
        <svg className="sb-voice__lock" width="10" height="12" viewBox="0 0 10 12" aria-hidden>
            <path d="M2.5 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <rect x="1" y="5" width="8" height="6.5" rx="1.5" fill="currentColor" />
        </svg>
    );
}

function Speaker() {
    return (
        <svg className="sb-voice__speaker" width="16" height="16" viewBox="0 0 14 14" aria-hidden>
            <path d="M2 5h2.5L8 2v10L4.5 9H2z" fill="currentColor" />
            <path d="M10 4.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    );
}

function Channel({ kira }: { kira: boolean }) {
    return (
        <div className="sb-voice__side">
            <div className="sb-voice__channel">
                <Speaker />
                lounge
            </div>
            <div className="sb-voice__member">
                <span className="sb-voice__face sb-voice__face--bot" data-speaking="">
                    <img src="/logo.svg" alt="" />
                </span>
                <span className="sb-voice__name">Orbit</span>
                <span className="sb-voice__app">APP</span>
            </div>
            <div className="sb-voice__member">
                <span className="sb-voice__face sb-voice__face--kira" data-speaking={kira ? "" : undefined}>
                    k
                </span>
                <span className="sb-voice__name">kira</span>
            </div>
            <div className="sb-voice__connected">
                <span className="sb-voice__status">
                    <Lock />
                    Voice Connected
                </span>
                <span className="sb-voice__where">lounge / Seyfert</span>
            </div>
        </div>
    );
}

function Lane({ label, way, on }: { label: string; way: "in" | "out"; on: boolean }) {
    return (
        <div className="sb-voice__lane" data-way={way} data-on={on || undefined}>
            <span className="sb-voice__call">{label}</span>
            <span className="sb-voice__track" />
        </div>
    );
}

export function VoiceTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 236 : 230;
    return (
        <Tile
            area="voice"
            pkg={["@slipher/voice"]}
            title="Discord voice, end to end."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Talk> width={width} height={height} theme="dark" initial={quiet} poster={poster} play="loop" script={talking} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-voice" data-layout={compact ? "compact" : "wide"}>
                                <Channel kira={s.kira} />
                                <div className="sb-voice__lanes">
                                    <div className="sb-voice__dave">
                                        <Lock /> DAVE{!compact && <span className="sb-voice__dim"> end-to-end encryption</span>}
                                    </div>
                                    <Lane label={compact ? "play(opusPackets)" : "connection.play(opusPackets)"} way="in" on />
                                    <Lane label={compact ? "receive(userId)" : "connection.receive(userId)"} way="out" on={s.kira} />
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Opus in and out over DAVE, on Node.js, Bun and Deno.
        </Tile>
    );
}
