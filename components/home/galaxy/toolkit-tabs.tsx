"use client";

import { useState } from "react";
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
    const pane = panes[active];

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
                        role="tab"
                        type="button"
                        aria-selected={i === active}
                        onClick={() => setActive(i)}
                        className={`${GeistMono.className} cursor-pointer border-b pb-1 text-[11px] uppercase tracking-[0.22em] transition-colors duration-200 focus-visible:outline-none ${
                            i === active
                                ? "border-[var(--brand-indigo)] text-[var(--text-bright)]"
                                : "border-transparent text-[var(--text-dim)]/70 hover:text-[var(--text-dim)]"
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* the editor card — same chrome as the versus cards */}
            <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[var(--space-deep)]/70">
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
                    className={`${GeistMono.className} overflow-x-auto px-4 py-4 text-[13px] leading-relaxed [&_code]:!bg-transparent [&_pre]:!bg-transparent [&_pre]:!outline-none`}
                    dangerouslySetInnerHTML={{ __html: pane.html }}
                />
            </div>

            <p
                className={`${GeistMono.className} px-1 text-[10px] uppercase leading-relaxed tracking-[0.18em] text-[var(--text-dim)]/55`}
            >
                {pane.caption}
            </p>
        </div>
    );
}
