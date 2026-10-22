"use client";

import { useEffect, useRef, useState } from "react";
import { GeistMono } from "geist/font/mono";

// ── EASTER EGG ──
// Click the black hole → Kirby falls in screaming and gets spaghettified
// across the event horizon. An homage to THAT video. Implementation notes:
// no overlay hit-area (it would swallow the canvas parallax mousemove) —
// instead we hit-test document clicks against the hole's known screen
// position (79% across, 48% down the hero, same math as the shader's
// uCenter). Kirby himself is an inline SVG, so no sprite assets, and the
// fall runs on the Web Animations API with a single GPU-composited
// transform — the geodesic raymarcher never notices.

const MAX_KIRBYS = 6;
// snappy: he must be on screen within ~100ms of the click or the gag dies
const FALL_MS = 1700;

function KirbySvg() {
    return (
        <svg viewBox="0 0 64 64" className="h-14 w-14 drop-shadow-[0_0_10px_rgba(255,166,201,0.45)]">
            {/* arms up — he knows */}
            <ellipse cx="10" cy="22" rx="7" ry="9" fill="#ff9ec7" transform="rotate(-30 10 22)" />
            <ellipse cx="54" cy="22" rx="7" ry="9" fill="#ff9ec7" transform="rotate(30 54 22)" />
            {/* feet */}
            <ellipse cx="20" cy="54" rx="10" ry="7" fill="#e0315f" transform="rotate(18 20 54)" />
            <ellipse cx="44" cy="54" rx="10" ry="7" fill="#e0315f" transform="rotate(-18 44 54)" />
            {/* body */}
            <circle cx="32" cy="32" r="22" fill="#ffa6c9" />
            <circle cx="32" cy="32" r="22" fill="none" stroke="#d6759e" strokeWidth="1" opacity="0.5" />
            {/* eyes — vertical ovals, white highlight, blue base */}
            <ellipse cx="25" cy="26" rx="3.2" ry="7" fill="#1a1023" />
            <ellipse cx="39" cy="26" rx="3.2" ry="7" fill="#1a1023" />
            <ellipse cx="25" cy="22.5" rx="2" ry="3" fill="#fff" />
            <ellipse cx="39" cy="22.5" rx="2" ry="3" fill="#fff" />
            <ellipse cx="25" cy="30.5" rx="1.8" ry="2.4" fill="#3d6dd8" />
            <ellipse cx="39" cy="30.5" rx="1.8" ry="2.4" fill="#3d6dd8" />
            {/* blush */}
            <ellipse cx="17" cy="33" rx="3.5" ry="2" fill="#ff7fb2" />
            <ellipse cx="47" cy="33" rx="3.5" ry="2" fill="#ff7fb2" />
            {/* the scream */}
            <ellipse cx="32" cy="41" rx="6" ry="7.5" fill="#7a1535" />
            <ellipse cx="32" cy="45" rx="4" ry="3.5" fill="#ff5e8a" />
        </svg>
    );
}

function FallingKirby({ onDone }: { onDone: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const done = useRef(onDone);
    done.current = onDone;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // spawn right at the viewport's top edge — visible almost instantly
        const sx = (Math.random() - 0.5) * 240;
        const sy = -(rect.top + 70);
        const spin = Math.random() > 0.5 ? 1 : -1;
        const anim = el.animate(
            [
                { transform: `translate(${sx}px, ${sy}px) rotate(0deg) scale(1.1)`, opacity: 1 },
                { transform: `translate(${sx * 0.8}px, ${sy * 0.5}px) rotate(${spin * 140}deg) scale(1.05)`, offset: 0.32 },
                { transform: `translate(${sx * 0.35 - 26 * spin}px, ${sy * 0.14}px) rotate(${spin * 320}deg) scale(0.82)`, offset: 0.58 },
                // crossing the horizon: radial stretch — spaghettification
                { transform: `translate(${-14 * spin}px, -6px) rotate(${spin * 510}deg) scale(0.45, 0.95)`, offset: 0.78 },
                { transform: `translate(0px, 0px) rotate(${spin * 670}deg) scale(0.1, 1.6)`, opacity: 0.9, offset: 0.93 },
                { transform: `translate(0px, 0px) rotate(${spin * 750}deg) scale(0.001, 2)`, opacity: 0 },
            ],
            { duration: FALL_MS, easing: "cubic-bezier(0.3, 0.1, 0.8, 0.55)", fill: "forwards" },
        );
        anim.onfinish = () => done.current();
        return () => anim.cancel();
    }, []);

    return (
        <div
            ref={ref}
            className="absolute left-[79%] top-[48%] -ml-7 -mt-7 will-change-transform"
        >
            <span
                className={`${GeistMono.className} absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] text-[#ffa6c9]/90`}
            >
                AAAAAA
            </span>
            <KirbySvg />
        </div>
    );
}

export function KirbyEgg() {
    const layerRef = useRef<HTMLDivElement>(null);
    const [kirbys, setKirbys] = useState<number[]>([]);
    const nextId = useRef(0);
    const screams = useRef<HTMLAudioElement[]>([]);

    useEffect(() => {
        const layer = layerRef.current;
        const hero = layer?.parentElement;
        if (!layer || !hero) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        // preload THE screams so the first click plays with zero delay;
        // each fall rolls the dice on which one he lets out
        screams.current = ["/sfx/kirby-fall-1.mp3", "/sfx/kirby-fall-2.mp3"].map(
            (src) => {
                const a = new Audio(src);
                a.preload = "auto";
                return a;
            },
        );

        const onClick = (e: MouseEvent) => {
            // desktop-only: the hole sits at 79%/48% only in the two-col layout
            if (window.innerWidth < 1024) return;
            const r = hero.getBoundingClientRect();
            const cx = r.left + r.width * 0.79;
            const cy = r.top + r.height * 0.48;
            const radius = Math.min(r.width, r.height) * 0.22;
            if (Math.hypot(e.clientX - cx, e.clientY - cy) > radius) return;
            setKirbys((k) =>
                k.length >= MAX_KIRBYS ? k : [...k, nextId.current++],
            );
            // clone per fall so rapid clicks overlap instead of restarting
            const pool = screams.current;
            if (pool.length) {
                const pick = pool[Math.floor(Math.random() * pool.length)];
                const s = pick.cloneNode() as HTMLAudioElement;
                s.volume = 0.55;
                void s.play().catch(() => {});
            }
        };
        hero.addEventListener("click", onClick);
        return () => hero.removeEventListener("click", onClick);
    }, []);

    return (
        <div
            ref={layerRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] hidden overflow-hidden lg:block"
        >
            {kirbys.map((id) => (
                <FallingKirby
                    key={id}
                    onDone={() =>
                        setKirbys((k) => k.filter((x) => x !== id))
                    }
                />
            ))}
        </div>
    );
}
