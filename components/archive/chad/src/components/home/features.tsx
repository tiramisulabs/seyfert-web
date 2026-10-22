import { cn } from "@/lib/utils";
import { GradientItalic, SectionHeading } from "@/components/archive/chad/src/components/home/gradient-italic";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Typescript01Icon,
    ChartIncreaseIcon,
    SmileIcon,
    CustomizeIcon,
    DiscordIcon,
    PlusSignSquareIcon,
} from "@hugeicons/core-free-icons";

type Feature = {
    title: string;
    description: string;
    icon: React.ReactNode;
    proof: string;
};

export function FeaturesSectionWithHoverEffects() {
    const features: Feature[] = [
        {
            title: "TypeScript Maxxing",
            description:
                "Inference everywhere. Command options, event payloads, interaction responses — all typed end-to-end. Never write `as any` again.",
            icon: <HugeiconsIcon icon={Typescript01Icon} className="w-6! h-6!" />,
            proof: "0 'as any'",
        },
        {
            title: "Built to Lift Heavy",
            description:
                "Battle-tested on tiny bots and 7-figure guild monsters. Sharding, presence chunking, raw gateway access — pick your reps.",
            icon: <HugeiconsIcon icon={ChartIncreaseIcon} className="w-6! h-6!" />,
            proof: "1M+ Guilds",
        },
        {
            title: "Decorators Do the Work",
            description:
                "@Declare, @Options, @AutoLoad. No registration boilerplate, no manual REST.put, no slash command bookkeeping.",
            icon: <HugeiconsIcon icon={SmileIcon} className="w-6! h-6!" />,
            proof: "<60s Setup",
        },
        {
            title: "Hackable to the Bone",
            description:
                "Custom cache, custom REST, custom client. Every layer is replaceable — if you need to flex on the framework itself, go ahead.",
            icon: <HugeiconsIcon icon={CustomizeIcon} className="w-6! h-6!" />,
            proof: "100% Hackable",
        },
        {
            title: "Day-1 Discord Updates",
            description:
                "Threads, components v2, polls, interactions — supported the day Discord ships. Virgin frameworks read the changelog, Chads read the diff.",
            icon: <HugeiconsIcon icon={DiscordIcon} className="w-6! h-6!" />,
            proof: "Day-1 Support",
        },
        {
            title: "Adapter Maxxing",
            description:
                "Official adapters drop in: Redis cache, uWS gateway, cooldown system. Modular gains — pick your stack, leave the bloat.",
            icon: <HugeiconsIcon icon={PlusSignSquareIcon} className="w-6! h-6!" />,
            proof: "Redis · uWS · +",
        },
    ];
    return (
        <section className="flex flex-col gap-10 items-center py-12 relative">
            {/* Header */}
            <div className="text-center max-w-3xl">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-white/15 bg-white/5">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-300 font-mono">
                        // The Arsenal
                    </span>
                </div>
                <SectionHeading>
                    Forged <GradientItalic variant="gold">for Chads.</GradientItalic>
                </SectionHeading>
                <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                    No marketing fluff. Real features, real APIs, zero excuses.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full gap-[2px] bg-white/10">
                {features.map((feature, index) => (
                    <BrutalFeature key={index} {...feature} index={index} />
                ))}
            </div>
        </section>
    );
}

const BrutalFeature = ({
    title,
    description,
    icon,
    proof,
    index,
}: Feature & { index: number }) => {
    const num = String(index + 1).padStart(2, "0");
    return (
        <div
            className={cn(
                "group relative flex flex-col bg-[#0a0a0a] p-7 min-h-[260px]",
                "transition-colors duration-200 hover:bg-white/[0.03]"
            )}
        >
            {/* Hover diagonal stripes overlay */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{
                    background:
                        "repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(255,255,255,0.02) 8px, rgba(255,255,255,0.02) 16px)",
                }}
            />

            {/* Top label row */}
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-600">
                        // F-{num}
                    </span>
                </div>
                <div className="flex items-center justify-center w-10 h-10 border border-white/20 text-white/80 group-hover:border-white/60 group-hover:text-white transition-colors">
                    {icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-black uppercase tracking-tight leading-tight text-white mb-3 relative z-10">
                {title}
            </h3>

            {/* Description */}
            <p className="text-sm text-zinc-500 leading-relaxed mb-6 flex-1 relative z-10">
                {description}
            </p>

            {/* Proof footer */}
            <div className="flex items-center gap-2 pt-4 border-t border-white/10 relative z-10">
                <span className="inline-flex items-center justify-center w-4 h-4 border border-white/40 text-white/80 text-[9px] font-black">
                    ✓
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-white/70">
                    {proof}
                </span>
            </div>

            {/* Big shadow number in corner */}
            <span
                aria-hidden="true"
                className="absolute bottom-1 right-2 text-7xl font-black leading-none text-white/[0.04] select-none pointer-events-none"
            >
                {num}
            </span>
        </div>
    );
};
