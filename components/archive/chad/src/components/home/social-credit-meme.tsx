"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";

function CreditArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 56"
      className={cn("h-11 w-9 shrink-0", className)}
      aria-hidden
    >
      <path
        d="M24 2 L46 38 H32 V54 H16 V38 H2 Z"
        fill="currentColor"
        stroke="#0a0a0a"
        strokeWidth="2"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** Social-credit meme vibe, Seyfert brutalist skin — no stock image paste */
export function SocialCreditMeme({
  points = 1000,
  className,
}: {
  points?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-[min(calc(100vw-2rem),17.5rem)] overflow-hidden",
        "border-2 border-white bg-[#0a0a0a]",
        "shadow-[6px_6px_0_0_#22c55e]",
        className,
      )}
      role="status"
      aria-label={`Plus ${points} social credit. Well done.`}
    >
      <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.04] px-2.5 py-1.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.28em] text-zinc-400">
          // Credit granted
        </span>
        <span className="font-mono text-[9px] text-emerald-400/90">★ W</span>
      </div>

      <div className="flex items-stretch">
        <div className="flex items-center justify-center border-r border-white/15 bg-emerald-500 px-3 py-3 text-white">
          <CreditArrow />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5">
          <span className="font-black leading-none text-white text-4xl tracking-tight">
            +{points}
          </span>
          <span className="mt-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            Social Credit
          </span>
        </div>

        <div className="flex w-[3.25rem] shrink-0 flex-col items-center justify-center gap-1 border-l border-white/15 bg-white/[0.03] px-1.5 py-2">
          <span className="font-bold leading-none text-white/90 text-sm">做得好</span>
          <span className="text-2xl leading-none" aria-hidden>
            💪
          </span>
        </div>
      </div>

      <p className="border-t border-white/10 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.22em] text-zinc-600">
        The Party thanks you for installing Seyfert
      </p>
    </div>
  );
}

export function SocialCreditToast({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.94, rotate: -3 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.97, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
          className="pointer-events-none fixed bottom-5 right-3 z-[100] sm:bottom-8 sm:right-8"
        >
          <SocialCreditMeme />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
