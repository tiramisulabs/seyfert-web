import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { ArrowUpRight } from "lucide-react";
import { commitUrl, designs, type DesignEntry } from "@/lib/design-archive";

// An unlisted catalog of past and proposed landings. Static previews keep
// the archive light; each design loads only when opened.
export const metadata: Metadata = {
    title: "Seyfert | Every landing, 2024 to now",
    description: "Every design seyfert.dev has shipped or proposed, each one live at its own route.",
    robots: { index: false, follow: true },
};

const mono = GeistMono.className;

const statusLabel: Record<DesignEntry["status"], string> = {
    shipped: "Shipped",
    live: "Live today",
    proposal: "Proposal",
};

function Plate({ d, index }: { d: DesignEntry; index: number }) {
    return (
        <li className="group relative flex min-w-0 flex-col">
            <Link
                href={d.href}
                className="relative block overflow-hidden rounded-[6px] border border-white/10 bg-[#0c0c0e] outline-none transition-colors group-hover:border-white/25 focus-visible:ring-2 focus-visible:ring-white/70"
            >
                <Image
                    src={d.preview}
                    alt={`${d.name}, the ${d.era} landing`}
                    width={1152}
                    height={720}
                    sizes="(min-width: 1280px) 400px, (min-width: 768px) 46vw, 92vw"
                    className="aspect-[16/10] h-auto w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
                    priority={index < 3}
                />
                <span className="sr-only">Open {d.name}</span>
            </Link>

            <div className="mt-4 flex min-w-0 items-baseline justify-between gap-3">
                <h2 className="min-w-0 truncate text-[19px] font-semibold tracking-[-0.01em] text-white">
                    <Link href={d.href} className="hover:underline hover:underline-offset-4">
                        {d.name}
                    </Link>
                </h2>
                <span
                    className={`${mono} shrink-0 text-[11px] uppercase tracking-[0.14em] ${
                        d.status === "proposal" ? "text-[#f2d7a6]" : d.status === "live" ? "text-[#a5b4fc]" : "text-white/45"
                    }`}
                >
                    {statusLabel[d.status]}
                </span>
            </div>
            <p className={`${mono} mt-1 text-[11.5px] tracking-[0.04em] text-white/45`}>{d.era}</p>
            <p className="mt-3 text-[14.5px] leading-[1.55] text-white/70">{d.idea}</p>

            <div className={`${mono} mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-white/45`}>
                <Link href={d.href} className="text-white/85 hover:text-white">
                    {d.href}
                </Link>
                <a
                    href={commitUrl(d.source.commit)}
                    target="_blank"
                    rel="noreferrer"
                    title={d.source.note}
                    className="inline-flex items-center gap-0.5 hover:text-white/80"
                >
                    from {d.source.commit}
                    <ArrowUpRight className="size-3" aria-hidden />
                </a>
            </div>
        </li>
    );
}

export default function Archive() {
    const shipped = designs.filter((d) => d.status !== "proposal");
    const proposals = designs.filter((d) => d.status === "proposal");
    return (
        <>
            <main className="mx-auto w-full max-w-[1320px] px-5 pt-16 pb-28 sm:px-8 sm:pt-24">
                <header className="max-w-[46rem]">
                    <p className={`${mono} text-[11px] uppercase tracking-[0.22em] text-white/45`}>
                        seyfert.dev · design archive
                    </p>
                    <h1 className="mt-5 text-balance text-[clamp(2.25rem,5vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                        Every landing, from 2024 to now.
                    </h1>
                    <p className="mt-6 max-w-[38rem] text-[16px] leading-[1.6] text-white/65">
                        Each design Seyfert has shipped or put up for review, rebuilt from its own commit and running
                        at its own address. Older pages keep the versions, numbers and links of their time.
                    </p>
                    <p className="mt-6 text-[14px] text-white/55">
                        Looking for the framework?{" "}
                        <Link href="/docs/learn/getting-started" className="text-white underline underline-offset-4 hover:text-white/80">
                            Read the docs
                        </Link>
                    </p>
                </header>

                <section aria-labelledby="shipped" className="mt-20">
                    <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
                        <h2 id="shipped" className={`${mono} text-[11px] uppercase tracking-[0.22em] text-white/55`}>
                            Shipped, in order
                        </h2>
                        <span className={`${mono} text-[11px] text-white/35`}>2024 → 2026</span>
                    </div>
                    <ol className="mt-8 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
                        {shipped.map((d, i) => (
                            <Plate key={d.slug} d={d} index={i} />
                        ))}
                    </ol>
                </section>

                <section aria-labelledby="proposals" className="mt-24">
                    <div className="flex items-baseline justify-between border-t border-white/10 pt-4">
                        <h2 id="proposals" className={`${mono} text-[11px] uppercase tracking-[0.22em] text-white/55`}>
                            Proposals under review
                        </h2>
                        <span className={`${mono} text-[11px] text-white/35`}>Oct 2026</span>
                    </div>
                    <ol className="mt-8 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 xl:grid-cols-3">
                        {proposals.map((d, i) => (
                            <Plate key={d.slug} d={d} index={shipped.length + i} />
                        ))}
                    </ol>
                </section>
            </main>
        </>
    );
}
