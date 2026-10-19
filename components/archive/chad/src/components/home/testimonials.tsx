import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { GradientItalic, SectionHeading } from "@/components/archive/chad/src/components/home/gradient-italic";
import { cn } from "@/lib/utils"

const testimonials = [
    {
        name: "Socram09",
        review: "Migrated 12 commands in an afternoon. Decorators replaced 600 lines of registration boilerplate. that library that ends in .js could never.",
        avatar: "/avatars/socram09.png"
    },
    {
        name: "MARCROCK22",
        review: "The docs actually explain things. Examples for every API. Wild concept for a Discord framework in 2026.",
        avatar: "/avatars/marcrock22.png"
    },
    {
        name: "FreeAoi",
        review: "Switched from that library that ends in .js. Bot got jacked overnight — now bench presses 50k guilds on a 512MB container. No notes.",
        avatar: "/avatars/freeaoi.png"
    },
    {
        name: "Deivid",
        review: "RAM dropped from 3.8 GB to 600 MB after porting. Same bot, same features. Felt like deleting a tumor.",
        avatar: "/avatars/deivid.png"
    },
    {
        name: "JustEvil",
        review: "Inference reaches into nested option objects. Auto-complete on subcommand args. I'm not going back.",
        avatar: "/avatars/justevil.png"
    },
    {
        name: "Miia",
        review: "uWS adapter + Redis cache and my shards stopped sweating. Latency cut in half. Built Different.",
        avatar: "/avatars/miia.png"
    }
]

export function Testimonials() {
    return (
        <section className="flex flex-col py-12 gap-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 border border-white/15 bg-white/5">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-300 font-mono">
                        // The Witnesses
                    </span>
                </div>
                <SectionHeading>
                    Some of the{" "}
                    <GradientItalic variant="green">Chadest devs</GradientItalic> in our
                    community
                </SectionHeading>
                <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
                    From devs shipping real bots. Verified W&apos;s only.
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-white/10">
                {testimonials.map((t, index) => (
                    <BrutalReview
                        key={index}
                        index={index}
                        name={t.name}
                        review={t.review}
                        avatar={t.avatar}
                    />
                ))}
            </div>
        </section>
    )
}

function BrutalReview({
    name,
    review,
    avatar,
    index,
}: {
    name: string;
    review: string;
    avatar: string;
    index: number;
}) {
    const num = String(index + 1).padStart(2, "0");
    return (
        <div
            className={cn(
                "group relative flex flex-col bg-[#0a0a0a] p-6 min-h-[240px]",
                "transition-colors duration-200 hover:bg-white/[0.03]"
            )}
        >
            {/* Top label row */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-[0.25em] font-mono font-bold text-zinc-600">
                    // Review N°{num}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-white/60 px-1.5 py-0.5 border border-white/20">
                    Verified Chad
                </span>
            </div>

            {/* Quote mark */}
            <span
                aria-hidden="true"
                className="absolute top-2 right-3 text-6xl leading-none font-black text-white/[0.06] select-none pointer-events-none"
            >
                &ldquo;
            </span>

            {/* Review text */}
            <p className="text-sm leading-relaxed text-zinc-200 mb-6 flex-1 relative">
                {review}
            </p>

            {/* Author footer */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <Avatar className="w-10 h-10 rounded-none border border-white/20">
                    <AvatarImage src={avatar} className="rounded-none grayscale group-hover:grayscale-0 transition-all" />
                    <AvatarFallback className="rounded-none bg-white/5 text-white">
                        {name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-black text-sm uppercase tracking-wide leading-none text-white">
                        {name}
                    </p>
                    <p className="text-zinc-600 text-[11px] font-mono mt-1">
                        @{name.toLowerCase()}
                    </p>
                </div>
            </div>
        </div>
    );
}
