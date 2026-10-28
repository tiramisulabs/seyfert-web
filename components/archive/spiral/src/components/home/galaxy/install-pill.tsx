import { GeistMono } from "geist/font/mono";
import { CopyButton } from "./copy-button";

// The conversion one-liner, Bun-style: repeated at every peak-intent beat
// (hero, post-versus, post-bench, finale) so the moment a skeptic is sold,
// the install command is already under their cursor. Server component —
// CopyButton is the only client island inside.
export function InstallPill({ className = "" }: { className?: string }) {
    return (
        <div
            title="it's dangerous to go alone — take this."
            className={`flex w-fit items-center gap-3 rounded-md border border-white/10 bg-[var(--space-deep)]/70 px-3.5 py-2.5 ${className}`}
        >
            <span
                className={`${GeistMono.className} select-none text-[13px] leading-none text-[var(--text-dim)]/50`}
                aria-hidden
            >
                $
            </span>
            <code
                translate="no"
                className={`${GeistMono.className} text-[13px] leading-none text-[var(--text-bright)]`}
            >
                npm i seyfert
            </code>
            <CopyButton text="npm i seyfert" label="copy install command" />
        </div>
    );
}
