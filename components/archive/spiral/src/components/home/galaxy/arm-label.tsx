import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

// Minimal index annotation, e.g. <ArmLabel index="01" name="Features" />
// Quiet by design — it catalogues the section, nothing more.
export function ArmLabel({ index, name, className }: { index: string; name: string; className?: string }) {
    return (
        <div className={cn(GeistMono.className, "flex items-baseline gap-3 text-[11px] tracking-[0.25em] text-[var(--text-dim)]", className)}>
            <span className="text-[var(--brand-indigo)]/80">{index}</span>
            <span className="uppercase">{name}</span>
        </div>
    );
}
