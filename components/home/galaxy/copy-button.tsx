"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

// Tiny copy affordance shared by the install pill and the editor cards.
// The copy icon swaps to a check for 1.6s after a successful write. Dim,
// brightening on hover; the only client island these sections need.
export function CopyButton({
    text,
    label = "copy",
    className,
}: {
    text: string;
    /** Accessible label, e.g. "copy install command". */
    label?: string;
    className?: string;
}) {
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            return; // clipboard blocked — fail quietly, no false ✓
        }
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1600);
    }, [text]);

    return (
        <button
            type="button"
            onClick={onCopy}
            aria-label={copied ? "copied" : label}
            data-copied={copied || undefined}
            className={cn(
                GeistMono.className,
                // -m/p pair: the icon stays small but the hit area grows to
                // at least 44px, without enlarging the icon.
                "-m-3 inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center p-3 text-[11px] leading-none tracking-[0.1em] text-[var(--text-dim)]/70 transition-colors duration-200 hover:text-[var(--text-bright)] focus-visible:text-[var(--text-bright)] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--brand-indigo)] data-[copied]:text-[var(--brand-indigo)]",
                className,
            )}
        >
            {/* icon only — the aria-label carries the words. Both glyphs stay
                stacked in one grid cell; t-icon-swap cross-fades them. */}
            <span aria-hidden className="t-icon-swap leading-none" data-state={copied ? "b" : "a"}>
                <Copy className="t-icon size-4" data-icon="a" />
                <Check className="t-icon size-4" data-icon="b" />
            </span>
            {/* announce the async success to screen readers */}
            <span role="status" className="sr-only">
                {copied ? "Copied" : ""}
            </span>
        </button>
    );
}
