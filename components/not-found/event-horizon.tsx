"use client";

import { useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

const mono = GeistMono.className;
const MAX_PATH = 40;

// The address that was asked for. The 404 is prerendered once (as
// /_not-found), so it can't come from the server or usePathname: the server
// HTML has no address and the client fills it in after hydrating.
function subscribeNever() {
    return () => {};
}
function readAddress() {
    try {
        return decodeURIComponent(location.pathname);
    } catch {
        return location.pathname;
    }
}
function useAddress() {
    return useSyncExternalStore(subscribeNever, readAddress, () => null);
}

// The 404 as a scene: the 0 is the Reveal's black hole, and the address that
// led nowhere sits under it until it falls in, one character at a time,
// stretched on the way down. Clicking the hole puts it back to fall again.
//
// Each character's start is its place in the line, relative to the centre of
// the hole (--x, --y); global.css turns that into polar coordinates with
// atan2() and hypot(), so the fall is a spiral computed by the browser, not
// by measuring the page. Reduced motion keeps the line where it is.
export function EventHorizon() {
    const path = useAddress();
    const shown = path === null ? "" : path.length > MAX_PATH ? `…${path.slice(-(MAX_PATH - 1))}` : path;
    const [drop, setDrop] = useState(0);
    const chars = [...shown];
    const mid = (chars.length - 1) / 2;
    // nearest the middle falls first, outwards from there
    const order = chars.map((_, i) => i).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
    const rank = new Map(order.map((index, r) => [index, r]));

    return (
        <div className="nf-scene flex flex-col items-center">
            <div aria-hidden className="nf-digits relative flex items-center font-semibold leading-none tracking-[-0.04em] text-[var(--core-white)]">
                <span className="relative z-10">4</span>
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setDrop((d) => d + 1)}
                    className="nf-hole relative shrink-0 cursor-pointer"
                    title="Drop it again"
                >
                    <span className="nf-hole-photo absolute inset-0" />
                    <span key={drop} className={cn(mono, "nf-path absolute left-1/2 top-1/2 text-[15px] font-normal tracking-normal text-[var(--text-dim)]")}>
                        {chars.map((c, i) => (
                            <span
                                key={i}
                                className="nf-char"
                                style={{ "--x": `${(i - mid) * 0.6}em`, "--d": `${1.4 + (rank.get(i) ?? 0) * 0.07}s` } as CSSProperties}
                            >
                                {c}
                            </span>
                        ))}
                    </span>
                </button>
                <span className="relative z-10">4</span>
            </div>
            <div className="relative flex max-w-[34rem] flex-col items-center gap-6">
                <h1 id="not-found-title" className="text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                    This page fell into a black hole
                </h1>
                {/* the reply a bot sends when a command goes nowhere */}
                <div className="w-full rounded-xl border border-white/10 bg-[#0e1019]/95 p-4 text-left">
                    <div className="flex gap-3">
                        <Image src="/logo.svg" alt="" width={36} height={36} className="size-9 shrink-0 rounded-full bg-[#05070d]" />
                        <div className="flex min-w-0 flex-col gap-1">
                            <span className="text-sm">
                                <span className="font-semibold">Seyfert</span>{" "}
                                <span className="rounded-[3px] bg-[#5865f2] px-1 py-px text-[10px] font-semibold text-white">APP</span>
                            </span>
                            <p className="text-pretty text-[15px] leading-relaxed text-[#dbdee1]">
                                {shown ? <code translate="no" className={cn(mono, "rounded bg-white/[0.06] px-1 py-px text-[13px] text-[var(--core-amber)]")}>{shown}</code> : "This address"}{" "}
                                crossed the event horizon. Nothing comes back out, not even a redirect. If a docs link brought you here, the guides were reorganised and the page has probably moved.
                            </p>
                            <span className="flex items-center gap-1 text-xs text-[#949ba4]">
                                <Eye aria-hidden className="size-4" />
                                Only you can see this ·{" "}
                                <Link href="/" className="text-[#00a8fc] hover:underline focus-visible:underline focus-visible:outline-none">
                                    Dismiss message
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
