# Spiral Landing — Design

**Date:** 2026-06-03
**Status:** Approved (brainstorm with FreeAoi)
**Scope:** Landing only (`/`). Guide/blog re-theme deferred to a later phase.

## Concept

Seyfert galaxies have the brightest active nuclei in the universe. The landing
becomes a "spiral journey": the visitor enters through the outer arms and
scrolls toward the core, where the final CTA lives.

Concept language: active nucleus = your bot/core · accretion disk = plugins
and adapters · luminosity = benchmarks · constellation = community bots ·
"observed by" = testimonials.

Intensity: **hybrid** — spectacular WebGL hero + normal vertical scroll with
scroll-triggered reveals. No scroll-jacking.

## Page structure (`/`)

| Order | Section | Content |
|---|---|---|
| Hero | WebGL spiral galaxy | ogl particles in logarithmic arms, bright AGN core, version badge (v4.3.0 placeholder), headline, CTAs (Get Started, npm copy), "scroll into the core ↓" |
| Brazo I — ARSENAL | Features | 6 cards migrated from classic, orbital reveal (motion whileInView) |
| Brazo II — LUMINOSIDAD | Benchmark teaser (new) | Static mini-chart of a winning metric + link to /benchmark |
| Brazo III — OBSERVADO POR | Testimonials | Current 3 quotes, cosmic skin |
| Brazo IV — CONSTELACIÓN | Used By | 8 community bots as stars connected by constellation lines; hover = bot card; collapses to grid on <md |
| Brazo V — OPEN SOURCE | GitHub stats | Existing fetch component re-skinned; contributors as star cluster |
| Núcleo | Final CTA | Max glow, "Ignite your core", Get Started + Discord, compact footer |

- Arm labels: monospace astronomical annotations (discreet heir of chad's
  section stamps).
- Content is 100% migrated from classic except the benchmark teaser.
- `?chad` easter egg stays untouched. Classic components are deleted at the end.

## Visual theme

Palette:
- `--space-void #030308` (landing bg) · `--space-deep #0a0a14` (surfaces)
- `--accent-indigo #818cf8` (primary) · `--accent-cyan #67e8f9` (labels/links)
- `--accent-violet #c084fc` (secondary gradients)
- `--star-gold #fbbf24` — rationed: version badge, core, featured star only
- `--core-white #fff→#c7d2fe` (core glow) · `--text-bright #f1f5f9`

Typography: Geist Sans (already in deps) for headlines/body; Geist Mono for
astronomical annotations (same package, no new deps). Gradient text only on
the key word of a headline.

Motion rules:
- Galaxy rotation ~1 rev/3min, mouse parallax ±2°.
- Reveals fire once per section, 400–600ms.
- `prefers-reduced-motion`: static galaxy image, opacity-only reveals.
- Never hijack scroll.

## Architecture

```
app/(home)/
  page.tsx              → ?chad routing intact; default becomes SpiralHome
  spiral-home.tsx       → hero + journey composition (replaces classic-home)
  spiral-sections.tsx   → 5 arms + core (replaces classic-sections)

components/home/galaxy/
  galaxy-canvas.tsx     → ogl WebGL: particle spiral + AGN core
                          (evolution of existing components/ui/particles.tsx)
  galaxy-fallback.tsx   → static radial gradient (no-WebGL / reduced-motion)
  arm-label.tsx         → monospace annotation "BRAZO I — ARSENAL"
  constellation.tsx     → bot star chart (SVG + current avatars)
  bench-teaser.tsx      → static mini-chart + /benchmark link
  features.tsx, testimonials.tsx, github.tsx, core-cta.tsx
                        → migrated from classic/, cosmic skin
```

Technical decisions:
- `galaxy-canvas` is a client component loaded with `dynamic(..., {ssr:false})`;
  the server-rendered fallback sits underneath so **LCP is the hero text, not
  the canvas**.
- Runtime WebGL detection: `getContext('webgl2')` failure → static fallback,
  no visible error. Canvas wrapped in an error boundary → fallback.
- Constellation star positions are fixed constants (no Math.random in render —
  hydration safety). Collapses to a normal grid below `md`.
- Version is a **hardcoded v4.3.0 placeholder**; manual swap when v5/v4.4 ships.
- Cleanup at the end: delete `components/home/classic/`,
  `components/ui/classic/`, `classic-home.tsx`, `classic-sections.tsx`.

## Implementation approach

WebGL via **ogl** (already a dep, ~30KB; boilerplate exists in
components/ui/particles.tsx). Rejected: SVG/CSS-only (too flat for the wow
goal) and react-three-fiber (+500KB bundle, LCP risk). Section reveals via
**motion** (already used in sections.tsx).

## Verification plan

- `pnpm build` + `pnpm lint` green.
- Smoke test `/` and `/?chad` (200 + visual).
- Lighthouse on `/`: LCP < 2.5s, no regression vs current landing.
- Manual mobile viewport pass; constellation grid collapse.
- `prefers-reduced-motion` emulated in devtools → static experience.

## Out of scope (deferred)

- Guide/blog cosmic re-theme + release banner (palette above is the reference
  when that phase starts).
- Dedicated release page.
- Dynamic version from npm registry.
