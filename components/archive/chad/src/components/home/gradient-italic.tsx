import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

const VARIANTS = {
  sky: {
    gradient: "linear-gradient(180deg, #ffffff 0%, #7dd3fc 100%)",
    period: "#7dd3fc",
  },
  gold: {
    gradient: "linear-gradient(180deg, #ffffff 0%, #d4a857 100%)",
    period: "#d4a857",
  },
  gray: {
    gradient: "linear-gradient(180deg, #ffffff 0%, #b0b0b0 100%)",
    period: "#b0b0b0",
  },
  green: {
    gradient: "linear-gradient(180deg, #ffffff 0%, #86efac 100%)",
    period: "#86efac",
  },
} as const;

export type GradientItalicVariant = keyof typeof VARIANTS;

function gradientClipStyle(
  gradient: string,
  { endsWithPeriod }: { endsWithPeriod: boolean },
): CSSProperties {
  return {
    background: gradient,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    // Room for slanted last glyph; keep tight when "." follows in the next span
    paddingRight: endsWithPeriod ? "0.1em" : "0.35em",
  };
}

/** Italic gradient line — same pattern as hero: full word gradient + solid "." */
export function GradientItalic({
  children,
  variant,
  className,
}: {
  children: string;
  variant: GradientItalicVariant;
  className?: string;
}) {
  const { gradient, period: periodColor } = VARIANTS[variant];
  const hasPeriod = children.endsWith(".");
  const text = hasPeriod ? children.slice(0, -1) : children;

  return (
    <>
      <span
        className={cn("inline-block italic", className)}
        style={gradientClipStyle(gradient, { endsWithPeriod: hasPeriod })}
      >
        {text}
      </span>
      {hasPeriod ? (
        <span
          className="-ml-[0.12em] inline-block italic"
          style={{ color: periodColor }}
        >
          .
        </span>
      ) : null}
    </>
  );
}

export function SectionHeading({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-4xl md:text-6xl font-black leading-[1.05] tracking-tight uppercase",
        className,
      )}
    >
      {children}
    </h2>
  );
}
