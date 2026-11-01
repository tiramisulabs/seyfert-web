"use client";

import { useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { GeistMono } from "geist/font/mono";

// One demo on the gallery page: a mono label, where the demo would live, and
// a Replay that remounts it at its story boundary (the kit has no imperative
// replay). The stage is the shot; nothing frames it here.
export function DemoFrame({ id, index, title, where, children }: { id: string; index: number; title: string; where: string; children: ReactNode }) {
    const [run, setRun] = useState(0);
    return (
        <section id={id} aria-label={title} className="flex scroll-mt-24 flex-col gap-5">
            <div className={`${GeistMono.className} flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-[11.5px] tracking-[0.04em]`}>
                <span className="text-[var(--text-bright)]">
                    <span className="text-[#ffd9a0]">{String(index).padStart(2, "0")}</span> · {title}
                </span>
                <span className="flex items-center gap-5 text-[var(--text-dim)]">
                    <span>{where}</span>
                    <button
                        type="button"
                        onClick={() => setRun((n) => n + 1)}
                        className="inline-flex min-h-9 items-center gap-1.5 text-[var(--text-dim)] hover:text-[var(--text-bright)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                        <RotateCcw aria-hidden className="size-3.5" />
                        Replay
                    </button>
                </span>
            </div>
            <div key={run}>{children}</div>
        </section>
    );
}
