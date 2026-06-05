import { cn } from "@/lib/utils";
import { GeistMono } from "geist/font/mono";
import { AtSign, Blocks, Braces, Package, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { ArmLabel } from "./arm-label";

// Capabilities — the cell anatomy of the original site's grid (// F-0N
// annotation, boxed icon, proof metric with a ✓, ghost number) wearing the
// observatory skin: Geist semibold titles, brand-indigo accents, serious copy.

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
        <section className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
                <ArmLabel index="01" name="Capabilities" />
                <h2 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-[-0.02em]">
                    Everything you need to{" "}
                    <span className="text-[var(--brand-indigo)]">ship</span>
                </h2>
            </div>

            <div className="grid w-full grid-cols-1 gap-px bg-white/8 md:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((feature, index) => (
                    <FeatureCell key={feature.title} {...feature} index={index} />
                ))}
            </div>
        </section>
    );
}

const FeatureCell = ({
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
            className={cn(
                "group relative flex min-h-[240px] flex-col bg-[var(--space-void)] p-7",
                "transition-colors duration-200 hover:bg-white/[0.02]"
            )}
        >
            {/* top row: annotation + boxed icon */}
            <div className="relative z-10 mb-6 flex items-center justify-between">
                <span className={`${GeistMono.className} text-[10px] uppercase tracking-[0.25em] text-[var(--text-dim)]/70`}>
                    {"// F-"}{num}
                </span>
                <div className="flex h-10 w-10 items-center justify-center border border-white/10 text-[var(--text-dim)] transition-colors duration-200 group-hover:border-[var(--brand-indigo)]/60 group-hover:text-[var(--brand-indigo)]">
                    <Icon className="size-[18px]" aria-hidden />
                </div>
            </div>

            {/* title — observatory voice, not brutal caps */}
            <h3 className="relative z-10 mb-3 text-xl font-semibold leading-tight tracking-[-0.01em] text-[var(--text-bright)]">
                {title}
            </h3>

            <p className="relative z-10 mb-6 flex-1 text-[15px] leading-relaxed text-[var(--text-dim)]">
                {description}
            </p>

            {/* proof footer */}
            <div className="relative z-10 flex items-center gap-2.5 border-t border-white/8 pt-4">
                <span className="inline-flex h-4 w-4 items-center justify-center border border-[var(--brand-indigo)]/50 text-[9px] font-bold text-[var(--brand-indigo)]">
                    ✓
                </span>
                <span className={`${GeistMono.className} text-[10px] uppercase tracking-[0.2em] text-[var(--text-dim)]`}>
                    {proof}
                </span>
            </div>

        </div>
    );
};
