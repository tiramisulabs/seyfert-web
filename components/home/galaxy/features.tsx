import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";

// Capabilities, published as an index table — the way an observatory lists the
// instruments on its dome. No cards, no icons: six numbered entries, hairline
// ruled, that emphasise on hover rather than lift. Each row links to the guide
// page that backs it. Pure CSS hover state, so this stays a server component;
// the section's whileInView reveal lives in the parent.

type Capability = {
    title: string;
    description: string;
    href: string;
};

const CAPABILITIES: Capability[] = [
    {
        title: "Options typed end to end",
        description:
            "createStringOption and friends feed CommandContext<typeof options>, so ctx.options infers every choice, autocomplete and value as the literal type you declared.",
        href: "/guide/commands/options",
    },
    {
        title: "Component and modal collectors",
        description:
            "message.createComponentCollector scopes interactions to one message with a filter, idle timeout and onStop refresh — and modals attach a handler via .run().",
        href: "/guide/components/collectors",
    },
    {
        title: "Gateway and HTTP from one config",
        description:
            "config.bot runs a websocket Client while config.http serves interactions over a webhook — the same commands, components and i18n load behind either entry point.",
        href: "/guide/getting-started/setup-project",
    },
    {
        title: "Sharding handled internally",
        description:
            "the Client shards for you by default; switch WorkerManager mode between 'threads' and 'cluster' to spread shards across CPU threads or processes without restructuring your project.",
        href: "/guide/recipes/sharding",
    },
    {
        title: "Cache you control",
        description:
            "client.setServices disables resources individually or wholesale, filters what each resource stores, and swaps the MemoryAdapter for Redis or your own Adapter implementation.",
        href: "/guide/recipes/cache",
    },
    {
        title: "Components v2 built in",
        description:
            "Container, Section, MediaGallery, File and Separator builders compose Discord's v2 component layouts with the same typed, chainable API as buttons and modals.",
        href: "/guide/components/v2",
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
                    <span className="text-[var(--brand-indigo)]">ship</span>
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
    href,
    index,
}: Capability & { index: number }) {
    const num = String(index + 1).padStart(2, "0");

    return (
        <li className="group/row relative border-b border-white/8">
            <Link
                href={href}
                className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 py-7 sm:gap-x-10 sm:py-8"
            >
                {/* oversized ghosted index — brightens to indigo on hover */}
                <span
                    className={`${GeistMono.className} select-none text-3xl font-medium leading-none tabular-nums text-white/[0.06] transition-colors duration-300 group-hover/row:text-[var(--brand-indigo)]/50 sm:text-4xl`}
                    aria-hidden
                >
                    {num}
                </span>

                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold leading-tight tracking-[-0.01em] text-[var(--text-bright)] underline-offset-4 group-hover/row:underline sm:text-xl">
                        {title}
                    </h3>
                    {/* description sits dim by default, lifts to full read on hover/focus */}
                    <p className="max-w-md text-[15px] leading-relaxed text-[var(--text-dim)]/60 transition-colors duration-300 group-hover/row:text-[var(--text-dim)]">
                        {description}
                    </p>
                </div>
            </Link>

            {/* coordinate tick — a hairline mark that grows from the row's left edge */}
            <span
                className="pointer-events-none absolute left-0 top-0 h-px w-0 bg-[var(--brand-indigo)]/60 transition-all duration-300 group-hover/row:w-10"
                aria-hidden
            />
        </li>
    );
}
