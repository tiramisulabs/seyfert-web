import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";

// Capabilities, published as an index table — the way an observatory lists the
// instruments on its dome. No cards, no icons: six numbered entries, hairline
// ruled, that emphasise on hover rather than lift. Pure CSS hover state, so this
// stays a server component; the section's whileInView reveal lives in the parent.

type Capability = {
    title: string;
    description: string;
};

const CAPABILITIES: Capability[] = [
    {
        title: "Written in TypeScript",
        description:
            "Seyfert is written in TypeScript, so you can enjoy the benefits of type safety.",
    },
    {
        title: "Scalable",
        description:
            "Seyfert is tested on both big and small bots and there were perfect performance results on both of them..",
    },
    {
        title: "Effortless Development",
        description:
            "Developer experience is at the core of Seyfert, with a focus on easy setup to only worry about your bot's logic.",
    },
    {
        title: "Full customization",
        description:
            "Seyfert makes customization easier, you can customize each aspect of seyfert if you need specific behavior.",
    },
    {
        title: "Latest Features",
        description:
            "Seyfert is always up to date with the latest features of Discord.",
    },
    {
        title: "And more...",
        description:
            "Actually I got out of ideas for this section, but I'm sure there are more features.",
    },
];

export function FeaturesSectionWithHoverEffects() {
    return (
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-16">
            {/* left rail — the section's masthead, offset and sticky on desktop */}
            <div className="flex flex-col gap-6 lg:col-span-4 lg:sticky lg:top-28 lg:self-start">
                <ArmLabel index="01" name="Capabilities" />
                <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--text-bright)]">
                    Everything you need to{" "}
                    <span className="animate-text-gradient bg-gradient-to-r from-indigo-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">ship</span>
                </h2>
                <p
                    className={`${GeistMono.className} max-w-[22ch] text-[10px] uppercase leading-relaxed tracking-[0.2em] text-[var(--text-dim)]`}
                >
                    Six entries, logged.
                </p>
            </div>

            {/* right column — the index table */}
            <div className="lg:col-span-8 lg:col-start-5">
                <ol className="border-t border-white/8">
                    {CAPABILITIES.map((cap, i) => (
                        <IndexRow key={cap.title} index={i} {...cap} />
                    ))}
                </ol>
            </div>
        </section>
    );
}

function IndexRow({
    title,
    description,
    index,
}: Capability & { index: number }) {
    const num = String(index + 1).padStart(2, "0");

    return (
        <li className="group/row relative border-b border-white/8">
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 py-7 sm:gap-x-10 sm:py-8">
                {/* oversized ghosted index — brightens to a quiet amber on hover */}
                <span
                    className={`${GeistMono.className} select-none text-3xl font-medium leading-none tabular-nums text-white/[0.06] transition-colors duration-300 group-hover/row:text-[var(--brand-indigo)]/50 sm:text-4xl`}
                    aria-hidden
                >
                    {num}
                </span>

                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold leading-tight tracking-[-0.01em] text-[var(--text-bright)] sm:text-xl">
                        {title}
                    </h3>
                    {/* description sits dim by default, lifts to full read on hover/focus */}
                    <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]/60 transition-colors duration-300 group-hover/row:text-[var(--text-dim)]">
                        {description}
                    </p>
                </div>
            </div>

            {/* coordinate tick — a hairline mark that grows from the row's left edge */}
            <span
                className="pointer-events-none absolute left-0 top-0 h-px w-0 bg-[var(--brand-indigo)]/60 transition-all duration-300 group-hover/row:w-10"
                aria-hidden
            />
        </li>
    );
}
