import BenchScrub, { type BenchSeries } from "@/components/stage-demos/bench-scrub";
import { DemoFrame } from "@/components/stage-demos/frame";
import { medianMb } from "@/lib/benchmark";
import seyfert from "@/public/bench/node/meadianseyfert.json";
import discord from "@/public/bench/node/meadiandiscordjs.json";

// The run /benchmark shows by default: Node.js, RSS. Each series is already 24
// points, one 30-minute average of the 5-second samples over 12 hours, so the
// plot draws every one of them; nothing finer exists to thin out, and fewer
// would invent a smoother curve than was measured. The medians go through the
// same medianMb the landing and /benchmark quote.
const data: BenchSeries = {
    seyfert: seyfert.rss,
    discord: discord.rss,
    median: { seyfert: medianMb(seyfert.rss), discord: medianMb(discord.rss) },
};

export default function Page() {
    return (
        <DemoFrame id="bench-scrub" index={4} title="Memory you can scrub" where="live · home, Memory chapter (the scroll moves the hairline)">
            <BenchScrub data={data} />
        </DemoFrame>
    );
}
