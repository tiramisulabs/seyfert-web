# Spiral Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the classic landing at `/` with a "spiral journey" — WebGL Seyfert-galaxy hero + scroll-revealed sections themed as spiral arms ending at the core CTA.

**Architecture:** New `components/home/galaxy/` namespace. Hero galaxy renders via ogl (client-only, `ssr:false`) on top of a server-rendered CSS fallback so LCP stays on text. Sections migrate content from `components/home/classic/` with a cosmic skin, composed by `spiral-sections.tsx`. `?chad` routing untouched. Classic files deleted at the end.

**Tech Stack:** Next 16 (App Router, Turbopack), Tailwind v4 (CSS-first tokens), ogl, motion, geist fonts.

**Spec:** `docs/superpowers/specs/2026-06-03-spiral-landing-design.md`

**⚠️ NO COMMITS:** Do NOT run `git commit` at any step. The repo owner commits manually. (Standing instruction from FreeAoi.)

**Verification stack (no test framework in repo):** Each task ends with `pnpm exec tsc --noEmit` (must exit 0). Build-affecting milestones also run `pnpm build`. Visual checks: `pnpm dev` + curl/grep.

---

### Task 1: Cosmic theme tokens in global.css

**Files:**
- Modify: `app/global.css` (append at end of file)

- [ ] **Step 1: Append the cosmic token block**

Append to `app/global.css`:

```css
/* ── Spiral landing (Seyfert galaxy) tokens ─────────────────────── */
.spiral-page {
  --space-void: #030308;
  --space-deep: #0a0a14;
  --accent-indigo: #818cf8;
  --accent-cyan: #67e8f9;
  --accent-violet: #c084fc;
  --star-gold: #fbbf24;
  --text-bright: #f1f5f9;
  background: var(--space-void);
  color: var(--text-bright);
}

/* Core glow used by hero fallback and final CTA */
.core-glow {
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.9),
    rgba(199, 210, 254, 0.55) 28%,
    rgba(129, 140, 248, 0.22) 55%,
    transparent 75%
  );
}

@keyframes spiral-pulse {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.04); }
}
.animate-spiral-pulse { animation: spiral-pulse 6s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .animate-spiral-pulse { animation: none; }
}
```

- [ ] **Step 2: Typecheck/build sanity**

Run: `pnpm exec tsc --noEmit` → exit 0. (CSS-only change; tsc guards against accidental file corruption elsewhere.)

---

### Task 2: Galaxy fallback (server-renderable, no WebGL)

**Files:**
- Create: `components/home/galaxy/galaxy-fallback.tsx`

- [ ] **Step 1: Create the fallback**

```tsx
// Static galaxy: CSS core glow + faint starfield. Server-rendered under the
// WebGL canvas so LCP and no-WebGL/reduced-motion users get the full look.
export function GalaxyFallback() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* starfield */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.35) 0.5px, transparent 0.5px), radial-gradient(rgba(165,180,252,0.25) 0.5px, transparent 0.5px)",
          backgroundSize: "44px 44px, 89px 89px",
          backgroundPosition: "0 0, 22px 31px",
        }}
      />
      {/* AGN core */}
      <div className="core-glow animate-spiral-pulse absolute left-1/2 top-[38%] h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full" />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 3: WebGL spiral galaxy canvas (ogl)

**Files:**
- Create: `components/home/galaxy/galaxy-canvas.tsx`
- Reference: `components/ui/particles.tsx` (boilerplate origin — renderer/camera/resize/cleanup pattern)

- [ ] **Step 1: Create the canvas component**

Client-only (the parent imports it with `dynamic(..., {ssr:false})`). Positions are generated on the CPU as two logarithmic arms; the shader does slow rotation + soft round points. Color ramps white core → indigo → violet rim. Bails out (renders nothing) without WebGL2 or with reduced motion — the fallback underneath stays visible.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh } from "ogl";

const COUNT = 2600;
const ARMS = 2;
const TURNS = 2.2;

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec3 color;
  attribute float aSize;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  varying vec3 vColor;
  void main() {
    vColor = color;
    // slow rigid rotation around z (~1 rev / 3 min)
    float a = uTime * 0.035;
    float c = cos(a), s = sin(a);
    vec3 p = vec3(position.x * c - position.y * s, position.x * s + position.y * c, position.z);
    vec4 mvPos = viewMatrix * modelMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * (10.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord.xy - vec2(0.5));
    float alpha = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, alpha * 0.9);
  }
`;

