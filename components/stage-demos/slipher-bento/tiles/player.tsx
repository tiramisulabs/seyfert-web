"use client";

import { Collapse, Stage, type Act } from "@/components/stageshow/kit";
import { Tile, usePictureWidth } from "../index";
import "./player.css";

// @slipher/player: one guild's player working through its queue. On the
// left, the player itself: its state, the current item and its progress,
// and what waits next. On the right, the typed Seyfert events the plugin
// emits as each item ends and the next one starts. A conveyor: the four
// tracks repeat forever, and each lap ends by snapping back to the same
// picture.
//
// Strings: every track is one of the player guide's own examples
// (content/docs/plugins/official/player.mdx), titled as @slipher/player
// 0.1.0 titles them (tiramisulabs/extra main at d8fd3b7,
// packages/player/src/track.ts): file('./music/song.mp3') is "song.mp3",
// url(…, { title: 'Remote song' }), radio(…, { title: 'Example FM' }) and
// bytes(audioBytes, { title: 'Generated audio' }). The provider names (file,
// url, radio, bytes), the states (loading, playing), the end reasons
// (finished, skipped), "live" (a radio track's timeline kind) and the events
// playerTrackEnd and playerTrackStart are the package's
// (packages/player/src/types.ts). `guildPlayer` is the guide's variable.
// Invented: the order of the queue, that the radio is skipped rather than
// left on, and the time each track gets on screen (a time-lapse).

type Track = { title: string; provider: "file" | "url" | "radio" | "bytes" };
const TRACKS: Track[] = [
    { title: "song.mp3", provider: "file" },
    { title: "Remote song", provider: "url" },
    { title: "Example FM", provider: "radio" },
    { title: "Generated audio", provider: "bytes" },
];
const trackAt = (k: number) => TRACKS[k % TRACKS.length];
// A live stream never finishes; this one is skipped
const endOf = (k: number) => (trackAt(k).provider === "radio" ? "skipped" : "finished");

// n is the current item's place in the endless queue; loading until it
// starts; p its progress, 0 or 1 (the bar's transition does the rest)
type Deck = { n: number; loading: boolean; p: number };
const DECK_START = TRACKS.length;
const deckStart: Deck = { n: DECK_START, loading: false, p: 1 };
// The still: a track halfway through, its queue behind it
const deckPoster: Deck = { n: DECK_START + 1, loading: false, p: 0.45 };
const LOAD = 450;
const PLAY = 2600;
// Items waiting, and the handovers kept in the event feed
const QUEUE = 3;
const FEED = 3;

// Each lap plays the four once: the item ends, the next one loads, then plays
const playing = async (a: Act<Deck>) => {
    for (let n = DECK_START + 1; n <= DECK_START + TRACKS.length; n++) {
        await a.set({ n, loading: true, p: 0 });
        await a.wait(LOAD);
        await a.set({ loading: false, p: 1 });
        await a.wait(PLAY);
    }
    await a.snap({ n: DECK_START });
};

function Provider({ name }: { name: Track["provider"] }) {
    return <span className="sb-player__provider">{name}</span>;
}

function Now({ k, loading, p }: { k: number; loading: boolean; p: number }) {
    const track = trackAt(k);
    const live = track.provider === "radio";
    return (
        <div className="sb-player__now">
            <div className="sb-player__title">
                <Provider name={track.provider} />
                <span className="sb-player__name">{track.title}</span>
            </div>
            {live ? (
                <div className="sb-player__live" data-on={!loading || undefined}>
                    <span className="sb-player__dot" /> live
                </div>
            ) : (
                <div className="sb-player__bar">
                    {/* full in PLAY ms once it starts; a new item mounts empty */}
                    <span className="sb-player__fill" data-run={(!loading && p === 1) || undefined} style={{ width: `${p * 100}%`, ["--play" as string]: `${PLAY}ms` }} />
                </div>
            )}
        </div>
    );
}

export function PlayerTile() {
    const [ref, width, ready] = usePictureWidth(660);
    const compact = width < 520;
    const height = compact ? 240 : 236;
    return (
        <Tile
            area="player"
            pkg={["@slipher/player"]}
            title="A queue per guild."
            picture={
                <div ref={ref} className="sb-picture sb-picture--full" style={ready ? undefined : { visibility: "hidden" }}>
                    <Stage<Deck> width={width} height={height} theme="dark" initial={deckStart} poster={deckPoster} play="loop" script={playing} className="sy sb-stage">
                        {(s) => (
                            <div className="sb-player" data-layout={compact ? "compact" : "wide"}>
                                <div className="sb-player__deck">
                                    <div className="sb-player__head">
                                        <span className="sb-player__var">guildPlayer</span>
                                        <span className="sb-player__state" data-loading={s.loading || undefined}>
                                            {s.loading ? "loading" : "playing"}
                                        </span>
                                    </div>
                                    {/* keyed by item, so each one starts with an empty bar */}
                                    <Now key={s.n} k={s.n} loading={s.loading} p={s.p} />
                                    <div className="sb-player__label">queue</div>
                                    <div className="sb-player__queue">
                                        {/* the next item leaves the top as it becomes current; one more joins at the foot */}
                                        {Array.from({ length: QUEUE + 2 }, (_, i) => s.n + i).map((k) => (
                                            <Collapse key={k} open={k > s.n && k <= s.n + QUEUE}>
                                                <div className="sb-player__item">
                                                    <span className="sb-player__name">{trackAt(k).title}</span>
                                                    <Provider name={trackAt(k).provider} />
                                                </div>
                                            </Collapse>
                                        ))}
                                    </div>
                                </div>
                                {!compact && (
                                    <div className="sb-player__events">
                                        {/* a handover per item: the last one ends, then this one starts */}
                                        {Array.from({ length: FEED + 1 }, (_, i) => s.n - FEED + 1 + i).map((k) => (
                                            <Collapse key={k} open={k <= s.n} className="sb-player__handover">
                                                <div className="sb-player__event">
                                                    <span className="sb-player__ev">playerTrackEnd</span> <span className="sb-player__arg">{endOf(k - 1)}</span>
                                                </div>
                                                <Collapse open={k < s.n || !s.loading}>
                                                    <div className="sb-player__event">
                                                        <span className="sb-player__ev">playerTrackStart</span> <span className="sb-player__arg">{trackAt(k).title}</span>
                                                    </div>
                                                </Collapse>
                                            </Collapse>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </Stage>
                </div>
            }
        >
            Files, URLs and radio, transcoded by FFmpeg only when needed, on top of voice.
        </Tile>
    );
}
