import { GeistMono } from "geist/font/mono";
import { AtSign, Blocks, Braces, Package, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { ArmLabel } from "./arm-label";

// Capabilities — the instrument manifest. Same row language as the
// luminosity readout (hairlines, mono annotations, bare icons, a ✓ receipt
// per row) inside the page's editorial split: masthead rail left, readout
// right. The F-0N index and proof receipts survive from the classic grid.

type Feature = {
    title: string;
    description: string;
    icon: LucideIcon;
    proof: string;
    /** hidden hover reference — for the ones who read everything */
    wink?: string;
};

const FEATURES: Feature[] = [
    {
        title: "Typed end to end",
        description:
            "Inference everywhere: command options, event payloads, interaction responses. Quitting `as any` is hard. We made it mandatory.",
        icon: Braces,
        proof: "0 'as any'",
        wink: "these aren't the casts you're looking for.",
    },
    {
        title: "Ready for the big leagues",
        description:
            "Proven from tiny side projects to multi-million-guild bots. Sharding, presence chunking and raw gateway access come in the box.",
        icon: TrendingUp,
        proof: "1M+ guilds",
    },
    {
        title: "Let the decorators work",
        description:
            "@Declare, @Options, @AutoLoad. No boilerplate, no manual REST calls, no bookkeeping. The decorators clock in so you don't have to.",
        icon: AtSign,
        proof: "<60s setup",
    },
    {
        title: "Yours to rebuild",
        description:
            "Custom cache, custom REST, custom client. Swap any piece the day you need it to behave differently. We won't take it personally.",
        icon: Blocks,
        proof: "100% hackable",
        wink: "no information is lost in our cache. take that, Hawking.",
    },
    {
        title: "Updates on day one",
        description:
            "Threads, components v2, polls, interactions — there to use the same day Discord ships them, not a release later.",
        icon: Zap,
        proof: "Day-1 support",
        wink: "unlike half-life 3.",
    },
    {
        // the classic site closed this grid with "And more... actually I got
        // out of ideas" — this cell carries that torch
        title: "And a whole ecosystem",
        description:
            "Official plugins: Redis cache, uWS gateway, cooldowns — drop in what fits, swap what doesn't. And honestly, we ran out of room here.",
        icon: Package,
        proof: "Redis · uWS · +",
    },
];

export function FeaturesSectionWithHoverEffects() {
    return (
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
            {/* masthead — left rail, sticky like the toolkit's */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <ArmLabel index="01" name="Capabilities" />
                <h2 className="max-w-lg text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.02em]">
                    Everything you need to{" "}
                    <span className="text-[var(--brand-indigo)]">ship</span>
                </h2>
                <p className="max-w-[42ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
                    Each line ships with a receipt. No refunds — you
                    won&apos;t be needing one.
                </p>
            </div>

            {/* the manifest — instrument rows, same voice as the luminosity
                readout: hairlines, mono annotations, no boxes */}
            <div className="flex flex-col lg:col-span-8 lg:col-start-5">
                {FEATURES.map((feature, index) => (
                    <FeatureRow key={feature.title} {...feature} index={index} />
                ))}
            </div>
        </section>
    );
}

const FeatureRow = ({
    title,
    description,
    icon: Icon,
    proof,
    wink,
    index,
}: Feature & { index: number }) => {
    const num = String(index + 1).padStart(2, "0");
    return (
        <div
            title={wink}
            className="group grid grid-cols-[2.5rem_1.75rem_1fr] items-start gap-x-4 gap-y-3 border-b border-white/8 px-5 py-6 transition-colors duration-200 first:border-t hover:bg-white/[0.02] sm:grid-cols-[3rem_2rem_1fr_auto]"
        >
            {/* mono index — the annotation voice */}
            <span
                className={`${GeistMono.className} pt-1 text-[10px] tracking-[0.2em] text-[var(--text-dim)]/60 transition-colors duration-200 group-hover:text-[var(--brand-indigo)]`}
            >
                F-{num}
            </span>

            {/* bare icon, no box */}
            <Icon
                aria-hidden
                className="mt-0.5 size-[18px] text-[var(--text-dim)] transition-colors duration-200 group-hover:text-[var(--brand-indigo)]"
            />

            <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-semibold leading-tight tracking-[-0.01em] text-[var(--text-bright)]">
                    {title}
                </h3>
                <p className="max-w-[52ch] text-[15px] leading-relaxed text-[var(--text-dim)]">
                    {description}
                </p>
            </div>

            {/* proof — right-aligned receipt; wraps under the text on mobile */}
            <div className="col-start-3 flex items-center gap-2.5 sm:col-start-4 sm:justify-end sm:pt-1">
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center border border-[var(--brand-indigo)]/50 text-[9px] font-bold text-[var(--brand-indigo)]">
                    ✓
                </span>
                <span
                    className={`${GeistMono.className} whitespace-nowrap text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]`}
                >
                    {proof}
                </span>
            </div>
        </div>
    );
};
