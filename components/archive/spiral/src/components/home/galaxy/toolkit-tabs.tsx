"use client";

import { useRef, useState } from "react";
import { GeistMono } from "geist/font/mono";
import { CopyButton } from "./copy-button";

// Tiny client island for the toolkit section: four pre-rendered shiki panes
// (HTML arrives from the server), this component only swaps which one shows.
// Chrome matches the versus EditorCard so the journey reads as one system.

export interface ToolkitPane {
    id: string;
    /** mono filename shown in the card's top bar */
    file: string;
    /** human tab label */
    label: string;
    /** shiki-rendered HTML */
    html: string;
    /** raw source for the copy button */
    code: string;
    /** one-line mono caption under the card */
    caption: string;
}

export function ToolkitTabs({ panes }: { panes: ToolkitPane[] }) {
    const [active, setActive] = useState(0);
    // slide direction for the t-page-enter animation: moving right in the
    // tab rail slides the pane in from the right, and vice versa
    const prev = useRef(0);
    const dir = active >= prev.current ? 1 : -1;
    prev.current = active;
    const pane = panes[active];

    // full ARIA tabs pattern: arrow keys cycle, Home/End jump
    const onKeyDown = (e: React.KeyboardEvent) => {
        const last = panes.length - 1;
        let next: number | null = null;
        if (e.key === "ArrowRight") next = active === last ? 0 : active + 1;
        else if (e.key === "ArrowLeft") next = active === 0 ? last : active - 1;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = last;
        if (next === null) return;
        e.preventDefault();
        setActive(next);
        (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
    };

    return (
        <div className="flex min-w-0 flex-col gap-3">
            {/* tab rail — mono, instrument-panel voice */}
            <div
                role="tablist"
                aria-label="toolkit examples"
                className="flex flex-wrap gap-x-5 gap-y-2"
            >
                {panes.map((p, i) => (
                    <button
                        key={p.id}
                        id={`toolkit-tab-${p.id}`}
                        role="tab"
                        type="button"
                        aria-selected={i === active}
                        aria-controls={`toolkit-pane-${p.id}`}
                        tabIndex={i === active ? 0 : -1}
                        onClick={() => setActive(i)}
                        onKeyDown={onKeyDown}
                        className={`${GeistMono.className} cursor-pointer touch-manipulation border-b pb-1 text-[11px] uppercase tracking-[0.22em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-indigo)] ${
                            i === active
                                ? "border-[var(--brand-indigo)] text-[var(--text-bright)]"
                                : "border-transparent text-[var(--text-dim)]/70 hover:text-[var(--text-dim)]"
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* keyed remount per pane → t-page-enter slides the card + caption
                 in from the direction of travel (transitions.dev 08, enter half) */}
            <div
                key={pane.id}
                className="t-page-enter flex min-w-0 flex-col gap-3"
                style={{ "--t-page-from-x": `calc(var(--page-slide-distance) * ${dir})` } as React.CSSProperties}
            >
                {/* the editor card — same chrome as the versus cards */}
                <div
                    id={`toolkit-pane-${pane.id}`}
                    role="tabpanel"
                    aria-labelledby={`toolkit-tab-${pane.id}`}
                    className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[var(--space-deep)]/70"
                >
                    <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
                        <span
                            className={`${GeistMono.className} inline-flex items-center gap-2 text-[11px] tracking-[0.15em] text-[var(--text-dim)]`}
                        >
                            <span
                                className="h-1.5 w-1.5 rounded-full bg-[var(--brand-indigo)]/70"
                                aria-hidden
                            />
                            {pane.file}
                        </span>
                        <CopyButton text={pane.code} label={`copy ${pane.file}`} />
                    </div>
                    <div
                        className={`${GeistMono.className} overflow-x-auto px-4 py-4 text-xs leading-relaxed sm:text-[13px] [&_code]:!bg-transparent [&_pre]:!bg-transparent [&_pre]:!outline-none`}
                        dangerouslySetInnerHTML={{ __html: pane.html }}
                    />
                </div>

                <p
                    className={`${GeistMono.className} px-1 text-[10px] uppercase leading-relaxed tracking-[0.18em] text-[var(--text-dim)]/55`}
                >
                    {pane.caption}
                </p>
            </div>
        </div>
    );
}