// color ramp: core white -> indigo -> violet rim
function rampColor(t: number): [number, number, number] {
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  if (t < 0.25) {
    const k = t / 0.25;
    return [lerp(1, 0.51, k), lerp(1, 0.55, k), lerp(1, 0.97, k)]; // #fff -> #818cf8
  }
  const k = (t - 0.25) / 0.75;
  return [lerp(0.51, 0.75, k), lerp(0.55, 0.52, k), lerp(0.97, 0.99, k)]; // -> #c084fc
}

export default function GalaxyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const probe = document.createElement("canvas");
    if (!probe.getContext("webgl2")) return;

    const renderer = new Renderer({ depth: false, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.set(0, -1.2, 7.5);
    camera.lookAt([0, 0, 0]);

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    window.addEventListener("resize", resize, false);
    resize();

    const onMouseMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouseRef.current = {
        x: ((e.clientX - r.left) / r.width) * 2 - 1,
        y: -(((e.clientY - r.top) / r.height) * 2 - 1),
      };
    };
    container.addEventListener("mousemove", onMouseMove);

    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const arm = i % ARMS;
      const t = Math.pow(Math.random(), 0.6); // bias toward the core
      const theta = t * TURNS * Math.PI * 2 + (arm * Math.PI * 2) / ARMS;
      const radius = 0.12 + t * 2.6;
      // scatter grows with radius; arms stay tight near the core
      const scatter = 0.05 + t * 0.35;
      const x = Math.cos(theta) * radius + (Math.random() - 0.5) * scatter;
      const y = Math.sin(theta) * radius + (Math.random() - 0.5) * scatter;
      const z = (Math.random() - 0.5) * (0.08 + t * 0.22);
      positions.set([x, y, z], i * 3);
      colors.set(rampColor(t), i * 3);
      sizes[i] = (1 - t) * 26 + 6 + Math.random() * 6;
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      color: { size: 3, data: colors },
      aSize: { size: 1, data: sizes },
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const update = (t: number) => {
      raf = requestAnimationFrame(update);
      elapsed += (t - last) * 0.001;
      last = t;
      program.uniforms.uTime.value = elapsed;
      // mouse parallax ±2°
      mesh.rotation.y = mouseRef.current.x * 0.035;
      mesh.rotation.x = -0.55 + mouseRef.current.y * 0.035; // tilted disc
      renderer.render({ scene: mesh, camera });
    };
    raf = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(raf);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
    };
  }, []);

  return <div ref={containerRef} aria-hidden className="absolute inset-0" />;
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 4: Arm label + spiral hero + spiral-home shell

**Files:**
- Create: `components/home/galaxy/arm-label.tsx`
- Create: `app/(home)/spiral-home.tsx`

- [ ] **Step 1: Create arm-label**

```tsx
import { GeistMono } from "geist/font/mono";
import { cn } from "@/lib/utils";

// Monospace astronomical annotation, e.g. <ArmLabel numeral="I" name="ARSENAL" />
export function ArmLabel({ numeral, name, className }: { numeral: string; name: string; className?: string }) {
  return (
    <div className={cn(GeistMono.className, "text-[11px] tracking-[0.3em] text-[var(--accent-cyan)]/80", className)}>
      BRAZO {numeral} — {name}
    </div>
  );
}
```

- [ ] **Step 2: Create spiral-home (hero + sections shell)**

