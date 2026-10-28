# Design archive

Past and proposed seyfert.dev landings, each rebuilt from its own commit and
served at its own route. The catalog (names, dates, source commits) lives in
`lib/design-archive.ts`; the unlisted index at `/archive` renders it. Reveal is
the public home at `/`, and `/reveal` redirects there. The catalog has no
links from the landings and is excluded from search results.

| Route | Source | What is here |
| --- | --- | --- |
| `/original` | `b5ddcce` (on `368b8ac`) | `original-2024/`: PandaCSS page ported to Tailwind |
| `/v2` | `6c3b533` | `v2-2024/`: PandaCSS page ported to Tailwind |
| `/classic` | `48dfd0a` | `classic/src/`: verbatim snapshot |
| `/chad` | `bbdfb03` | `chad/src/`: verbatim snapshot |
| `/spiral` | `509cf65` | `spiral/src/`: verbatim snapshot (own galaxy renderer) |

`/cygnus`, `/journey`, `/journey-refined` and `/` are current code under
`app/(home)` and `components/home`.

## Snapshots

`classic/src`, `chad/src` and `spiral/src` are the files reachable from each
landing at its commit, copied with `git show` and their `@/` imports pointed at
the snapshot (`app/(home)/*` lives in `src/app-home/`). Shared helpers that
haven't changed since (`lib/utils`, `lib/github`, `lib/highlight`,
`components/ui/button` for spiral) are imported from the live tree.

Deliberate changes, all marked in place where they touch code:

- Navbars float over the hero only on `/`; the snapshots check their new
  route instead (`/classic`, `/chad`). The live navbar does the same for
  `/cygnus` and `/spiral`; Reveal uses an in-flow navbar at `/`.
- Bot avatars point at today's `/bots/thumbs/*` (the same images,
  downscaled) instead of restoring ~8 MB of original PNGs.
- Spiral's static first frame was deleted with Cygnus; it is restored from
  `509cf65` into `public/archive/spiral/`.

## 2024 pages

The 2024 site used PandaCSS 0.40 with two `theme-colors` scales, Tabler
icons and Inter. Instead of reviving Panda's codegen, `legacy-2024/` replays
the same tokens: the generated colour scales as scoped CSS variables, Panda's
preset sizes as Tailwind classes, the exact Tabler v3.5 glyphs inlined, and
the magicui particles component (its rAF loop now stops on unmount). Copy and
numbers are untouched; links to `docs.seyfert.dev` (gone) point at `/docs`
and the 2.2.0 changelog link at the GitHub releases.
