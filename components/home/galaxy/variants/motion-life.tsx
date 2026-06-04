"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Program, Mesh, Triangle } from "ogl";

// Interstellar-style black hole (Gargantua) — the active nucleus of a Seyfert
// galaxy IS an accreting supermassive black hole, so this is the literal
// astrophysical object behind the brand name.
//
// Technique: one full-viewport triangle, one analytic fragment shader. No
// raymarching — the lensing is faked with SDF-style composition:
//   1. background starfield (hash threshold → sharp 1px stars)
//   2. lensed TOP + BOTTOM accretion arcs (half-ellipses bent over/under)
//   3. black event-horizon disc (occludes — the only place alpha → 1)
//   4. photon ring (thin gaussian, doppler-brighter on one side, bloomed)
//   5. front accretion band — LIVING PLASMA (sheared filaments, see below)
//
// ── ACCRETION DISK (prior dimension, preserved) ──
// The flat band is a sheared plasma sheet: differential rotation (Keplerian
// shear ∝ t/r^1.5), domain-warped multi-scale FBM filaments, orbiting hot
// clumps, a razor ISCO lip, doppler COLOR asymmetry and vertical puffing — all
// gated behind a cheap band-proximity mask.
//
// ── CINEMATIC GRADE (prior dimension, preserved) ──
// A display-referred colorist pass below the \"CINEMATIC GRADE\" marker: ACES-fit
// filmic tone curve, lifted-black toe (#05070d), edge-aware chromatic
// aberration, hole-anchored vignette, fine animated film grain, per-star color
// temperature and an inner-white/outer-ember temperature ramp.
//
// ── TEMPORAL LIFE & CHOREOGRAPHY (this build's pushed dimension) ───────────
// Layered on top, all driven analytically from uTime / uIntro / uZoom — there
// is NO per-frame CPU randomness. The scene is alive but reads as cinema:
//   A. Intro reveal: scene exposure eases up from black over 2.5s while the
//      camera drifts the last 5% into place (ease-out-quint, shader-side via
//      uIntro). The lifted toe, grain and horizon occlusion all fade in with
//      it, so first paint is a clean fade-from-black, not a hard cut.
//   B. Precession + breath: the disk tilt oscillates ±0.03 rad over ~45s and
//      the whole system breathes (scale + exposure) almost imperceptibly.
//   C. Photon-ring glints: every ~7–15s (hash-scheduled, deterministic) a
//      bright arc sweeps the ring core, then fades. It feeds the CA edge key,
//      so the grade reacts to each glint.
//   D. Star twinkle in 2 layers (fast subtle + slow deep) and 1–2 background
//      stars occasionally flare with a tiny diffraction cross.
//   E. Scroll dive eases with smoothstep and the system counter-tilts + noses
//      down while diving, so it feels like physical approach, not a flat zoom.
// All temporal state is wall-clock accumulators (not raw RAF time), so the
// IntersectionObserver pause resumes cleanly.
//
// Premultiplied-alpha contract: gl_FragColor = vec4(col * a, a). Alpha tracks
// luminance so empty space stays transparent and the CSS fallback shows
// through — except inside the horizon, where alpha is forced opaque black so
// the hole genuinely occludes the page behind the canvas.

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uCenter;   // hole center in NDC-ish space (right-of-center wide)
  uniform float uZoom;     // scroll dive 0..1 (smoothstep-eased CPU-side)
  uniform float uScale;    // system scale (smaller on narrow screens)
  uniform vec2  uTilt;     // mouse parallax (radians-ish, tiny)
  uniform float uIntro;    // cinematic mount reveal 0..1 (ease-out-quint)

  // ── astrophotographic palette (locked: no neon, no cyan/purple) ──
  const vec3 HOT   = vec3(1.000, 0.957, 0.886); // #fff4e2 warm white
  const vec3 WARM  = vec3(1.000, 0.851, 0.627); // #ffd9a0 amber
  const vec3 COPPER= vec3(0.706, 0.408, 0.235); // #b4683c coppery edge
  const vec3 STAR  = vec3(0.784, 0.847, 0.941); // #c8d8f0 cool white-blue
  // lifted-black toe: shadows settle here instead of crushing to 0,0,0
  const vec3 TOE   = vec3(0.0196, 0.0275, 0.051); // #05070d deep-space lift

  // ── tunables ──
  #define HOLE_R   0.255   // event-horizon radius (in local units)
  #define RING_W   0.011   // photon-ring thickness
  #define DISK_TILT -0.42  // accretion band diagonal angle (radians, base)
  #define BEAM      0.70   // doppler beaming asymmetry 0..1
  #define DRIFT     0.045  // base disk scroll speed
  #define STAR_DENSITY 0.955

  // ── accretion-disk plasma tunables ──
  #define ISCO_R    0.030  // inner-edge offset from horizon (razor lip radius)
  #define SHEAR     2.9    // differential-rotation strength (winding rate)
  #define SHEAR_PIV 0.34   // pivot radius for the 1/r^1.5 shear law
  #define WIND_TIME 0.85   // how fast the whole field orbits (azimuth/sec base)
  #define FIL_SCALE 2.35   // azimuthal frequency of the fine filaments
  #define CLUMP_THR 0.62   // brightness-clump threshold (higher → fewer knots)
  #define CLUMP_GAIN 2.4   // hot-clump intensity
  #define PUFF      0.30   // vertical-thickness undulation depth 0..1
  #define OUTER_FRAY 1.55  // radius where outer tendrils fade out

  // ── CINEMATIC GRADE tunables (named for the colorist) ──
  #define GRAIN_AMOUNT  0.015  // film-grain amplitude (~1.5%)
  #define GRAIN_SHADOW  1.6    // extra grain weighting toward the toe
  #define CA_STRENGTH   1.00   // master chromatic-aberration gain (0 = off)
  #define CA_GAMMA      1.35   // how sharply CA ramps with local edge energy
  #define VIGNETTE_AMT  0.60   // hole-anchored vignette depth 0..1
  #define VIGNETTE_RAD  1.55   // vignette falloff radius (local units)
  #define BLOOM_HALO    0.42   // wide believable halo gain around the ring
  #define TEMP_WHITEN   0.55   // inner-rim whitening strength
  #define TEMP_EMBER    0.85   // outer-rim ember-copper strength
  #define EXPOSURE      1.05   // pre-tonemap exposure trim

  // ── TEMPORAL choreography tunables (this build) ──
  #define PRECESS_AMP    0.03   // disk-tilt precession amplitude (rad)
  #define PRECESS_PERIOD 45.0   // precession period (s)
  #define BREATH_PERIOD  19.0   // whole-system breath period (s)
  #define BREATH_SCALE   0.010  // breath zoom depth (fraction)
  #define BREATH_EXPO    0.05   // breath exposure depth (fraction)
  #define GLINT_AVG      11.0   // average seconds between ring glints
  #define GLINT_SPREAD   4.0    // ± jitter on glint spacing (→ ~7–15s window)
  #define GLINT_LIFE     1.7    // glint travel/fade duration (s)
  #define TWINKLE_FAST   3.1    // fast twinkle layer rate
  #define TWINKLE_SLOW   0.5    // slow deep twinkle layer rate
  #define DIVE_TILT      0.10   // counter-tilt amount at full dive (rad)
  #define DIVE_NOSE      0.06   // downward framing lift at full dive

  // ---------- hashing / noise ----------
  float hash11(float n) { return fract(sin(n) * 43758.5453123); }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  // 3D hash for animated film grain (decorrelated per frame via time slot)
  float hash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i + vec2(0.0, 0.0));
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  // 4-octave FBM — capped for perf (used by background / haze)
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * vnoise(p);
      p = p * 2.02 + 11.3;
      amp *= 0.5;
    }
    return v;
  }

  // 3-octave FBM — cheaper inner core for the plasma warp + clumps
  float fbm3(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      v += amp * vnoise(p);
      p = p * 2.03 + 7.7;
      amp *= 0.5;
    }
    return v;
  }

  mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  // soft band profile around 0
  float band(float x, float w) {
    return exp(-x * x / (w * w));
  }

  // ---------- CINEMATIC GRADE: ACES-fit filmic tone curve ----------
  // Narkowicz ACES approximation, applied per-channel. Replaces the reinhard
  // divide: protects warm highlights (no white-clipping desat) and rolls the
  // shoulder gently — the movie-still contrast curve, not a clinical divide.
  vec3 acesFilmic(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  // Differential-rotation azimuth offset: inner radii lead, ∝ t / r^1.5.
  // Capped near the center so the singular term can't explode.
  float shearAngle(float rad, float t) {
    float rr = max(rad, SHEAR_PIV * 0.5);
    return SHEAR * pow(SHEAR_PIV / rr, 1.5) * t;
  }

  // ── C. deterministic ring-glint scheduler ────────────────────────────────
  // Time is bucketed into variable-length slots (~7–15s, hash-jittered). Each
  // slot fires exactly one glint with its own start angle, travel direction and
  // lifetime, so the timeline is fully reproducible from uTime with zero CPU
  // bookkeeping. We scan a tiny window of slots so boundaries never drop one.
  // Returns: x = intensity envelope (0..1), y = the glint's angle along ring.
  vec2 ringGlint(float t) {
    float intensity = 0.0;
    float angle = 0.0;
    float kGuess = floor(t / GLINT_AVG);
    for (int i = -1; i <= 1; i++) {
      float k = kGuess + float(i);
      // slot start = cumulative average + per-slot deterministic jitter
      float jitter = (hash11(k * 1.7 + 4.0) - 0.5) * 2.0 * GLINT_SPREAD;
      float start  = k * GLINT_AVG + jitter;
      float age = t - start;
      if (age < 0.0 || age > GLINT_LIFE) continue;
      float u = age / GLINT_LIFE;                 // 0..1 over the glint life
      // asymmetric envelope: quick attack, slow decay
      float env = smoothstep(0.0, 0.18, u) * (1.0 - smoothstep(0.35, 1.0, u));
      // hashed start angle; travels a short arc along the ring
      float a0 = hash11(k * 3.3 + 1.0) * 6.2831853;
      float dir = hash11(k * 5.1) > 0.5 ? 1.0 : -1.0;
      angle = a0 + dir * 2.4 * u;
      intensity = max(intensity, env);
    }
    return vec2(intensity, angle);
  }

  void main() {
    // aspect-correct coordinates, origin at the hole center
    vec2 res = uResolution;
    float aspect = res.x / res.y;
    vec2 ndc = (vUv * 2.0 - 1.0);
    ndc.x *= aspect;

    // ── B. system breath: imperceptible scale + exposure pulse ──────────────
    float breath = sin(uTime * 6.2831853 / BREATH_PERIOD);
    float breathScale = 1.0 + breath * BREATH_SCALE;

    // ── A. intro camera drift: start ~5% wider, settle (ease-out-quint) ─────
    // uIntro arrives already eased 0..1 from the CPU; it only nudges framing
    // the final few percent here, so there is zero layout shift on mount.
    float introZoomOut = (1.0 - uIntro) * 0.05;

    // ── E. scroll dive: uZoom is smoothstep-eased CPU-side; the system also
    // counter-tilts + noses down while diving so it reads as physical approach
    // rather than a flat zoom. ──
    float dive = uZoom;
    float zoom = (1.0 - dive * 0.22 + introZoomOut) * uScale * breathScale;
    vec2 p = (ndc - uCenter) / zoom;

    // whole-system tilt: mouse parallax (±2°) + gentle counter-tilt on dive
    float counterTilt = -dive * DIVE_TILT;
    p = rot(uTilt.x * 0.5 + counterTilt) * p;
    p += uTilt * 0.04;
    p.y -= dive * DIVE_NOSE; // camera noses down toward the disc as we dive in

    float r = length(p);

    vec3 col = vec3(0.0);

    // ── B. precession: the disk tilt oscillates slowly (±PRECESS_AMP) ───────
    float precess  = sin(uTime * 6.2831853 / PRECESS_PERIOD) * PRECESS_AMP;
    float diskTilt = DISK_TILT + precess;

    // ===== 1. background starfield (behind everything) =====
    {
      vec2 sp = ndc * 2.2;
      sp = rot(uTilt.x * 0.5 + counterTilt * 0.6) * sp + uTilt * 0.3;
      vec2 cell = floor(sp * 14.0);
      float h = hash21(cell);
      // sparse: only cells above threshold spawn a star
      if (h > STAR_DENSITY) {
        vec2 f = fract(sp * 14.0) - 0.5;
        // jitter star within its cell
        f -= (vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5) * 0.7;
        float d = length(f);

        // ── D. two-layer twinkle: fast subtle shimmer + slow deep swell ─────
        float ph   = h * 40.0;                     // per-star phase offset
        float fast = 0.10 * sin(uTime * TWINKLE_FAST + ph);
        float slow = 0.30 * sin(uTime * TWINKLE_SLOW + ph * 0.37);
        float tw   = clamp(0.62 + fast + slow, 0.15, 1.2);

        // a few stars are bigger and warmer (photographic variety)
        float big = step(0.9988, h);
        float rad = mix(0.06, 0.16, big);
        float s = smoothstep(rad, 0.0, d) * tw;
        // ── per-star color temperature jitter (grade dimension): cool blue-
        //    white → neutral → warm amber, never a uniform tint ──
        float temp = hash21(cell + 91.7);                 // 0 cool .. 1 warm
        vec3 cool  = mix(STAR, vec3(0.93, 0.95, 1.0), 0.35);
        vec3 starCol = mix(cool, WARM, smoothstep(0.5, 1.0, temp));
        starCol = mix(starCol, WARM, big * 0.6);          // anchors skew warm
        col += starCol * s * mix(1.7, 2.6, big);

        // ── D. occasional diffraction-cross flare on a rare star ────────────
        // each eligible star flares on its own slow, hash-offset cycle; only a
        // sharp peak of the cycle lights the cross, so 1–2 are ever active.
        float flareSel = step(0.9978, h);          // eligibility (rare)
        float fCycle   = fract(uTime / 13.0 + h * 7.3);
        float fEnv     = pow(max(0.0, 1.0 - abs(fCycle - 0.5) * 7.0), 3.0);
        float flareAmt = flareSel * fEnv;
        if (flareAmt > 0.001) {
          // thin horizontal + vertical spikes (anamorphic diffraction cross)
          float cross = exp(-abs(f.x) * 26.0) * exp(-abs(f.y) * 2.2)
                      + exp(-abs(f.y) * 26.0) * exp(-abs(f.x) * 2.2);
          col += mix(starCol, HOT, 0.6) * cross * flareAmt * 1.4;
        }
      }
      // faint dust haze so space isn't pure black (still transparent-ish)
      float haze = fbm(ndc * 1.3 + 5.0) * 0.04;
      col += mix(vec3(0.02, 0.03, 0.05), COPPER * 0.12, haze) * haze * 2.5;
    }

    // accretion-disk local frame: rotate so the band runs diagonally
    // (uses the precessing tilt so the whole disc slowly nods over ~45s)
    vec2 dp = rot(-diskTilt) * p;
    // disk longitude used for doppler + streak scroll
    float lon = atan(dp.y, dp.x);
    // approaching side (left) is blue-shifted & beamed brighter
    float doppler = 0.5 + 0.5 * cos(lon); // 1 on +x, 0 on -x
    float beamL = mix(1.0, 1.0 - BEAM, doppler);   // brighter on left
    float beamR = mix(1.0, 1.0 - BEAM, 1.0 - doppler);

    // ── temperature ramp across the disk: 0 at inner rim, 1 at outer limb.
    //    Drives the whiten-inner / ember-outer grading on the haze + band.
    float tempRamp = smoothstep(HOLE_R, HOLE_R + 0.55, r);

    // ── differential-rotation advection field (plasma dimension) ──
    // A sheared azimuth: every radius orbits at WIND_TIME, but inner radii get
    // an EXTRA twist ∝ 1/r^1.5 so filaments wind & stretch over time.
    float windBase = uTime * WIND_TIME;
    float swirl    = lon + shearAngle(r, uTime) - windBase;
    float radialN  = (r - HOLE_R) * 6.0; // radial sample coord (cross-streak)

    // cheap proximity gate: only pixels near the disk plane / within reach pay
    // for the multi-octave plasma sampling. Off-disk → ~0, skip the cost.
    float diskNear = band(dp.y, 0.42) * smoothstep(OUTER_FRAY + 0.4, HOLE_R, r);

    // base streaks (kept for the lensed arcs + haze; always-on but cheap-ish)
    float streakU = swirl * FIL_SCALE;
    float streakV = radialN;
    float streaks = fbm(vec2(streakU, streakV)) * 0.55 + 0.45;
    streaks = mix(0.75, 1.25, streaks);

    // ── living filaments: domain-warped multi-scale FBM, advected by shear ──
    float filaments = 0.5;
    float clumps    = 0.0;
    if (diskNear > 0.002) {
      vec2 warpQ = vec2(swirl * 0.9, radialN * 0.6);
      float wx = fbm3(warpQ + 3.1) - 0.5;
      float wy = fbm3(warpQ + 9.4) - 0.5;
      vec2 fil = vec2(streakU + wx * 1.3, streakV * 1.6 + wy * 1.1);
      float broad = fbm3(fil);
      float fine  = fbm3(fil * vec2(2.3, 1.4) + 17.0);
      filaments = mix(broad, fine, 0.45);
      filaments = pow(clamp(filaments * 1.25, 0.0, 1.0), 1.6);

      // bright orbiting clumps: low-octave field, advected & thresholded,
      // breathing in/out so knots slowly form and dissolve.
      float breathe = 0.5 + 0.5 * sin(uTime * 0.5 + swirl * 1.7);
      float cn = fbm3(vec2(swirl * 1.4 + 4.0, radialN * 0.8 - uTime * 0.06));
      cn = 0.5 * (cn + fbm3(vec2(swirl * 0.7 - 2.0, radialN * 1.3)));
      float thr = CLUMP_THR + 0.10 * breathe;
      clumps = smoothstep(thr, thr + 0.16, cn) * (0.6 + 0.4 * breathe);
    }

    // ===== 1b. luminous disc body (fusion with hybrid-haze) =====
    // wide soft haze hugging the disc plane + fine star dust — gives the
    // photographic milky body the bare analytic bands lacked
    {
      float hazeBand = band(dp.y, 0.20) * smoothstep(1.9, 0.15, r);
      float hazeNoise = fbm(vec2(dp.x * 2.0 - uTime * 0.02, dp.y * 9.0)) * 0.6 + 0.4;
      // temperature gradient: hotter (whiter) inner, ember-copper at the limb
      vec3 hazeCol = mix(mix(HOT, WARM, 0.4), COPPER, tempRamp * TEMP_EMBER);
      // brighter toward the approaching (left) limb
      float hazeBeam = mix(0.5, 1.5, smoothstep(0.6, -0.6, dp.x));
      col += hazeCol * hazeBand * hazeNoise * hazeBeam * 0.42;

      // fine star dust concentrated in the disc plane
      vec2 sd = vec2(dp.x, dp.y * 3.2) * 30.0;
      vec2 cell2 = floor(sd);
      float h2 = hash21(cell2 + 17.0);
      float discDensity = band(dp.y, 0.30) * smoothstep(1.9, 0.2, r);
      if (h2 > 1.0 - 0.18 * discDensity) {
        vec2 f2 = fract(sd) - 0.5;
        f2 -= (vec2(hash21(cell2 + 31.7), hash21(cell2 + 57.3)) - 0.5) * 0.6;
        float ds = length(f2);
        // disc dust shares the fast twinkle feel (fine grain → fast layer only)
        float tw2 = 0.7 + 0.3 * sin(uTime * 2.1 + h2 * 60.0);
        float s2 = smoothstep(0.20, 0.0, ds) * tw2;
        col += mix(STAR, WARM, hash21(cell2 + 3.3)) * s2 * 1.7;
      }
    }

    // ===== 2. lensed arcs (top + bottom, the bent far side) =====
    // The far side of the disk is lensed up & over and down & under the hole.
    {
      // distance from the hole rim, used to place the arcs just outside it
      float over = r - (HOLE_R + 0.022);
      float arc = band(over, 0.022);                  // thin radial shell
      // only the top & bottom (|p.y| dominant) read as the lensed arcs
      float tb = abs(p.y) / max(r, 0.001);
      float topbot = pow(smoothstep(0.3, 0.9, tb), 1.5);
      float a = arc * topbot;
      // warm gradient: hotter near rim, coppery outward
      vec3 arcCol = mix(WARM, COPPER, smoothstep(0.0, 0.08, over));
      arcCol = mix(arcCol, HOT, 0.4);
      // let the wound filaments modulate the arcs too (continuity with band)
      float arcStreak = mix(streaks, 0.6 + filaments, diskNear * 0.5);
      col += arcCol * a * arcStreak * 2.4;
    }

    // ===== 3. event horizon (true black disc, occludes) =====
    float holeMask = smoothstep(HOLE_R, HOLE_R - 0.010, r); // 1 inside
    // darken everything inside the rim toward black
    col *= (1.0 - holeMask);

    // Edge-energy field for the colorist passes: chromatic aberration + grain
    // key off high-contrast structures (ring, hotspot, glint) so empty text-
    // adjacent space gets zero fringing. Accumulated by the bright features.
    float edgeKey = 0.0;

    // ===== 4. photon ring (thin, bright, doppler-asymmetric, bloomed) =====
    {
      float x = r - (HOLE_R + RING_W * 0.5);
      // re-tuned bloom shoulders: a razor core (sharp), a tight inner halo,
      // and a wide believable atmospheric halo — the ring reads crisp WITH a
      // photographic glow instead of a clinical line.
      float core  = band(x, 0.0055) * 4.1;            // razor-sharp center
      float halo1 = band(x, 0.038)  * 0.62;           // tight glow
      float halo2 = band(x, 0.150)  * BLOOM_HALO;     // wide atmosphere
      float ring  = core + halo1 + halo2;
      // brighter on the approaching (left) limb
      float limb = mix(beamR, beamL, smoothstep(-0.2, 0.2, p.x));
      float brightness = mix(0.85, 2.1, limb);
      // inner rim of the ring reads whitest, cooling outward (temperature)
      vec3 ringCol = mix(mix(HOT, vec3(1.0), TEMP_WHITEN * 0.5), WARM, 0.5);
      col += ringCol * ring * brightness;
      // the sharp core is the strongest edge in frame → feeds CA + grain key
      edgeKey += core * brightness;

      // ── C. photon-ring glint: a bright arc sweeps the ring on a schedule ──
      vec2 g = ringGlint(uTime);
      if (g.x > 0.001) {
        float pa = atan(p.y, p.x);          // fragment angle around the hole
        float da = pa - g.y;                // angular distance to glint center
        da = atan(sin(da), cos(da));        // wrap to ±PI
        float arcLobe  = exp(-da * da / 0.06);   // tight angular lobe
        float ringCore = band(x, 0.010);         // ride on the ring core only
        float gl = ringCore * arcLobe * g.x;
        col += mix(HOT, WARM, 0.25) * gl * 2.6;
        edgeKey += gl * 2.2;                      // glint flickers the grade too
      }
    }

    // ===== 5. front accretion band — LIVING PLASMA =====
    {
      // ── vertical puffing: half-thickness undulates along the azimuth so the
      // silhouette breathes instead of being a clean gaussian ribbon ──
      float puffN = fbm3(vec2(swirl * 1.1 + 5.0, uTime * 0.05));
      float thickness = 0.052 * (1.0 + PUFF * (puffN * 2.0 - 1.0));
      thickness = max(thickness, 0.030);
      float bandMask = band(dp.y, thickness);

      // the FRONT of the disk crosses the hole (the Interstellar signature) —
      // slightly dimmer across the disc, full strength outside
      float front = smoothstep(HOLE_R * 0.5, HOLE_R * 1.1, abs(dp.x));

      // ── razor inner edge at the ISCO (just outside the photon ring) ──
      float iscoR  = HOLE_R + ISCO_R;
      float lip    = band(r - iscoR, 0.012) * 2.2; // razor-bright lip
      float bodyIn = smoothstep(iscoR - 0.006, iscoR + 0.05, r); // body starts at ISCO

      // ── wispy outer tendrils replace the old hard reach falloff ──
      float radialFade = smoothstep(OUTER_FRAY, HOLE_R + 0.02, r);
      float fray = mix(1.0, smoothstep(0.05, 0.6, filaments), 0.55);
      float reach = radialFade * mix(0.6, 1.0, fray);

      // base disk membership (body, gated to start at the ISCO lip)
      float m = bandMask * mix(0.5, 1.0, front) * bodyIn * reach;

      // ── plasma intensity from the advected filaments ──
      float plasma = (0.55 + 0.9 * filaments) + clumps * CLUMP_GAIN * bandMask;

      // color across the band: hot core line → amber → copper edges
      float edge = abs(dp.y) / thickness;
      vec3 bandCol = mix(HOT, WARM, smoothstep(0.0, 0.7, edge));
      bandCol = mix(bandCol, COPPER, smoothstep(0.7, 1.6, edge));
      // radial temperature: ember-copper bias outward, white the hot inner gas
      bandCol = mix(bandCol, COPPER, tempRamp * TEMP_EMBER * 0.4);
      bandCol = mix(bandCol, vec3(1.0), (1.0 - tempRamp) * front * TEMP_WHITEN * 0.3);

      // ── DOPPLER COLOR asymmetry (not just brightness) ──
      float side = smoothstep(0.7, -0.7, dp.x);    // 1 = approaching limb
      vec3 approachTint = mix(bandCol, HOT,    0.45);
      vec3 recedeTint   = mix(bandCol, COPPER, 0.45);
      bandCol = mix(recedeTint, approachTint, side);

      // doppler beaming: left limb brighter (on top of the color)
      float beam = mix(0.6, 1.8, side);

      col += bandCol * m * plasma * beam * 2.1;
      // razor lip rendered on top, warm-white, beamed
      col += mix(HOT, WARM, 0.25) * lip * bandMask * mix(0.7, 1.6, side) * front;

      // hotspot where the approaching flow grazes the ring (left limb)
      float hs = band(dp.y, 0.1) * exp(-pow((dp.x + HOLE_R * 1.25) / 0.22, 2.0));
      // let a clump passing through the hotspot flare it up
      col += mix(vec3(1.0), WARM, 0.28) * hs * (1.5 + clumps * 1.2);
      // hotspot is a high-contrast feature → also drives CA + grain key
      edgeKey += hs * (1.4 + clumps * 1.0);

      // anamorphic streak bleeding horizontally from the hotspot (lens flare)
      // anchored to the PRECESSING tilt so the flare nods with the disc
      vec2 hp = p + HOLE_R * 1.25 * vec2(cos(diskTilt), sin(diskTilt));
      float flare = exp(-abs(hp.y) * 22.0) * exp(-abs(hp.x) * 2.4);
      col += mix(HOT, WARM, 0.45) * flare * 0.9;
    }

    // ── B. breath exposure pulse (tiny, in lock-step with the scale breath) ─
    col *= 1.0 + breath * BREATH_EXPO;

    // ── A. intro exposure: ease scene-referred radiance up from black ───────
    // Applied to the linear signal BEFORE the grade so the ACES curve, bloom
    // and toe all roll in naturally — first paint is a true fade-from-black.
    col *= uIntro;

    // ======================================================================
    // ===================== CINEMATIC GRADE (post) =========================
    // ======================================================================
    // Above: scene-referred radiance. Below: the display grade, in DI order —
    // chromatic aberration → exposure → ACES filmic → lifted toe → saturation
    // → hole-anchored vignette → film grain.

    // ── edge-aware CHROMATIC ABERRATION ──
    // A single analytic pass can't re-sample neighbors, so we synthesize a
    // radial RGB split: bias red toward the outer rim, blue toward the inner
    // rim, scaled by the local edge energy AND radius. Near the photon ring /
    // hotspot the split blooms; over empty (text-adjacent) space edgeKey≈0, so
    // there is zero fringing where copy will sit.
    {
      float caAmt = pow(clamp(edgeKey, 0.0, 1.0), CA_GAMMA);
      // ramp slightly with radius so it reads as a lens-edge effect
      caAmt *= mix(0.55, 1.0, smoothstep(HOLE_R, HOLE_R + 0.20, r));
      float split = caAmt * CA_STRENGTH;
      float lum0 = dot(col, vec3(0.299, 0.587, 0.114));
      col.r += lum0 * split * 0.45; // red pushed outward
      col.b -= lum0 * split * 0.30; // blue pulled inward
      col = max(col, vec3(0.0));    // never let CA invent energy
    }

    // ── exposure trim, then ACES filmic tone curve (replaces reinhard) ──
    col *= EXPOSURE;
    col = acesFilmic(col);

    // ── lifted-black toe ──
    // Settle shadows onto deep #05070d space instead of crushing to 0,0,0.
    // Luminance-weighted so bright disk/ring are untouched. Pure black stays
    // reserved for the event horizon (re-forced at output). The lift itself is
    // scaled by uIntro so the toe stays at true black during the mount reveal.
    float toeLum = dot(col, vec3(0.299, 0.587, 0.114));
    float shadowW = (1.0 - smoothstep(0.0, 0.10, toeLum)) * uIntro;
    col = mix(col, max(col, TOE), shadowW);

    // ── gentle saturation rebuild after the curve (keep warmth) ──
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 1.2);

    // ── hole-anchored VIGNETTE ──
    // Anchored to the hole-local coordinate p (so it cups the Gargantua
    // composition wherever it sits), not the screen center. Warm-preserving.
    {
      float vd = length(p) / VIGNETTE_RAD;
      float vig = 1.0 - VIGNETTE_AMT * smoothstep(0.55, 1.25, vd);
      col *= vig;
    }

    // ── fine animated FILM GRAIN ──
    // Hash noise reseeded each frame (time slot), luminance-dependent: heavier
    // in the toe, almost gone in highlights (emulsion behavior), ~1.5% amp.
    // Driven in screen space so it never swims with parallax. Faded by uIntro
    // so grain doesn't crackle over the still-black opening frames.
    {
      float g = hash31(vec3(gl_FragCoord.xy, floor(uTime * 24.0))) - 0.5;
      float lumg = dot(col, vec3(0.299, 0.587, 0.114));
      float gw = mix(GRAIN_SHADOW, 0.35, smoothstep(0.0, 0.7, lumg));
      col += g * GRAIN_AMOUNT * gw * uIntro;
      col = max(col, vec3(0.0));
    }

    // ── premultiplied output ──
    // alpha follows luminance so empty space is transparent... EXCEPT the
    // event horizon, which must occlude the page → force alpha to 1 (black).
    float lum = max(col.r, max(col.g, col.b));
    float a = clamp(lum * 1.15, 0.0, 1.0);
    // the hole occludes only once the reveal has settled, so the page doesn't
    // flash a hard black disc before the scene has eased in.
    a = max(a, holeMask * uIntro);
    col *= (1.0 - holeMask);         // ...and stays true black
    gl_FragColor = vec4(col, a);
  }