```tsx
import dynamic from "next/dynamic";
import Link from "next/link";
import { Rocket, Users } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import { GalaxyFallback } from "@/components/home/galaxy/galaxy-fallback";
import SpiralSections from "./spiral-sections";

const GalaxyCanvas = dynamic(() => import("@/components/home/galaxy/galaxy-canvas"), { ssr: false });

// Spiral landing — the visitor enters through the galaxy's outer arms and
// scrolls toward the core. Hero text stays server-rendered (LCP); the WebGL
// canvas overlays the static fallback once it loads.
export function SpiralHome() {
  return (
    <main className="spiral-page flex flex-col">
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        <GalaxyFallback />
        <GalaxyCanvas />

        <div className="relative z-10 max-w-2xl text-center">
          <div className={`${GeistMono.className} mx-auto mb-6 inline-block rounded-full border border-[var(--star-gold)]/30 bg-[var(--star-gold)]/5 px-4 py-1 text-xs text-[var(--star-gold)]`}>
            ✦ Released v4.3.0
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] sm:text-5xl">
            The brightest core a{" "}
            <span className="animate-text-gradient bg-gradient-to-r from-indigo-300 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              Discord bot
            </span>{" "}
            can have
          </h1>
          <p className="mt-6 text-[17px] text-neutral-300">
            Seyfert galaxies host the most luminous cores in the universe.
            Seyfert bots run on the most efficient one: a modern framework
            engineered for scale without sacrificing developer experience.
          </p>
          <div className="mt-10 flex items-center justify-center gap-5">
            <Link href="/guide">
              <Button className="cursor-pointer gap-3 text-base font-medium">
                Get Started
                <Rocket className="size-5" />
              </Button>
            </Link>
            <Link href="https://discord.gg/hEeJNaSqnS" target="_blank">
              <Button variant="outline" className="cursor-pointer gap-3 text-base font-medium">
                Community
                <Users className="size-5" />
              </Button>
            </Link>
          </div>
        </div>

        <div className={`${GeistMono.className} absolute bottom-8 z-10 text-[11px] tracking-[0.3em] text-neutral-500`}>
          SCROLL INTO THE CORE ↓
        </div>
      </div>

      <div className="relative mx-auto mt-8 w-full max-w-xs space-y-24 sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <SpiralSections />
      </div>
    </main>
  );
}
```

Note: `spiral-sections.tsx` doesn't exist yet — create it as a stub in this task so tsc passes:

```tsx
// app/(home)/spiral-sections.tsx — composed in Task 9
export default function SpiralSections() {
  return null;
}
```

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 5: Features arm (migrate from classic)

**Files:**
- Create: `components/home/galaxy/features.tsx`
- Source: `components/home/classic/features.tsx` (copy, then re-skin)

- [ ] **Step 1: Copy and re-skin**

Copy `classic/features.tsx` content into `galaxy/features.tsx`, keeping the `features` array (6 items: Written in TypeScript / Scalable / Effortless Development / Full customization / Latest Features / And more…) and `Feature` sub-component intact, with these exact changes:

1. Section header block becomes (replaces the `<h2>` + divider `<div>`s, adds the arm label):

```tsx
import { ArmLabel } from "./arm-label";
// ...
<section className="flex flex-col items-center gap-4">
  <ArmLabel numeral="I" name="ARSENAL" />
  <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">
    Packed with unique features
  </h2>
```

2. In the `Feature` sub-component, swap the hover accent `group-hover/feature:bg-blue-500` → `group-hover/feature:bg-indigo-400`, and border colors `dark:border-neutral-800` → `border-white/10` (3 occurrences; the landing is always dark so drop the `dark:` prefix).

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 6: Benchmark teaser arm (new)

**Files:**
- Create: `components/home/galaxy/bench-teaser.tsx`

- [ ] **Step 1: Create the teaser**

Static SVG bars — RSS medians on Node from `public/bench/node/meadian*.json` (values hardcoded; check the JSONs and adjust the numbers to the real medians before shipping — exact figures matter less than the ratio story).

```tsx
import Link from "next/link";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";

// RSS (MB, lower is better) — medians from public/bench/node/meadian*.json
const BARS = [
  { name: "seyfert", mb: 60, accent: true },
  { name: "discord.js", mb: 130, accent: false },
  { name: "eris", mb: 95, accent: false },
  { name: "oceanic", mb: 105, accent: false },
] as const;

export function BenchTeaser() {
  const max = Math.max(...BARS.map((b) => b.mb));
  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <ArmLabel numeral="II" name="LUMINOSIDAD" />
      <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">
        Shine brighter, burn less
      </h2>
      <p className="text-neutral-400">Median memory footprint under identical load (Node).</p>

      <div className="w-full max-w-xl space-y-3 pt-4">
        {BARS.map((b) => (
          <div key={b.name} className="flex items-center gap-3">
            <span className={`${GeistMono.className} w-24 shrink-0 text-right text-xs text-neutral-400`}>{b.name}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={b.accent ? "h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300" : "h-full rounded-full bg-white/15"}
                style={{ width: `${(b.mb / max) * 100}%` }}
              />
            </div>
            <span className={`${GeistMono.className} w-16 shrink-0 text-left text-xs ${b.accent ? "text-[var(--accent-cyan)]" : "text-neutral-500"}`}>{b.mb} MB</span>
          </div>
        ))}
      </div>

      <Link href="/benchmark" className={`${GeistMono.className} pt-4 text-xs tracking-widest text-[var(--accent-cyan)] hover:underline`}>
        [ VER MEDICIONES COMPLETAS → ]
      </Link>
    </section>
  );
}
```

