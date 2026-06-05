---
target: spiral landing full pass
total_score: 28
p0_count: 0
p1_count: 0
timestamp: 2026-06-05T20-30-54Z
slug: app-home-spiral-home-tsx
---
# Critique — Seyfert spiral landing (full impeccable pass)

## Design Health Score (Nielsen, landing framing)
| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of system status | 3 |
| 2 | Match system/real world | 4 |
| 3 | User control & freedom | 3 |
| 4 | Consistency & standards | 4 |
| 5 | Error prevention | n/a |
| 6 | Recognition over recall | 4 |
| 7 | Flexibility & efficiency | 3 |
| 8 | Aesthetic & minimalist | 4 |
| 9 | Error recovery | n/a |
| 10 | Help & documentation | 3 |
| **Applicable total** | | **28/32 (~3.5 avg)** |

## Audit Health Score (technical)
| Dimension | Score | Note |
|---|---|---|
| Accessibility | 3→4 | tabs ARIA completed, focus rings added, copy hit-area 33×37 |
| Performance | 4 | GPU −68% measured, 60fps cap, CLS 0, SSR shiki |
| Theming | 4 | astro/brand token split enforced |
| Responsive | 3 | 375-1440 verified; orbit affordance pending |
| Anti-patterns | 3 | detector: 2 hits, both the owner-locked hero gradient |
| **Total** | **17-18/20** | Good→Excellent |

## Anti-pattern verdict
NOT AI slop. Numbered arms = real journey sequence (allowed); palette discipline is the moat; only flirt: aphorism cadence was at 5 instances (trimmed to 4).

## Fixed this round (P1s)
- Invisible keyboard focus on toolkit tabs + orbit buttons → indigo focus-visible rings
- Copy buttons 9×13px → 33×37px hit area (p-3/-m-3)
- Full ARIA tabs pattern (aria-controls, tabpanel, roving tabindex, arrow keys)
- Versus code overflow at ≥1280 → 0 overflows (split long lines)
- Hero cold-start flash → fallback fades only after first composited frame
- Aphorism cadence 5→4 ("built in, not bolted on" → plain)

## Open (owner decisions)
- No footer after finale (silent-ending tradeoff) — recommend tiny mono line
- Mid-scroll docs on-ramp absent
- Orbit moons affordance hint
- Em dashes in copy (skill ban vs approved voice)
- Hero gradient text (owner-locked identity)

## Personas
- Jordan: versus lands; overflow fixed
- Riley: focus rings now visible everywhere interactive
- Casey: fallback hero graceful; copy buttons now tappable
