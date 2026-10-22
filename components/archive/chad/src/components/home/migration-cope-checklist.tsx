"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const steps = [
  {
    cope: "REST.put + switch case per command",
    win: "Drop a file in /commands — done",
  },
  {
    cope: "Copy-paste middleware in every handler",
    win: "@Middlewares on the class",
  },
  {
    cope: "Pray shard 0 does not sneeze",
    win: "Built-in sharding when you scale",
  },
];

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.22, delayChildren: 0.08 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const checkVariants = {
  hidden: { scale: 0, rotate: -24 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 560,
      damping: 20,
      delay: 0.28,
    },
  },
};

const strikeVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const, delay: 0.15 },
  },
};

export function MigrationCopeChecklist() {
  return (
    <motion.div
      className={cn(
        "w-full min-w-0 max-w-2xl mx-auto",
        "border-2 border-white/15 bg-[#0a0a0a]",
        "shadow-[4px_4px_0_0_rgba(255,255,255,0.07)] sm:shadow-[6px_6px_0_0_rgba(255,255,255,0.07)]",
      )}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-3 sm:px-5 sm:py-3.5">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px] sm:tracking-[0.28em]">
          // Migration checklist
        </p>
        <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.15em] sm:text-[10px] sm:tracking-[0.2em]">
          <span className="flex gap-1" aria-hidden>
            {steps.map((_, i) => (
              <motion.span
                key={i}
                className="h-2 w-2 border border-white/30 bg-white/10"
                initial={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                whileInView={{ backgroundColor: "rgba(255,255,255,0.95)" }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 + i * 0.22, duration: 0.2 }}
              />
            ))}
          </span>
          <span className="text-emerald-400/90">3/3</span>
        </div>
      </div>

      <motion.ol
        className="divide-y divide-white/10"
        variants={listVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {steps.map((step, i) => (
          <motion.li
            key={step.cope}
            variants={rowVariants}
            className="px-3 py-4 sm:px-5 sm:py-5 lg:grid lg:grid-cols-[2rem_minmax(0,1fr)_2rem_minmax(0,1fr)] lg:items-center lg:gap-x-4 lg:gap-y-0"
          >
            {/* Mobile / tablet: stacked with num + content */}
            <div className="flex gap-3 lg:contents">
              <span className="shrink-0 pt-0.5 font-mono text-[10px] font-black tabular-nums text-zinc-600 lg:pt-0">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 flex-1 space-y-3 lg:contents">
                <div className="min-w-0 lg:col-start-2">
                  <span className="mb-1.5 inline-block border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-red-400/90 sm:tracking-[0.2em]">
                    Cope
                  </span>
                  <p className="relative break-words text-sm leading-snug text-zinc-500">
                    {step.cope}
                    <motion.span
                      variants={strikeVariants}
                      className="absolute left-0 top-1/2 h-px w-full origin-left bg-red-500/50"
                      aria-hidden
                    />
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 lg:col-start-3 lg:row-span-2 lg:flex-col lg:justify-center lg:gap-0"
                  aria-hidden
                >
                  <div className="h-px flex-1 bg-white/10 lg:hidden" />
                  <motion.span
                    variants={checkVariants}
                    className="flex h-6 w-6 shrink-0 items-center justify-center border-2 border-emerald-400/70 bg-emerald-400/10 text-xs font-black text-emerald-400 sm:h-7 sm:w-7 sm:text-sm"
                  >
                    ✓
                  </motion.span>
                  <div className="h-px flex-1 bg-white/10 lg:hidden" />
                </div>

                <div className="min-w-0 border-t border-white/5 pt-3 lg:col-start-4 lg:border-t-0 lg:pt-0">
                  <span className="mb-1.5 inline-block border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-400/90 sm:tracking-[0.2em]">
                    W
                  </span>
                  <p className="break-words text-sm font-semibold leading-snug text-zinc-100">
                    {step.win}
                  </p>
                </div>
              </div>
            </div>
          </motion.li>
        ))}
      </motion.ol>

      <motion.p
        className="border-t border-white/10 px-3 py-3.5 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600 sm:px-5 sm:py-4 sm:text-[10px] sm:tracking-[0.25em]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.75, duration: 0.4 }}
      >
        Status:{" "}
        <span className="font-bold text-emerald-400">cleared</span>
        <span className="text-white/25"> · </span>
        cope eliminated
      </motion.p>
    </motion.div>
  );
}