- [ ] **Step 2: Replace placeholder numbers with real medians**

Run: `node -e "for (const f of ['seyfert','discordjs','eris','oceanic']) { const d=require('/home/freeaoi/Development/seyfert-web/public/bench/node/meadian'+f+'.json'); console.log(f, d); }" | head -20`
Inspect the shape, compute/extract the median RSS per lib, update `BARS`.

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 7: Testimonials arm (migrate) + constellation arm (new twist)

**Files:**
- Create: `components/home/galaxy/testimonials.tsx` (from `classic/testimonials.tsx`)
- Create: `components/home/galaxy/constellation.tsx` (data from `classic/usedby.tsx`)

- [ ] **Step 1: Testimonials — copy and re-skin**

Copy `classic/testimonials.tsx` keeping the 6-item `testimonials` array and card markup, with these exact changes:
1. Remove the `GridBG` import and the `<GridBG size={20} />` line (classic-only dep).
2. Add `import { ArmLabel } from "./arm-label";` and insert `<ArmLabel numeral="III" name="OBSERVADO POR" className="text-center" />` above the `<h2>`.
3. Card border: `border-neutral-800` → `border-white/10`; add `bg-[var(--space-deep)]/60`.

- [ ] **Step 2: Constellation — bots as a star chart**

Fixed positions (hydration-safe), constellation lines, avatar reveals on hover. Collapses to a plain grid below `md`. Bot data (8 entries: name/handle/avatar/text) comes verbatim from `usedByEntries` in `classic/usedby.tsx`.

```tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { GeistMono } from "geist/font/mono";
import { ArmLabel } from "./arm-label";

type Bot = { name: string; avatar: string; text: string; x: number; y: number };

// Positions are fixed constants — no Math.random in render (hydration safety).
// Copy name/avatar/text verbatim from classic/usedby.tsx usedByEntries.
const BOTS: Bot[] = [
  { name: "CactusFire", avatar: "/bots/cactusfire.png", text: "…", x: 8, y: 36 },
  { name: "Listen", avatar: "/bots/listen.png", text: "…", x: 22, y: 14 },
  { name: "Hiraku Shinzou", avatar: "/bots/hiraku.png", text: "…", x: 38, y: 42 },
  { name: "Button Bot", avatar: "/bots/buttonbot.gif", text: "…", x: 52, y: 18 },
  { name: "Stelle", avatar: "/bots/stelle.png", text: "…", x: 64, y: 48 },
  { name: "Multiversal", avatar: "/bots/multiversal.png", text: "…", x: 76, y: 22 },
  { name: "Kenium", avatar: "/bots/kenium.png", text: "…", x: 88, y: 40 },
  { name: "Lumi", avatar: "/bots/lumi.png", text: "…", x: 46, y: 66 },
];

export function Constellation() {
  const [active, setActive] = useState<Bot | null>(null);

  return (
    <section className="flex flex-col items-center gap-4 text-center">
      <ArmLabel numeral="IV" name="CONSTELACIÓN" />
      <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">Who is using Seyfert?</h2>
      <p className="text-neutral-400">
        Community bots, charted. Hover a star — add yours by opening a PR.
      </p>

      {/* star chart (md+) */}
      <div className="relative hidden h-[340px] w-full md:block">
        <svg className="absolute inset-0 h-full w-full" aria-hidden>
          {BOTS.slice(0, -1).map((b, i) => {
            const n = BOTS[i + 1];
            return (
              <line
                key={b.name}
                x1={`${b.x}%`} y1={`${b.y}%`} x2={`${n.x}%`} y2={`${n.y}%`}
                stroke="rgba(148,163,184,0.25)" strokeWidth="1" strokeDasharray="4 4"
              />
            );
          })}
        </svg>
        {BOTS.map((b) => (
          <button
            key={b.name}
            type="button"
            onMouseEnter={() => setActive(b)}
            onFocus={() => setActive(b)}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            aria-label={b.name}
          >
            <span className="block h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_3px_rgba(199,210,254,0.6)] transition-transform group-hover:scale-150" />
            <span className={`${GeistMono.className} mt-2 block text-[10px] text-neutral-500 group-hover:text-[var(--accent-cyan)]`}>
              {b.name}
            </span>
          </button>
        ))}
        {active && (
          <div className="absolute bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 rounded-lg border border-white/10 bg-[var(--space-deep)]/90 p-4 text-left backdrop-blur">
            <div className="flex items-center gap-3">
              <Image src={active.avatar} alt={active.name} width={32} height={32} className="rounded-full" unoptimized />
              <span className="text-sm font-bold">{active.name}</span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-neutral-300">{active.text}</p>
          </div>
        )}
      </div>

      {/* plain grid (<md) */}
      <div className="grid w-full grid-cols-2 gap-3 md:hidden">
        {BOTS.map((b) => (
          <div key={b.name} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--space-deep)]/60 p-3">
            <Image src={b.avatar} alt={b.name} width={28} height={28} className="rounded-full" unoptimized />
            <span className="truncate text-xs font-semibold">{b.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

(Replace each `text: "…"` with the full quote from `usedByEntries`.)

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 8: GitHub arm (reuse) + core CTA (new)

**Files:**
- Create: `components/home/galaxy/github.tsx` (from `classic/github.tsx`)
- Create: `components/home/galaxy/core-cta.tsx`

- [ ] **Step 1: GitHub — copy with minimal re-skin**

Copy `classic/github.tsx` → `galaxy/github.tsx` unchanged except:
1. Add `import { ArmLabel } from "./arm-label";` and insert `<ArmLabel numeral="V" name="OPEN SOURCE" className="text-center" />` directly above the section's `<h2>` (locate the heading in the copied file).
2. Replace any `border-neutral-800` with `border-white/10`.
Keep the existing stars/contributors fetch logic and its error handling exactly as-is.

- [ ] **Step 2: Core CTA — journey's end**

```tsx
import Link from "next/link";
import { Rocket } from "lucide-react";
import { GeistMono } from "geist/font/mono";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/components/ui/icons/discord";

// The core: max glow, final CTA. The journey ends here.
export function CoreCta() {
  return (
    <section className="relative flex flex-col items-center gap-6 overflow-hidden py-24 text-center">
      <div className="core-glow animate-spiral-pulse absolute left-1/2 top-full h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/3 rounded-full" aria-hidden />
      <div className={`${GeistMono.className} relative text-[11px] tracking-[0.3em] text-[var(--star-gold)]`}>
        ★ NÚCLEO — HAS LLEGADO AL CENTRO
      </div>
      <h2 className="relative max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
        Ignite your core
      </h2>
      <p className="relative max-w-md text-neutral-300">
        You made it through the arms. Time to build the brightest bot in your galaxy.
      </p>
      <div className="relative flex items-center gap-4">
        <Link href="/guide">
          <Button className="cursor-pointer gap-3 text-base font-medium">
            Get Started
            <Rocket className="size-5" />
          </Button>
        </Link>
        <Link href="https://discord.gg/hEeJNaSqnS" target="_blank">
          <Button variant="outline" className="cursor-pointer gap-3 text-base font-medium">
            Discord
            <DiscordIcon className="size-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
```

Note: check `components/ui/icons/discord.tsx` for the actual export name/props of the Discord icon; if it doesn't accept `className`, drop it and match its real API.

- [ ] **Step 3: Verify**

Run: `pnpm exec tsc --noEmit` → exit 0.

---

### Task 9: Compose spiral-sections + swap page.tsx default

**Files:**
- Modify: `app/(home)/spiral-sections.tsx` (replace Task 4 stub)
- Modify: `app/(home)/page.tsx:1-14`

- [ ] **Step 1: Compose the journey**

```tsx
import * as motion from "motion/react-client";
import { FeaturesSectionWithHoverEffects } from "@/components/home/galaxy/features";
import { BenchTeaser } from "@/components/home/galaxy/bench-teaser";
import { Testimonials } from "@/components/home/galaxy/testimonials";
import { Constellation } from "@/components/home/galaxy/constellation";
import OpenSource from "@/components/home/galaxy/github";
import { CoreCta } from "@/components/home/galaxy/core-cta";
import { config } from "@/app.config";

// Each arm reveals once as it enters the viewport — drifting in like matter
// falling toward the core. Reduced-motion users get plain opacity.
const Arm = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 28, rotate: -0.4 }}
    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.55, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

