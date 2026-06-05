# Design

Visual system of the Seyfert spiral landing (`.spiral-page` scope). Captured from shipped code; identity-preserving — these are committed brand choices, not suggestions.

## Theme

Astrophotographic observatory editorial on deep blue-black space. Dark is structural, not aesthetic: the page IS the night sky around an active galactic nucleus. Never pure black.

## Color

Two strictly separated families. Mixing them is a bug.

### Space (surfaces)
- `--space-void: #05070d` — page background
- `--space-deep: #0a0e18` — card/editor surfaces (with /70 alpha + border-white/10)

### ASTRO family (reserved for the cosmos ONLY: black hole, orbital plates, core glows)
- `--core-amber: #ffd9a0`
- `--core-white: #fff4e2`
- `--dust-copper: #b4683c`
- `--star-blue: #c8d8f0`

### BRAND family (all UI accents: headings, links, accents, receipts)
- `--brand-indigo: #818cf8` (primary accent; the single-color accent for heading spans, hovers, active states)
- `--brand-purple: #a855f7` (gradient mid, bench bar gradient end)
- `--brand-blue: #2563eb` (gradient end)
- Hero h1 keeps the legacy animated gradient indigo-400 → purple-500 → blue-600 (owner-locked identity element; the ONLY gradient text on the site)

### Text
- `--text-bright: #fafafa` — headings, emphasized inline
- `--text-dim: #a3a3a3` — body, captions (on #05070d ≈ 8.7:1, AA-safe)

## Typography

- **Geist Sans** (`GeistSans`): all prose and headings. Semibold for headings, tracking -0.01em to -0.02em.
- **Geist Mono** (`GeistMono`): the instrument voice — eyebrows, arm labels, annotations (`F-0N`, `// comments`), captions, receipts, code. Usually 9-11px, uppercase, tracking 0.15-0.3em.
- Scale: h1 4xl→6xl (hero), section h2 = text-4xl semibold leading-[1.05], row h3 = text-lg semibold, body = 15px relaxed.
- Headings use a plain + single-indigo-accent-span pattern ("Everything you need to **ship**").

## Layout grammar

- **Editorial split**: every content section is a 12-col grid — sticky masthead rail left (`lg:col-span-4`: ArmLabel + h2 + short paragraph), instrument right (`lg:col-span-8 lg:col-start-5`).
- **ArmLabel**: mono `0N · NAME` markers, 01→06; a deliberate journey sequence (falling toward the core), not decorative eyebrows.
- **Surface rule: cards hold code, prose lives in rows.** Editor cards = rounded-lg, border-white/10, bg space-deep/70, top bar with mono filename + copy button. Prose = hairline rows (border-b border-white/8, first:border-t), px-5 py-6.
- Section spacing: `space-y-32` between arms; max-w-6xl container.

## Components

- **EditorCard**: filename tab (indigo hairline underline when accented) + label + CopyButton; shiki-rendered body (vesper theme, lang ts, via `lib/highlight.ts`).
- **ToolkitTabs**: mono uppercase tab rail (active = indigo border-b), one editor card, mono caption below.
- **FeatureRow** (manifest): `F-0N` mono index + bare 18px lucide icon + title/description + right-aligned `✓ PROOF` receipt; row hover = bg-white/[0.02] + indigo tint on index/icon.
- **Bench rows**: mono name + track bar (indigo→purple gradient for seyfert, white/10 others) + tabular MB.
- **CopyButton**: icon-only ⧉→✓ (1.6s), aria-label carries the words.
- **Buttons**: primary = rounded-none bright bg + void text ("Get started →"); secondary = mono uppercase tracked link ("DISCORD ↗").

## Motion

- Section reveals: whileInView fade+rise (y:28→0, 0.6s, ease [0.22,1,0.36,1]), once, -80px margin.
- Hero canvas: raymarched black hole with its own intro (2.5s ease-out-quint), 60fps-capped, adaptive quality governor; mobile <768px and prefers-reduced-motion get a static CSS fallback.
- Micro: color transitions 200ms; contributor avatars spring hover; Kirby easter egg via WAAPI (transform-only).
- `prefers-reduced-motion`: canvas bails entirely; CSS pulse animations disabled.

## Voice anchors (copy)

- Mono microcopy in code-comment form: `// one hour here is seven years in discord.js`.
- Hidden winks as `title` attributes (~1 per section max).
- Receipts pattern: `✓ 0 'AS ANY'`, `0 LOADERS · 0 DISPATCHERS · 0 DEPLOY SCRIPTS`.
