"use client";

import type { CSSProperties } from "react";
import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./otel.css";

// @slipher/opentelemetry: a trace waterfall per interaction. A /profile and a
// /ping arrive one after the other; each trace draws in its own time (25x
// slower than the durations it states), its spans nested as the plugin nests
// them, and the newer one pushes the older up and out. A conveyor: two
// traces a lap, then a snap back to the same picture.
//
// Strings, from @slipher/opentelemetry 1.0.0 (tiramisulabs/extra main at
// bad00ca, packages/opentelemetry) and its guide
// (content/docs/plugins/official/opentelemetry.mdx):
// - "command profile" / "command ping" is interactionSpanName()'s root span
//   (attributes.ts); "Options", "Middlewares" and "Run" are the lifecycle
//   children, in Seyfert's chat order (instrument/interactions.ts), and Run
//   is the active span the command's own spans nest under.
// - "POST /interactions/{interaction_id}/{token}/callback" is the REST span:
//   `${method} ${template}`, the token redacted to {token} and the id named
//   by ROUTE_PARAM_NAMES (instrument/rest.ts); ctx.write() answers through
//   that callback route.
// - "cache get guild" is `cache ${method} ${resource}` (instrument/cache.ts).
//   Cache spans are off by default: this bot sets `traces: { cache: true }`,
//   as the guide shows.
// - "profile.load" is the guide's ctx.trace.record() example, and "my-bot"
//   its serviceName.
// - The colors follow the span kinds in the guide's table: CONSUMER for the
//   interaction and its children, CLIENT for REST, INTERNAL for cache, and the
//   app's own span.
// Invented: the durations and the trace ids.

type Kind = "consumer" | "client" | "internal" | "app";
type Span = { name: string; depth: number; from: number; to: number; kind: Kind };
type Trace = { id: string; root: string; ms: number; spans: Span[] };

const CALLBACK = "POST /interactions/{interaction_id}/{token}/callback";

const TRACES: Trace[] = [
    {
        id: "4bf92f3",
        root: "command profile",
        ms: 96,
        spans: [
            { name: "command profile", depth: 0, from: 0, to: 96, kind: "consumer" },
            { name: "Options", depth: 1, from: 0, to: 1, kind: "consumer" },
            { name: "Middlewares", depth: 1, from: 1, to: 2, kind: "consumer" },
            { name: "Run", depth: 1, from: 2, to: 95, kind: "consumer" },
            { name: "cache get guild", depth: 2, from: 3, to: 5, kind: "internal" },
            { name: "profile.load", depth: 2, from: 5, to: 57, kind: "app" },
            { name: CALLBACK, depth: 2, from: 58, to: 94, kind: "client" },
        ],
    },
    {
        id: "a3ce929",
        root: "command ping",
        ms: 41,
        spans: [
            { name: "command ping", depth: 0, from: 0, to: 41, kind: "consumer" },
            { name: "Options", depth: 1, from: 0, to: 1, kind: "consumer" },
            { name: "Middlewares", depth: 1, from: 1, to: 2, kind: "consumer" },
            { name: "Run", depth: 1, from: 2, to: 40, kind: "consumer" },
            { name: CALLBACK, depth: 2, from: 4, to: 39, kind: "client" },
        ],
    },
];
const traceAt = (k: number) => TRACES[((k % TRACES.length) + TRACES.length) % TRACES.length];
// A trace draws 25x slower than it ran: /profile's 96ms takes 2.4s
const SLOW = 25;
// Traces kept mounted above the newest: more than the panel shows
const DEPTH = 2;

// n counts the traces received; the newest, n - 1, is the one drawing
type Traces = { n: number };
const START = TRACES.length * 2;
const tracesStart: Traces = { n: START };

// Each trace holds 1.6s once drawn before the next arrives, the seam
// included (1s before the snap, 600ms after)
const tracing = async (a: Act<Traces>) => {
    await a.wait(600);
    await a.set({ n: START + 1 });
    await a.wait(TRACES[0].ms * SLOW + 1600);
    await a.set({ n: START + 2 });
    await a.wait(TRACES[1].ms * SLOW + 1000);
    await a.snap({ n: START });
};

function Waterfall({ trace, drawn }: { trace: Trace; drawn: boolean }) {
    return (
        <div className="sb-otel__trace" data-drawn={drawn || undefined}>
            <div className="sb-otel__head">
                <span className="sb-otel__service">my-bot</span>
                <span className="sb-otel__root">{trace.root}</span>
                <span className="sb-otel__meta">
                    {trace.spans.length} spans · {trace.id}
                </span>
            </div>
            {trace.spans.map((span, i) => {
                const style = {
                    "--l": `${(span.from / trace.ms) * 100}%`,
                    "--w": `${(Math.max(span.to - span.from, 0.6) / trace.ms) * 100}%`,
                    "--s": `${span.from * SLOW}ms`,
                    "--d": `${Math.max(span.to - span.from, 1) * SLOW}ms`,
                    "--e": `${span.to * SLOW}ms`,
                    "--depth": span.depth,
                } as CSSProperties;
                return (
                    <div key={i} className="sb-otel__span" style={style} data-kind={span.kind}>
                        <span className="sb-otel__name">{span.name}</span>
                        <span className="sb-otel__track">
                            <span className="sb-otel__bar" />
                        </span>
                        <span className="sb-otel__ms">{span.to - span.from}ms</span>
                    </div>
                );
            })}
        </div>
    );
}

export function OpenTelemetryTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    return (
        <Tile
            area="otel"
            pkg={["@slipher/opentelemetry"]}
            title="Every interaction, traced."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Traces> width={width} height={compact ? 250 : 270} theme="dark" initial={tracesStart} play="loop" script={tracing} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-otel" data-layout={compact ? "compact" : "wide"}>
                                <div className="sb-otel__feed">
                                    {/* oldest first; the next trace waits closed at the foot */}
                                    {Array.from({ length: DEPTH + 1 }, (_, i) => s.n - DEPTH + i).map((k) => (
                                        <Collapse key={k} open={k < s.n} reveal="drop" from="below" className="sb-otel__slot">
                                            <Waterfall trace={traceAt(k)} drawn={k < s.n} />
                                        </Collapse>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Commands, REST and cache as spans, to any OTLP backend.
        </Tile>
    );
}
