import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import DiscordEcho from "./discord-echo/page";
import TypesCloseup from "./types-closeup/page";
import ComponentsUpdate from "./components-update/page";
import BenchScrub from "./bench-scrub/page";
import SlipherBento from "./slipher-bento/page";
import TestingRun from "./testing-run/page";
import LockscreenWink from "./lockscreen-wink/page";

// Every study on one page; each also lives at /stage/<slug> on its own.
const DEMOS = [
    { slug: "discord-echo", label: "Discord reply", Demo: DiscordEcho },
    { slug: "types-closeup", label: "Inference", Demo: TypesCloseup },
    { slug: "components-update", label: "Components", Demo: ComponentsUpdate },
    { slug: "bench-scrub", label: "Memory scrub", Demo: BenchScrub },
    { slug: "slipher-bento", label: "Ecosystem", Demo: SlipherBento },
    { slug: "testing-run", label: "Testing", Demo: TestingRun },
    { slug: "lockscreen-wink", label: "Wink", Demo: LockscreenWink },
];

export default function StagePage() {
    return (
        <>
            <header className="flex flex-col gap-5">
                <span className={`${GeistMono.className} text-[11.5px] tracking-[0.04em] text-[var(--text-dim)]`}>Stage · unlisted studies</span>
                <h1 className="max-w-[18ch] text-[clamp(40px,6vw,72px)] font-semibold leading-[0.95] tracking-[-0.04em]">
                    Seyfert, shown <span className="text-[#ffd9a0]">in its product</span>
                </h1>
                <p className="max-w-[56ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
                    Discord, the editor, the terminal and the benchmark, each doing one thing. Every string comes from real code, docs or measurements.
                </p>
                <nav aria-label="Demos" className={`${GeistMono.className} flex flex-wrap gap-x-5 gap-y-2 text-[12px]`}>
                    {DEMOS.map((d) => (
                        <Link key={d.slug} href={`#${d.slug}`} className="text-[var(--text-dim)] hover:text-[var(--text-bright)]">
                            {d.label}
                        </Link>
                    ))}
                </nav>
            </header>
            {DEMOS.map(({ slug, Demo }) => (
                <Demo key={slug} />
            ))}
        </>
    );
}
