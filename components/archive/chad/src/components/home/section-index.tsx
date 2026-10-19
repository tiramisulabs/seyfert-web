import { cn } from "@/lib/utils";

export function SectionIndex({
  index,
  stamp,
  className,
}: {
  index: number;
  stamp?: string;
  className?: string;
}) {
  const num = String(index).padStart(2, "0");

  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-0 right-0 z-0 select-none font-black leading-none",
          "text-8xl text-white/[0.05] sm:text-9xl",
          className,
        )}
      >
        {num}
      </span>
      {stamp ? (
        <div
          aria-hidden
          className="pointer-events-none absolute top-5 left-2 z-0 -rotate-12 border border-white/20 bg-black/90 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400 sm:left-4"
        >
          {stamp}
        </div>
      ) : null}
    </>
  );
}
