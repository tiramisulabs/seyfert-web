"use client";

import { useMemo } from "react";
import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./cache-integrity.css";

// @slipher/cache-integrity after a restart: the persisted entries an earlier
// process left in Redis, laid out on an age axis with the maxAge window shaded
// at its fresh end, and this process's direct lookups landing under it as a
// log. A lookup of an entry inside maxAge reuses the persisted value; one
// older than maxAge reads as a miss, so the resource's cache flow decides
// whether REST is asked instead. The lookup's dot lights on the axis and a
// line drops from it to the log.
//
// Strings: `get`, `maxAge` and the `5 * 60_000` window are the docs' own
// (content/docs/plugins/official/cache-integrity.mdx: the Setup example and
// the Operation table's "`get`, `bulkGet` | Return current-process values or
// persisted values no older than `maxAge`"; "An expired or hidden entry
// behaves like a normal cache miss"). The keys are Seyfert's own resource
// key shapes (`user.<id>`, `role.<id>`, …, Seyfert 5.2.1's hashId) as the
// adapter's get receives them. "hit" and "miss" are the cache's plain words,
// the docs use "miss". No local source of the package was found under ~/dev
// (tiramisulabs/extra at 678b791 has no cache-integrity package), so the docs
// page is the only source. Invented: the ages of the four entries; the IDs
// are the docs' example IDs, as in the Redis tile.
//
// A conveyor: the four lookups repeat, the newest lands on top of the log
// and the oldest leaves under the tile's bottom edge; each lap ends by
// snapping back to the same picture.

type Lookup = { key: string; age: number };
// Minutes since the earlier process wrote each entry
const MAX_AGE = 5;
const SPAN = 30;
const LOOKUPS: Lookup[] = [
    { key: "user.576805413148688424", age: 1 },
    { key: "guild.1003825077969764412", age: 12 },
    { key: "role.1115437277846458388", age: 3 },
    { key: "channel.1003825079328702529", age: 22 },
];
const hit = (l: Lookup) => l.age <= MAX_AGE;

// n counts the lookups so far; the newest is n - 1
type Reads = { n: number };
const START = LOOKUPS.length * 2;
const start: Reads = { n: START };
const at = (k: number) => LOOKUPS[k % LOOKUPS.length];
// Rows kept mounted under the newest: more than the log shows
const DEPTH = 5;

const reads = async (a: Act<Reads>) => {
    // the same 1.4s beat every lookup, the seam included: the last row
    // finishes landing (800ms), the snap, then the rest
    for (let n = START + 1; n <= START + LOOKUPS.length; n++) {
        await a.wait(n === START + 1 ? 600 : 1400);
        await a.set({ n });
    }
    await a.wait(800);
    await a.snap({ n: START });
};

export function CacheIntegrityTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 236 : 262;
    const pad = compact ? 24 : 28;
    // the age axis: now at the left, SPAN minutes at the right
    const axisW = width - pad * 2;
    const ageX = (age: number) => pad + (age / SPAN) * axisW;
    const script = useMemo(() => reads, []);
    return (
        <Tile area="cache-integrity" pkg={["@slipher/cache-integrity"]} title="Reuse what's still fresh." picture={
            <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                <Stage<Reads> width={width} height={height} theme="dark" initial={start} play="loop" script={script} className="sy sb-stage">
                    {(s) => {
                        const current = at(s.n - 1);
                        return (
                            <div className="sb-ci" data-layout={compact ? "compact" : "wide"} style={{ ["--pad" as string]: `${pad}px` }}>
                                <div className="sb-ci__axis">
                                    <span className="sb-ci__fresh" style={{ left: pad, width: ageX(MAX_AGE) - pad }}>
                                        <span className="sb-ci__window">maxAge</span>
                                    </span>
                                    <span className="sb-ci__rule" style={{ left: pad, width: axisW }} />
                                    <span className="sb-ci__tick sb-ci__tick--start" style={{ left: pad }}>
                                        now
                                    </span>
                                    <span className="sb-ci__tick" style={{ left: ageX(MAX_AGE) }}>
                                        5m
                                    </span>
                                    <span className="sb-ci__tick sb-ci__tick--end" style={{ left: ageX(SPAN) }}>
                                        {SPAN}m ago
                                    </span>
                                    {LOOKUPS.map((l) => (
                                        <span
                                            key={l.key}
                                            className="sb-ci__dot"
                                            data-hit={hit(l) || undefined}
                                            data-on={l === current || undefined}
                                            style={{ left: ageX(l.age) }}
                                        />
                                    ))}
                                    {/* the lookup's line, from its entry down to the log */}
                                    <span className="sb-ci__drop" data-hit={hit(current) || undefined} style={{ left: ageX(current.age) }} />
                                </div>
                                <div className="sb-ci__log">
                                    {Array.from({ length: DEPTH + 1 }, (_, i) => s.n - i).map((k) => {
                                        const l = at(k);
                                        return (
                                            <Collapse key={k} open={k < s.n} reveal="drop">
                                                <div className="sb-ci__row" data-fresh={k === s.n - 1 || undefined}>
                                                    <span className="sb-ci__op">get</span>
                                                    <span className="sb-ci__key">{l.key}</span>
                                                    {!compact && <span className="sb-ci__age">{l.age}m old</span>}
                                                    <span className="sb-ci__result" data-hit={hit(l) || undefined}>
                                                        {hit(l) ? "hit" : "miss"}
                                                    </span>
                                                </div>
                                            </Collapse>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    }}
                </Stage>
            </div>
        }>
            Values from before a restart within maxAge, everything older a normal miss.
        </Tile>
    );
}
