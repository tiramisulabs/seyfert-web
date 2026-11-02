"use client";

import type { ReactNode } from "react";
import { Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./webhooks.css";

// @slipher/webhooks: Discord's webhook events arriving at the listener. Each
// delivery lands on top of a stack of payloads, the ones before it sinking
// behind; beside it, the listener's steps for that delivery tick through:
// the POST at its path, the Ed25519 signature check, the callback, and the
// 204. A PING is verified and answered too, but never reaches the callback.
//
// Strings: `/api/webhooks`, `verifySignature`, `callback(event)`, the 204,
// the payload keys (`type`, `event`, `data`, `version`, `application_id`),
// WebhookRequestType's 0 (PING) and 1 (Event) and the event types
// APPLICATION_AUTHORIZED and ENTITLEMENT_CREATE are @slipher/webhooks
// 0.0.5's (tiramisulabs/extra main at 678b791, packages/webhooks:
// src/index.ts and its README). `integration_type`, `scopes`, `sku_id`,
// `user_id`, `type` and `username` are Discord's fields for those events
// (the package's own type for APPLICATION_AUTHORIZED; APIEntitlement and
// APIUser in Seyfert's types, entitlement type 8 being an application
// subscription). Invented: the user kira, the IDs, the scope list.
//
// The loop never rewinds: three deliveries, one of each, then a snap back
// one lap to the same picture with the last one's steps all done.

type Delivery = { kind: "event" | "ping"; type: string; lines: [string, string][] };
const DELIVERIES: Delivery[] = [
    {
        kind: "event",
        type: "APPLICATION_AUTHORIZED",
        lines: [
            ["integration_type", "1"],
            ["user", '{ "username": "kira" }'],
            ["scopes", '["applications.commands"]'],
        ],
    },
    {
        kind: "event",
        type: "ENTITLEMENT_CREATE",
        lines: [
            ["sku_id", '"1088510058284990888"'],
            ["user_id", '"366779196975874049"'],
            ["type", "8"],
        ],
    },
    {
        kind: "ping",
        type: "PING",
        lines: [
            ["version", "1"],
            ["application_id", '"1003825077969764412"'],
        ],
    },
];
const at = (k: number) => DELIVERIES[k % DELIVERIES.length];
// Cards drawn: the arriving one, the newest, two behind it and a third
// already faded, so the oldest leaves by fading rather than vanishing
const BEHIND = 3;

// n counts the deliveries; step is how far the newest has got: 1 the POST,
// 2 verified, 3 the callback (a PING skips it), 4 the 204
type Hook = { n: number; step: number };
const START = DELIVERIES.length * 2;
const initial: Hook = { n: START, step: 4 };

// A delivery every 2.4s, the seam included
const deliveries = async (a: Act<Hook>) => {
    for (let k = START; k < START + DELIVERIES.length; k++) {
        await a.wait(k === START ? 400 : 1000);
        await a.set({ n: k + 1, step: 0 });
        for (let step = 1; step <= 4; step++) {
            await a.wait(step === 1 ? 420 : 320);
            await a.set({ step });
        }
    }
    await a.wait(600);
    await a.snap({ n: START });
};

function Steps({ s }: { s: Hook }) {
    const ping = at(s.n - 1).kind === "ping";
    const rows: { label: ReactNode; result: string; skipped?: boolean }[] = [
        { label: <>POST /api/webhooks</>, result: "" },
        { label: <>verifySignature</>, result: "✓" },
        { label: <>callback(event)</>, result: ping ? "–" : "✓", skipped: ping },
        { label: <>204</>, result: "" },
    ];
    return (
        <div className="sb-hook__steps">
            {rows.map((row, i) => (
                <div key={i} className="sb-hook__step" data-on={s.step > i || undefined} data-skipped={row.skipped || undefined}>
                    <span className="sb-hook__mark" />
                    <span className="sb-hook__label">{row.label}</span>
                    <span className="sb-hook__result">{row.result}</span>
                </div>
            ))}
        </div>
    );
}

export function WebhooksTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 250 : 262;
    return (
        <Tile
            area="webhooks"
            pkg={["@slipher/webhooks"]}
            title="Events Discord sends you."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Hook> width={width} height={height} theme="dark" initial={initial} play="loop" script={deliveries} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-hook" data-layout={compact ? "compact" : "wide"}>
                                <div className="sb-hook__stack">
                                    {/* oldest first, so the newest paints on top; depth -1 is the one arriving */}
                                    {Array.from({ length: BEHIND + 2 }, (_, i) => s.n - BEHIND - 1 + i).map((k) => {
                                        const d = at(k);
                                        const depth = s.n - 1 - k;
                                        return (
                                            <div key={k} className="sb-hook__card" data-depth={depth} aria-hidden={depth !== 0 || undefined}>
                                                <div className="sb-hook__type">
                                                    <span className="sb-hook__key">&quot;type&quot;: {d.kind === "ping" ? 0 : 1}</span>
                                                    <span className="sb-hook__badge" data-ping={d.kind === "ping" || undefined}>
                                                        {d.type}
                                                    </span>
                                                </div>
                                                {d.lines.map(([key, value]) => (
                                                    <div key={key} className="sb-hook__line">
                                                        <span className="sb-hook__key">&quot;{key}&quot;:</span> <span className="sb-hook__value">{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                                <Steps s={s} />
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            A signed listener that checks every delivery before your callback runs.
        </Tile>
    );
}
