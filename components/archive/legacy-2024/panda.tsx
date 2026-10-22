import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// The 2024 site was styled with PandaCSS 0.40 (preset-panda tokens plus two
// `theme-colors` scales). Instead of reviving Panda, its codegen and preflight,
// the archive replays the same tokens as scoped CSS variables and Tailwind
// classes. Values below are what `getColors()` produced for those seeds.

type Scale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950, string>;

// getColors("#051721") — the `background` scale of both 2024 sites
const background: Scale = {
    50: "#f3f3f4", 100: "#e6e8e9", 200: "#c1c5c8", 300: "#9ba2a6", 400: "#505d64",
    500: "#051721", 600: "#05151e", 700: "#030e14", 800: "#020a0f", 900: "#02070a", 950: "#010507",
};

// getColors("#0ba2c5") — brand of the June 2024 site (368b8ac)
export const brandOriginal: Scale = {
    50: "#f3fafc", 100: "#e7f6f9", 200: "#c2e8f1", 300: "#9ddae8", 400: "#54bed6",
    500: "#0ba2c5", 600: "#0a92b1", 700: "#076176", 800: "#054959", 900: "#03313b", 950: "#022027",
};

// getColors("#1e90ff") — brand after the v2 site rework (163f71a onwards)
export const brandV2: Scale = {
    50: "#f4f9ff", 100: "#e9f4ff", 200: "#c7e3ff", 300: "#a5d3ff", 400: "#62b1ff",
    500: "#1e90ff", 600: "#1b82e6", 700: "#125699", 800: "#0e4173", 900: "#092b4d", 950: "#061d33",
};

export function pandaTheme(brand: Scale): CSSProperties {
    const vars: Record<string, string> = {};
    for (const [k, v] of Object.entries(background)) vars[`--bg-${k}`] = v;
    for (const [k, v] of Object.entries(brand)) vars[`--brand-${k}`] = v;
    return vars as CSSProperties;
}

// globalCss: body { bg: background.950; color: background.50 } + Panda's
// preflight line-height. Rendered as a wrapper so nothing leaks onto <body>.
export function PandaRoot({
    brand,
    className,
    children,
}: {
    brand: Scale;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            style={pandaTheme(brand)}
            className={cn(
                "min-h-screen bg-(--bg-950) text-(--bg-50) leading-normal",
                className,
            )}
        >
            {children}
        </div>
    );
}

// patterns.container: relative, maxW 8xl (90rem), mx auto, px 4/6/8
export function Container({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div className={cn("relative mx-auto max-w-[90rem] px-4 md:px-6 lg:px-8", className)}>
            {children}
        </div>
    );
}

// recipes: heading (base 500/1.25, sizes set their own weight)
const headingSizes = {
    "5xl": "text-[3rem] font-extrabold",
    "3xl": "text-[1.875rem] font-extrabold",
    "2xl": "text-[1.5rem] font-bold",
    xl: "text-[1.25rem] font-bold",
    lg: "text-[1.125rem] font-semibold",
} as const;

export function Heading({
    size = "2xl",
    className,
    children,
}: {
    size?: keyof typeof headingSizes;
    className?: string;
    children: ReactNode;
}) {
    return (
        <h1 className={cn("tracking-normal leading-[1.25]", headingSizes[size], className)}>
            {children}
        </h1>
    );
}

// recipes: text (400/1.25, md = 1rem)
export function Text({ className, children }: { className?: string; children: ReactNode }) {
    return <p className={cn("text-[1rem] font-normal leading-[1.25]", className)}>{children}</p>;
}
