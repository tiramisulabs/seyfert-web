"use client";

import { LockScreen, Notification, Phone, Stage, type Act } from "@/components/stageshow/kit";
import "@/components/stageshow/seyfert.css";
import "./lockscreen-wink.css";

// 3:14 on a Saturday night, and #general won't sleep: bots from the home's
// Orbit keep posting about Seyfert. Each message lands on top of the lock
// screen's Discord stack as iOS groups one conversation, the one before it
// sinking to a card's edge behind; the oldest slips under and is gone. A
// conveyor, so the loop never rewinds in view: three arrivals, then a snap
// back to a frame that looks exactly the same.
//
// The icon is the sender's own avatar, as iOS draws a communication
// notification (a Discord DM or mention). iOS would badge it with the app's
// icon; no Discord mark ships with the site, and a stand-in glyph would be an
// invented logo, so the badge is left out and "#general" names the app.
//
// Real strings: the date and clock, three senders, three messages.

type Bot = { name: string; avatar: string; says: string };

// Quotes from the Orbit on the home (components/home/reveal/reveal.tsx)
const BOTS: Bot[] = [
    { name: "Hiraku Shinzou", avatar: "/bots/thumbs/hiraku.webp", says: "all my homies use Seyfert" },
    { name: "Listen", avatar: "/bots/thumbs/listen.webp", says: "under 1 GB, from almost 4 GB" },
    { name: "CactusFire", avatar: "/bots/thumbs/cactusfire.webp", says: "nothing better than Seyfert" },
];

type S = {
    /** messages that have arrived; the newest is on top of the stack */
    n: number;
};

// Three behind the scenes from the start, so the stack is full on frame one
const START = BOTS.length;
const initial: S = { n: START };
// Hiraku on top: the wink
const poster: S = { n: START + 1 };

async function script(a: Act<S>) {
    await a.wait(800);
    a.mark("hiraku");
    await a.set({ n: START + 1 });
    await a.wait(3000);
    a.mark("listen");
    await a.set({ n: START + 2 });
    await a.wait(2800);
    a.mark("cactus");
    await a.set({ n: START + 3 });
    await a.wait(2200);
    // The same picture with smaller numbers: invisible
    await a.snap({ n: START });
}

const bot = (k: number) => BOTS[((k % BOTS.length) + BOTS.length) % BOTS.length];

// The stack, in screen points: the newest card in front, two edges peeking
// under it, one more fading out behind them, and the next one waiting above,
// unseen, so every card arrives and leaves by moving
function Stack({ n }: S) {
    const keys: number[] = [];
    for (let k = n; k >= n - 4; k--) keys.push(k);
    return (
        <div className="lw-stack">
            {keys.map((k) => {
                const depth = n - 1 - k;
                const b = bot(k);
                return (
                    <Notification
                        key={k}
                        className="lw-note"
                        data-depth={depth}
                        aria-hidden={depth !== 0 || undefined}
                        icon={<img src={b.avatar} alt="" />}
                        title={`${b.name} · #general`}
                        body={b.says}
                    />
                );
            })}
        </div>
    );
}

export default function LockscreenWink() {
    return (
        <Stage width={400} height={320} compact={{ below: 400, width: 358, height: 296 }} initial={initial} poster={poster} script={script} play="loop" theme="dark" className="sy lw">
            {(s, _rect, layout) => (
                <div className="lw-device">
                    <Phone width={layout === "compact" ? 326 : 364} frame="pro" time="3:14" dark wallpaper="var(--lw-wall)">
                        <LockScreen size="satellite" date="Saturday, October 31" time="3:14">
                            <Stack n={s.n} />
                        </LockScreen>
                    </Phone>
                </div>
            )}
        </Stage>
    );
}