export default function SpiralSections() {
  return (
    <>
      <Arm><FeaturesSectionWithHoverEffects /></Arm>
      <Arm delay={0.1}><BenchTeaser /></Arm>
      <Arm delay={0.1}><Testimonials /></Arm>
      <Arm delay={0.1}><Constellation /></Arm>
      <Arm delay={0.1}><OpenSource repository={config.repository} /></Arm>
      <CoreCta />
    </>
  );
}
```

(Check `classic/github.tsx` for whether `OpenSource` is the default export and takes `repository` — mirror exactly what `classic-sections.tsx:42` does today.)

- [ ] **Step 2: Swap the default home**

`app/(home)/page.tsx` — replace `ClassicHome` with `SpiralHome`:

```tsx
import { SpiralHome } from "./spiral-home";
import { ChadHome } from "./chad-home";

// Default landing is the spiral journey. The brutalist/chad redesign lives on
// as an easter egg, shown whenever `?chad` is present in the URL.
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ chad?: string }>;
}) {
  const { chad } = await searchParams;
  return !chad ? <SpiralHome /> : <ChadHome />;
}
```

- [ ] **Step 3: Build + smoke**

Run: `pnpm build` → exit 0, 59 pages.
Run: `pnpm exec next start -p 3199 &` then `curl -s http://localhost:3199/ | grep -c "brightest core"` → ≥1, and `curl -s "http://localhost:3199/?chad" | grep -ci "chad"` → ≥1. Kill the server.

---

### Task 10: Delete classic + final verification

**Files:**
- Delete: `app/(home)/classic-home.tsx`, `app/(home)/classic-sections.tsx`
- Delete: `components/home/classic/` (5 files), `components/ui/classic/` (1 file)
- Maybe delete: `components/ui/grid-bg.tsx`, `components/ui/grid-layout.tsx` — only if `grep -rn "grid-bg\|grid-layout" app components --include="*.tsx"` shows no remaining importers.

- [ ] **Step 1: Verify nothing imports classic, then delete**

Run: `grep -rn "classic" app components --include="*.tsx" | grep -v chad` → only the files being deleted reference each other. Then delete the files listed above.

- [ ] **Step 2: Full gate**

Run: `pnpm exec tsc --noEmit` → exit 0.
Run: `pnpm lint` → clean.
Run: `pnpm build` → exit 0.

- [ ] **Step 3: Smoke + visual checklist (manual, with dev server)**

- `/` renders: galaxy hero, 5 arms in order, core CTA.
- `/?chad` untouched.
- DevTools → emulate `prefers-reduced-motion: reduce` → static fallback, no canvas.
- Mobile viewport (375px): constellation collapses to grid; galaxy fallback visible.
- Lighthouse on `/`: LCP < 2.5s (hero text, not canvas).

**Do NOT commit — report results and stop.**

---

## Self-review notes

- Spec coverage: hero ✓ (T2-4), arms I-V ✓ (T5-8), core ✓ (T8), compose+swap ✓ (T9), classic deletion ✓ (T10), tokens ✓ (T1), reduced-motion ✓ (T3 bail + T1 media query), hydration safety ✓ (T7 fixed positions), LCP ✓ (T4 ssr:false + server fallback).
- Known checks-at-implementation: Discord icon API (T8), `OpenSource` export shape (T9), bench median real values (T6), constellation quotes verbatim (T7). These are verify-against-source steps, not placeholders — the source file and location is named in each.
- `geist/font/mono` import: geist package ships `GeistMono` at that path (same pattern as `geist/font/sans` used in `app/guide/layout.tsx`). If the named export differs, mirror how the guide layout imports GeistSans.
