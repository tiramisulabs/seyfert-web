"use client";

import { Button } from "@/components/archive/chad/src/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { SocialCreditToast } from "@/components/archive/chad/src/components/home/social-credit-meme";
import { ChevronDown, Copy, Check, Rocket } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const INSTALL_COMMAND = "npm i seyfert";

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const [socialCredit, setSocialCredit] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setSocialCredit(true);
      setTimeout(() => setCopied(false), 2200);
      setTimeout(() => setSocialCredit(false), 2800);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <>
      <SocialCreditToast open={socialCredit} />
      <button
        onClick={handleCopy}
        aria-label="Copy install command"
        className={cn(
          "group inline-flex items-center gap-3 h-12 px-5",
          "border-2 border-white/20 bg-black/40 backdrop-blur-sm",
          "font-mono text-[13px] tracking-[0.18em] uppercase text-zinc-200",
          "transition-all duration-200",
          "hover:border-white/50 hover:bg-black/70 hover:text-white",
          "cursor-pointer",
        )}
      >
        <span className="text-zinc-500 select-none">$</span>
        <span>{INSTALL_COMMAND}</span>
        <span className="ml-1 flex items-center justify-center w-5 h-5 text-zinc-500 group-hover:text-white transition-colors">
          {copied ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Copy className="size-4" />
          )}
        </span>
      </button>
    </>
  );
}

function VerifiedChadStamp() {
  return (
    <div
      aria-hidden="true"
      className="absolute -top-4 -right-4 sm:-top-6 sm:-right-8 lg:top-8 lg:-right-16 z-20 pointer-events-none select-none"
      style={{ transform: "rotate(12deg)" }}
    >
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <path
              id="circlePath"
              d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0"
            />
          </defs>
          {/* Outer ring */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
          />
          {/* Text along path */}
          <text
            fontSize="14"
            fontWeight="900"
            letterSpacing="3"
            fill="rgba(255,255,255,0.95)"
            fontFamily="monospace"
          >
            <textPath href="#circlePath" startOffset="0">
              ★ VERIFIED CHAD ★ APPROVED 4 USE ★
            </textPath>
          </text>
          {/* Center mark */}
          <g transform="translate(100, 100)">
            <polygon
              points="0,-32 9,-10 32,-10 14,4 21,26 0,13 -21,26 -14,4 -32,-10 -9,-10"
              fill="rgba(255,255,255,0.95)"
            />
            <text
              y="56"
              textAnchor="middle"
              fontSize="10"
              fontWeight="900"
              fill="rgba(255,255,255,0.8)"
              fontFamily="monospace"
              letterSpacing="2"
            >
              SIGMA
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}

function ChadHalo() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      {/* White soft light — perfect circle */}
      <div
        className="relative w-[55vh] h-[55vh] md:w-[65vh] md:h-[65vh] rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.02) 50%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Thin concentric rings + accent dots */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 200"
        fill="none"
      >
        {/* Solid rings */}
        <circle cx="100" cy="100" r="78" stroke="rgba(255,255,255,0.20)" strokeWidth="0.4" />
        <circle cx="100" cy="100" r="86" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
        <circle cx="100" cy="100" r="94" stroke="rgba(255,255,255,0.08)" strokeWidth="0.25" />
        {/* Dashed outer ring */}
        <circle
          cx="100"
          cy="100"
          r="70"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="0.25"
          strokeDasharray="0.8 2"
        />
        {/* Accent dots — punctuate the rings, mirror the divider's diamond accents on the right */}
        <circle cx="100" cy="6" r="1.1" fill="white" opacity="0.7" />
        <circle cx="194" cy="100" r="0.9" fill="white" opacity="0.5" />
        <circle cx="100" cy="194" r="0.7" fill="white" opacity="0.35" />
        <circle cx="6" cy="100" r="0.9" fill="white" opacity="0.5" />
        {/* Diagonal smaller dots */}
        <circle cx="166" cy="34" r="0.6" fill="white" opacity="0.45" />
        <circle cx="34" cy="166" r="0.5" fill="white" opacity="0.3" />
      </svg>
    </div>
  );
}

function MagicCircleBg() {
  return (
    <svg
      aria-hidden="true"
      className="absolute -top-[20%] -left-[10%] w-[140%] h-[140%] opacity-[0.07] pointer-events-none"
      viewBox="0 0 1000 1000"
      fill="none"
    >
      <defs>
        <radialGradient id="ringFade" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[120, 200, 290, 390, 500, 620, 750].map((r) => (
        <circle
          key={r}
          cx="500"
          cy="500"
          r={r}
          stroke="url(#ringFade)"
          strokeWidth="1"
        />
      ))}
      {/* Pentagram inscribed in circle */}
      <g
        transform="translate(500, 500) scale(0.9)"
        stroke="url(#ringFade)"
        strokeWidth="0.8"
        fill="none"
      >
        <polygon points="0,-200 117,162 -190,-62 190,-62 -117,162" />
        <circle r="200" />
      </g>
      <circle cx="350" cy="280" r="6" fill="white" opacity="0.5" />
      <circle cx="720" cy="400" r="4" fill="white" opacity="0.4" />
      <circle cx="200" cy="620" r="3" fill="white" opacity="0.3" />
    </svg>
  );
}

