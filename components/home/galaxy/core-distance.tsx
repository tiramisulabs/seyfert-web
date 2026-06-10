"use client";

import { useEffect, useRef } from "react";
import { GeistMono } from "geist/font/mono";

// The narrative thread: the page IS the dive. A fixed readout in the corner
// tracks scroll as distance-to-core in Schwarzschild radii — 9.50 rs at the
// hero (the camera's actual orbit distance in the geodesic shader) down to
// the horizon at the finale. Decorative instrument, hidden from AT.
export function CoreDistance() {
    const valueRef = useRef<HTMLSpanElement>(null);
    const fillRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const max =
                document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
            // free-fall profile: barely moves at first, accelerates toward
            // the core — crossing the horizon exactly at the finale
            const d = 1 + 8.5 * Math.pow(1 - p, 2.2);
            if (valueRef.current) {
                valueRef.current.textContent =
                    d <= 1.005 ? "EVENT HORIZON" : `${d.toFixed(2)} rs`;
            }
            if (fillRef.current) {
                fillRef.current.style.transform = `scaleX(${p})`;
            }
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    return (
        <div
            aria-hidden
            className={`${GeistMono.className} pointer-events-none fixed bottom-8 right-6 z-20 hidden items-center gap-3 text-[10px] tracking-[0.25em] text-[var(--text-dim)]/70 xl:flex lg:right-12`}
        >
            <span>DISTANCE TO CORE</span>
            <span className="relative h-px w-16 bg-white/10">
                <span
                    ref={fillRef}
                    className="absolute inset-0 origin-left bg-[var(--brand-indigo)]/70"
                    style={{ transform: "scaleX(0)" }}
                />
            </span>
            <span
                ref={valueRef}
                className="w-[13ch] whitespace-nowrap text-right tabular-nums"
            >
                9.50 rs
            </span>
        </div>
    );
}