`;

export default function GalaxyCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const probe = document.createElement("canvas");
        if (!probe.getContext("webgl2")) return;

        const renderer = new Renderer({
            depth: false,
            alpha: true,
            dpr: Math.min(window.devicePixelRatio, 2),
        });
        const gl = renderer.gl;
        container.appendChild(gl.canvas);
        gl.clearColor(0, 0, 0, 0);

        // The CSS fallback's warm glow fights the shader's black hole — fade
        // it out once WebGL is actually painting (it stays for no-WebGL users).
        const fallback = container.parentElement?.querySelector<HTMLElement>("[data-galaxy-fallback]") ?? null;
        if (fallback) fallback.style.opacity = "0";

        // ogl requires a camera arg to render(), even for a fullscreen triangle.
        const camera = new Camera(gl);

        const geometry = new Triangle(gl);

        const program = new Program(gl, {
            vertex,
            fragment,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [1, 1] },
                uCenter: { value: [0, 0] },
                uZoom: { value: 0 },
                uScale: { value: 1 },
                uTilt: { value: [0, 0] },
                uIntro: { value: 0 },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });

        // The hole sits right-of-center on wide screens (editorial text owns the
        // left), centered on narrow ones. uCenter is in the same aspect-scaled
        // NDC space the shader builds.
        const center: [number, number] = [0, 0];
        const resize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            const w = gl.canvas.width;
            const h = gl.canvas.height;
            const aspect = w / h;
            program.uniforms.uResolution.value = [w, h];
            center[0] = aspect > 1 ? 0.72 : 0;
            center[1] = aspect > 1 ? 0.04 : 0.78;
            program.uniforms.uCenter.value = center;
            // smaller system on narrow screens so the headline owns the frame
            program.uniforms.uScale.value = aspect > 1 ? 1 : 0.62;
        };
        window.addEventListener("resize", resize, false);
        resize();

        // ── mouse parallax (±2° tilt of the whole system) ──
        const PARALLAX = 0.035; // ~2° in shader radians
        const mouse = { x: 0, y: 0 };
        const target = { x: 0, y: 0 };
        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            target.x = (((e.clientX - rect.left) / rect.width) * 2 - 1) * PARALLAX;
            target.y =
                -(((e.clientY - rect.top) / rect.height) * 2 - 1) * PARALLAX;
        };
        container.addEventListener("mousemove", onMouseMove);

        // ── scroll dive (no scroll-jacking) ──
        let scrollT = 0;
        const onScroll = () => {
            scrollT = Math.min(1, window.scrollY / window.innerHeight);
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        // pause when off-screen
        let visible = true;
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
        });
        io.observe(container);

        // ── A. cinematic intro reveal ──────────────────────────────────────
        // 2.5s ease-out-quint, computed CPU-side into a single eased scalar so
        // the shader stays uniform-driven. Counts wall-clock from the first
        // painted frame; off-screen frames are skipped but the reveal resumes
        // cleanly because it reads `introElapsed`, not raw RAF time.
        const INTRO_DUR = 2.5;
        let introElapsed = 0;
        const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);

        // ── E. scroll dive easing (smoothstep), then critically damped ──────
        const smoothstep01 = (x: number) => {
            const t = Math.min(1, Math.max(0, x));
            return t * t * (3 - 2 * t);
        };

        let raf = 0;
        let last = performance.now();
        let elapsed = 0;
        let zoom = 0;
        const update = (t: number) => {
            raf = requestAnimationFrame(update);
            const dt = Math.min(t - last, 64);
            last = t;
            if (!visible) return;
            const dts = dt * 0.001;
            elapsed += dts;

            // intro clock → eased shader scalar (no layout effect)
            if (introElapsed < INTRO_DUR) introElapsed += dts;
            const intro = easeOutQuint(Math.min(1, introElapsed / INTRO_DUR));

            // smooth the parallax + zoom so motion feels heavy and cinematic
            mouse.x += (target.x - mouse.x) * 0.05;
            mouse.y += (target.y - mouse.y) * 0.05;
            // E. smoothstep-eased dive target, then damped toward it
            const diveTarget = smoothstep01(scrollT);
            zoom += (diveTarget - zoom) * 0.06;

            program.uniforms.uTime.value = elapsed;
            program.uniforms.uTilt.value = [mouse.x, mouse.y];
            program.uniforms.uZoom.value = zoom;
            program.uniforms.uIntro.value = intro;

            renderer.render({ scene: mesh, camera });
        };
        raf = requestAnimationFrame(update);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("scroll", onScroll);
            container.removeEventListener("mousemove", onMouseMove);
            io.disconnect();
            cancelAnimationFrame(raf);
            if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
        };
    }, []);

    return <div ref={containerRef} aria-hidden className="absolute inset-0" />;
}
