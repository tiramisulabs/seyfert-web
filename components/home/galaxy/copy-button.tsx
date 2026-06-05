"use client";

import { useCallback, useRef, useState } from "react";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

// Tiny copy affordance shared by the install pill and the editor cards.
// No icon lib — ⧉ swaps to ✓ for 1.6s after a successful write. Mono, dim,
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
                "inline-flex items-center text-[11px] leading-none tracking-[0.1em] text-[var(--text-dim)]/70 transition-colors duration-200 hover:text-[var(--text-bright)] focus-visible:text-[var(--text-bright)] focus-visible:outline-none data-[copied]:text-[var(--brand-indigo)]",
                className,
            )}
        >
            {/* icon only — the aria-label carries the words */}
            <span aria-hidden className="text-[13px] leading-none">
                {copied ? "✓" : "⧉"}
            </span>
        </button>
    );
}
