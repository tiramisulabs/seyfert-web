import type { Metadata } from "next";

// Every landing seyfert.dev has shipped or seriously proposed, oldest first.
// One entry per design direction: refinements of the same idea are folded
// into the snapshot that represents it. `source` is the commit each route is
// rebuilt from; `span` is the commit range the direction lived through.

export type DesignEntry = {
    slug: string;
    href: string;
    name: string;
    era: string;
    /** ISO date of the representative snapshot */
    date: string;
    status: "shipped" | "proposal" | "live";
    idea: string;
    source: { commit: string; note: string };
    span: string;
    /** 16:10 capture of the route at 1440×900 (dark scheme), in /public/designs */
    preview: string;
};

const REPO = "https://github.com/tiramisulabs/seyfert-web";
export const commitUrl = (commit: string) => `${REPO}/commit/${commit}`;

export const designs: DesignEntry[] = [
    {
        slug: "original",
        href: "/original",
        name: "Satisfies",
        era: "June 2024",
        date: "2024-06-14",
        status: "shipped",
        idea: "The first page: one pitch, three icon promises and a terminal admitting the CLI wasn't ready yet.",
        source: { commit: "b5ddcce", note: "PandaCSS page, responsive pass on 368b8ac" },
        span: "368b8ac → b5ddcce",
        preview: "/designs/original.webp",
    },
    {
        slug: "v2",
        href: "/v2",
        name: "Satisfies v2",
        era: "Aug 2024 – Jan 2025",
        date: "2025-01-20",
        status: "shipped",
        idea: "The v2 launch site: memory bars beside the hero, feature cards, bots that switched, and the haters wall.",
        source: { commit: "6c3b533", note: "last commit before the Fumadocs rewrite" },
        span: "163f71a → 6c3b533",
        preview: "/designs/v2.webp",
    },
    {
        slug: "classic",
        href: "/classic",
        name: "Starry",
        era: "Feb 2025 – Feb 2026",
        date: "2026-02-13",
        status: "shipped",
        idea: "The Fumadocs-era landing: a shader starfield, a spotlight, gradient type and a marquee of bots.",
        source: { commit: "48dfd0a", note: "v4.2 release, last state before the redesigns" },
        span: "0ed5ea4 → 48dfd0a",
        preview: "/designs/classic.webp",
    },
    {
        slug: "chad",
        href: "/chad",
        name: "Brutalist",
        era: "May 2026",
        date: "2026-05-23",
        status: "shipped",
        idea: "Loud and self-aware: virgin vs chad, a code fight, a migration cope checklist and grain on pure black.",
        source: { commit: "bbdfb03", note: "polish round; later kept as the ?chad easter egg" },
        span: "4e84a58 → bbdfb03",
        preview: "/designs/chad.webp",
    },
    {
        slug: "spiral",
        href: "/spiral",
        name: "Spiral",
        era: "June 2026",
        date: "2026-06-10",
        status: "shipped",
        idea: "Editorial astronomy: copy on the left, a raymarched Gargantua black hole on the right, observatory sections below.",
        source: { commit: "509cf65", note: "bloom, mobile and perf pass — last state before Cygnus" },
        span: "8c539de → 509cf65",
        preview: "/designs/spiral.webp",
    },
    {
        slug: "cygnus",
        href: "/cygnus",
        name: "Cygnus",
        era: "June 2026 – now",
        date: "2026-07-11",
        status: "live",
        idea: "The current home: a centered black hole, the lit-metal wordmark and the Artemis swoosh.",
        source: { commit: "f3bcdd1", note: "today's components, unchanged" },
        span: "e5b818d → d2a5828",
        preview: "/designs/cygnus.webp",
    },
    {
        slug: "journey",
        href: "/journey",
        name: "Journey",
        era: "Oct 2026",
        date: "2026-10-18",
        status: "proposal",
        idea: "Follow one /echo from the gateway through Seyfert's rings into the core and back out as a reply.",
        source: { commit: "c98a8f4", note: "PR #40, first version" },
        span: "c98a8f4",
        preview: "/designs/journey.webp",
    },
    {
        slug: "journey-refined",
        href: "/journey-refined",
        name: "Journey, refined",
        era: "Oct 2026",
        date: "2026-10-18",
        status: "proposal",
        idea: "The same journey, calmer: centered hero, the full annotated echo.ts at the core, compact stages.",
        source: { commit: "c98a8f4", note: "review iteration on top of PR #40" },
        span: "c98a8f4 + refinement",
        preview: "/designs/journey-refined.webp",
    },
    {
        slug: "reveal",
        href: "/reveal",
        name: "Reveal",
        era: "Oct 2026",
        date: "2026-10-18",
        status: "proposal",
        idea: "A trailer you scroll: through the SEYFERT wordmark into the hole, then pinned chapters that build, strike out and count.",
        source: { commit: "f3bcdd1", note: "PR #40, plus first-load, scroll and wordmark refinements" },
        span: "f3bcdd1 + refinement",
        preview: "/designs/reveal.webp",
    },
];

export function getDesign(slug: string): DesignEntry {
    const entry = designs.find((d) => d.slug === slug);
    if (!entry) throw new Error(`unknown design "${slug}"`);
    return entry;
}

// Archived landings carry claims (versions, numbers, links) from their time;
// keep them out of search results so they aren't read as current.
export function archiveMetadata(slug: string, title?: string): Metadata {
    const d = getDesign(slug);
    return {
        title: title ?? `Seyfert | ${d.name} (${d.era})`,
        robots: { index: false, follow: true },
    };
}