function HeroStats() {
  const stats = [
    { value: "100%", label: "Type-Safe" },
    { value: "10×", label: "Less RAM" },
    { value: "0", label: "Skill Issues" },
  ];
  return (
    <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 max-w-md border-y border-white/10 py-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "flex flex-col",
            i < stats.length - 1 && "border-r border-white/10 pr-2 sm:pr-3"
          )}
        >
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
            {s.value}
          </span>
          <span className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MarqueeTape() {
  const text = "BUILT DIFFERENT  ★  BUILT FOR CHADS  ★  TYPESCRIPT MAXXING  ★  ZERO COPE ZONE  ★  SIGMA STACK ONLY  ★  ";
  return (
    <div
      aria-hidden="true"
      className="absolute left-0 right-0 z-30 overflow-hidden bg-white text-black border-y-2 border-black top-[54px] md:top-[62px]"
    >
      <div className="flex whitespace-nowrap animate-marquee py-1.5 font-mono font-black text-[11px] tracking-[0.25em]" style={{ ['--duration' as string]: '40s', ['--gap' as string]: '0px' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="px-4">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center bg-[#0a0a0a]">
      {/* Magic circle + pentagram background */}
      <MagicCircleBg />

      {/* Radial vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Chad image — left side, transparent cartoon, centered */}
      <div className="absolute inset-y-0 left-0 w-full md:w-[55%] lg:w-[50%] pointer-events-none select-none flex items-center justify-center overflow-hidden">
        <ChadHalo />
        <Image
          src="/chad.png"
          alt=""
          width={454}
          height={550}
          priority
          className="relative h-[50vh] md:h-[60vh] w-auto object-contain opacity-45 md:opacity-100 drop-shadow-[0_0_40px_rgba(120,200,255,0.15)] md:drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        />
      </div>

      {/* Diagonal tape strip — brutalist accent */}
      <MarqueeTape />

      {/* Right column — branding */}
      <div className="relative z-10 w-full md:ml-auto md:w-[55%] lg:w-1/2 px-6 sm:px-10 md:px-12 lg:px-20 py-24 md:py-12">
        <div className="relative max-w-xl">
          {/* Verified Chad seal */}
          <VerifiedChadStamp />

          {/* Tag pill */}
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 border border-white/15 bg-white/5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-zinc-300">
              v4.3 / Chad Patch Live
            </span>
          </div>

          {/* Brand lockup */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 overflow-visible pr-4">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0">
              <Image
                src="/logo.svg"
                alt="Seyfert"
                fill
                priority
                className="object-contain drop-shadow-[0_0_30px_rgba(120,200,255,0.35)]"
              />
            </div>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-[-0.02em] leading-none italic"
              style={{
                background:
                  "linear-gradient(180deg, #ffffff 0%, #e5e5e5 55%, #9a9a9a 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 2px 30px rgba(255,255,255,0.08)",
                paddingRight: "0.15em",
              }}
            >
              SEYFERT
            </h1>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.05] tracking-tight text-white mb-6 uppercase">
            Black Magic{" "}
            <br className="hidden sm:block" />
            Framework for{" "}
            <span
              className="italic inline-block"
              style={{
                background:
                  "linear-gradient(180deg, #ffffff 0%, #b0b0b0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                paddingRight: "0.12em",
              }}
            >
              Chads
            </span>
            <span className="text-blue-400">.</span>
          </h2>

          {/* Divider with diamond */}
          <div className="flex items-center gap-3 my-6 max-w-sm">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <div className="w-1.5 h-1.5 rotate-45 border border-white/40" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </div>

          {/* Description */}
          <p className="text-zinc-400 text-base sm:text-[17px] leading-relaxed mb-4 max-w-lg">
            Discord bot framework with{" "}
            <span className="text-zinc-200 font-semibold">End-to-End Type Safety</span>,{" "}
            <span className="text-zinc-200 font-semibold">formidable speed</span>, and{" "}
            <span className="text-zinc-200 font-semibold">exceptional DX</span> across runtimes.
          </p>

          <p className="text-zinc-500 text-base sm:text-lg mb-8">
            Built Different.{" "}
            <span className="text-white font-bold">Built for Chads.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link href="/guide">
              <Button
                size="lg"
                className={cn(
                  "h-12 px-7 rounded-none cursor-pointer",
                  "bg-white text-black hover:bg-zinc-100",
                  "font-black tracking-[0.18em] uppercase text-[13px]",
                  "shadow-[6px_6px_0_0_rgba(255,255,255,0.25)]",
                  "border-2 border-white",
                  "hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.35)] transition-all"
                )}
              >
                Get Started
                <Rocket className="size-4 ml-1" />
              </Button>
            </Link>
            <CopyCommand />
          </div>

          {/* Stats strip */}
          <HeroStats />
        </div>

        {/* Scroll hint */}
        <div className="hidden md:flex items-center gap-2 absolute bottom-0 left-1/2 -translate-x-1/2 pb-1 text-zinc-500 text-xs tracking-wider">
          <span className="font-mono uppercase">Witness the gains</span>
          <ChevronDown className="size-4 animate-bounce" />
        </div>
      </div>

      {/* Mobile scroll hint */}
      <div className="md:hidden flex items-center gap-2 absolute bottom-6 left-1/2 -translate-x-1/2 text-zinc-500 text-xs tracking-wider font-mono uppercase">
        <span>Witness the gains</span>
        <ChevronDown className="size-4 animate-bounce" />
      </div>

      {/* Corner registration marks (brutalist touch) */}
      <CornerMark className="top-4 left-4" />
      <CornerMark className="top-4 right-4" flip="x" />
      <CornerMark className="bottom-4 left-4" flip="y" />
      <CornerMark className="bottom-4 right-4" flip="xy" />
    </section>
  );
}

function CornerMark({ className, flip }: { className?: string; flip?: "x" | "y" | "xy" }) {
  const transform =
    flip === "x" ? "scaleX(-1)" : flip === "y" ? "scaleY(-1)" : flip === "xy" ? "scale(-1)" : undefined;
  return (
    <svg
      aria-hidden="true"
      className={cn("absolute w-6 h-6 text-white/25 pointer-events-none", className)}
      style={{ transform }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 3 H10 M3 3 V10" />
    </svg>
  );
}
