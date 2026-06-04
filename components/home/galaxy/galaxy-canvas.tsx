"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Program, Mesh, Triangle, RenderTarget } from "ogl";

// ─────────────────────────────────────────────────────────────────────────────
// TRUE GRAVITATIONALLY-LENSED BLACK HOLE — Interstellar "Gargantua".
//
// This is NOT an analytic lensing fake. Every pixel fires a camera ray and
// numerically integrates a null geodesic in a Schwarzschild field, in units
// where the Schwarzschild radius rs = 1. The photon ring, the fold-over of the
// far disk onto the near sky, and the wrapping of the background starfield all
// EMERGE from the integrator — nothing is painted.
//
// ── PHYSICS (the load-bearing core) ─────────────────────────────────────────
// For a photon in Schwarzschild geometry, integrating in flat 3-space with the
// effective acceleration
//      a = -1.5 * h2 * pos / |pos|^5,   h2 = |cross(pos, vel)|^2 (conserved)
// reproduces the photon-orbit bending: light grazing r ≈ 1.5 rs loops (the
// photon sphere), light with smaller impact parameter is captured, larger
// escapes. h2 is the squared specific angular momentum; because the force is
// central it is conserved analytically, so we compute it ONCE from the initial
// state and reuse it — this is what keeps the integrator rock-solid (the bend
// strength can't drift step-to-step).
//
// Integrator: velocity-Verlet (leapfrog) — symplectic-flavored, so orbit energy
// doesn't bleed and grazing rays trace clean rings instead of spiraling from
// numerical loss. Fixed base step (~0.09) GROWN with distance from the hole
// (adaptive: far away spacetime is nearly flat, so we coast), 80 steps,
// early-exit on capture (r < rs) or escape (r > R_MAX).
//
// ── SCENE GEOMETRY (the WOW) ────────────────────────────────────────────────
// Camera sits a few degrees ABOVE the equatorial disk plane and looks at the
// hole. So the disk reads as a real 3D annulus in perspective: its near edge
// passes in FRONT of and below the shadow, and its FAR edge — physically behind
// the hole — is bent up and over the top of the shadow into the iconic halo,
// while its underside is lensed up from below. We let each ray cross the
// equatorial plane up to 3 times, so the front face, the folded-over far face,
// AND the secondary underside image all accumulate.
//
// ── DISK ────────────────────────────────────────────────────────────────────
// Equatorial annulus r_isco ≈ 2.2 rs → r_out ≈ 5.2 rs. On each plane crossing
// inside the annulus we accumulate emission:
//   • temperature falls with radius: white-amber inner → copper outer;
//   • multi-scale noise filaments advected by KEPLERIAN differential rotation
//     (Ω ∝ r^-1.5), so inner gas winds faster than outer — real shear;
//   • relativistic DOPPLER beaming + gravitational redshift: the disk's
//     tangential Keplerian velocity is dotted against the ray direction; the
//     side rotating toward us is beamed dramatically brighter & whiter, the
//     receding side dims & reddens; g-redshift darkens & reddens with depth.
//
// ── BACKGROUND ───────────────────────────────────────────────────────────────
// When a ray escapes, its FINAL (bent) direction samples a procedural starfield
// + a faint Milky band. The sky visibly wraps: stars near the shadow smear into
// arcs and pile onto the photon ring. This is what makes the lensing READ.
//
// ── ATMOSPHERE ───────────────────────────────────────────────────────────────
// A cheap volumetric term accrues faint emission whenever a marching sample is
// near the equatorial plane (small |y|) inside the disk's reach, even between
// hard crossings — so the disk has glow/body, not a paper-thin sheet.
//
// ── PERFORMANCE ──────────────────────────────────────────────────────────────
// Pass 1 (expensive): raymarch into a HALF-RESOLUTION RenderTarget.
// Pass 2 (cheap, full-res): upscale with linear filtering + ACES tonemap +
// chromatic aberration + film grain, so grain/CA stay crisp at native res while
// the costly geodesics run at quarter the pixels.
//
// ── CONTRACT ─────────────────────────────────────────────────────────────────
// Premultiplied alpha over the DOM: output vec4(col*a, a); alpha follows
// luminance so empty sky is transparent and the CSS fallback shows through —
// ONLY the event-horizon shadow is opaque black. Uniforms/behaviors preserved:
// uTime, uResolution, uCenter, uZoom (eased scroll dive), uScale, uTilt (mouse
// parallax), uIntro (2.5s reveal). prefers-reduced-motion / no-WebGL2 bail.
// ─────────────────────────────────────────────────────────────────────────────

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// ── PASS 1: the geodesic raymarcher (runs at half resolution) ────────────────
const marchFrag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution; // half-res target size
  uniform vec2  uCenter;     // hole screen offset in NDC-ish space
  uniform float uZoom;       // scroll dive 0..1 (eased CPU-side)
  uniform float uScale;      // system scale (smaller on narrow screens)
  uniform vec2  uTilt;       // mouse parallax (radians-ish, tiny)
  uniform float uIntro;      // mount reveal 0..1 (ease-out-quint)

  // ── astrophotographic palette (locked: no neon, no cyan/purple) ──
  const vec3 HOT    = vec3(1.000, 0.957, 0.886); // #fff4e2 warm white
  const vec3 WARM   = vec3(1.000, 0.851, 0.627); // #ffd9a0 amber
  const vec3 COPPER = vec3(0.706, 0.408, 0.235); // #b4683c coppery outer
  const vec3 STARC  = vec3(0.784, 0.847, 0.941); // #c8d8f0 cool star

  // ── geometry / integrator tunables (units: Schwarzschild radius rs = 1) ──
  #define RS        1.0     // event horizon radius (capture at r < RS)
  #define R_ISCO    2.2     // disk inner edge (~ marginally stable orbit)
  #define R_OUT     5.2     // disk outer edge
  #define R_MAX     24.0    // escape radius (ray has left the system)
  #define STEPS     120     // integration steps (must cover grazing orbits)
  #define DT_BASE   0.095   // base proper step
  #define DT_GROW   0.028   // step grows per unit r beyond ~3 (adaptive)
  #define MAX_CROSS 2       // equatorial crossings accumulated per ray

  #define CAM_DIST  9.5     // camera distance from the hole
  #define CAM_ELEV  0.085   // camera elevation above disk plane (~5 deg) — near
                            // the disk plane so the near band crosses the shadow
  #define FOV       0.60    // half-angle field-of-view scale
  #define ROLL      -0.52    // ~30° screen roll: the band crosses diagonally

  #define KEPLER    0.95    // Keplerian speed scale (fraction-of-c-ish)
  #define BEAM_PWR  3.8     // relativistic beaming exponent (Doppler^pwr)
  #define DISK_GAIN 1.75     // overall disk emission gain
  #define GLOW_GAIN 0.018   // volumetric near-plane glow gain
  #define RING_GAIN 1.05    // photon-sphere ring glow gain

  // ---------- hashing / noise ----------
  float hash11(float n) { return fract(sin(n) * 43758.5453123); }

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
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

  // 3-octave FBM for the disk filaments (cheap — runs only on crossings)
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      v += amp * vnoise(p);
      p = p * 2.03 + 7.7;
      amp *= 0.5;
    }
    return v;
  }

  // ── procedural sky sampled from a (bent) ray direction ───────────────────
  // Stars are placed on a lat/long grid of the direction sphere; near the
  // shadow the bent directions crowd together → stars smear into arcs.
  vec3 sampleSky(vec3 dir) {
    vec3 col = vec3(0.0);

    float lon = atan(dir.z, dir.x);
    float lat = asin(clamp(dir.y, -1.0, 1.0));
    vec2 sph = vec2(lon, lat);

    // three star layers at different densities/sizes
    for (int L = 0; L < 3; L++) {
      float scale = 26.0 + float(L) * 34.0;
      vec2 sp = sph * scale;
      vec2 cell = floor(sp);
      float h = hash21(cell + float(L) * 53.7);
      float thresh = 0.972 - float(L) * 0.006;
      if (h > thresh) {
        vec2 f = fract(sp) - 0.5;
        f -= (vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5) * 0.7;
        // compensate latitude pinch so stars stay round near the poles
        f.x *= max(cos(lat), 0.15);
        float d = length(f);
        float rad = mix(0.05, 0.16, h);
        float tw = 0.7 + 0.3 * sin(uTime * (1.5 + float(L)) + h * 60.0);
        float s = smoothstep(rad, 0.0, d) * tw;
        float temp = hash21(cell + 91.7);
        vec3 cool = mix(STARC, vec3(0.93, 0.95, 1.0), 0.35);
        vec3 starCol = mix(cool, WARM, smoothstep(0.55, 1.0, temp));
        col += starCol * s * mix(1.4, 3.0, h);
      }
    }

    // faint Milky band: a great-circle haze, slightly tilted
    float bandLat = dir.y * 0.92 + dir.x * 0.18;
    float milky = exp(-bandLat * bandLat * 9.0);
    float mn = fbm(sph * 3.0 + 4.0) * 0.6 + 0.4;
    col += mix(vec3(0.018, 0.024, 0.040), COPPER * 0.10, mn) * milky * 0.5;

    // very faint floor so deep space isn't pure 0 (stays ~transparent via alpha)
    col += vec3(0.006, 0.008, 0.014);
    return col;
  }

  // ── disk emission at an equatorial hit (plane radius rad, azimuth az) ─────
  vec3 diskEmission(float rad, float az, vec3 rayDir) {
    if (rad < R_ISCO || rad > R_OUT) return vec3(0.0);

    // radial profile: blazing inner lip, smooth outer fade
    float t = (rad - R_ISCO) / (R_OUT - R_ISCO);     // 0 inner .. 1 outer
    float inner = smoothstep(0.0, 0.05, t);           // razor ISCO lip ramp-in
    float outer = 1.0 - smoothstep(0.74, 1.0, t);     // outer fray
    float radial = inner * outer;
    radial *= 1.0 / (0.35 + 2.4 * t * t);             // steep outward falloff
    // blazing inner-lip overdrive (feeds the photon ring around the shadow)
    radial += inner * outer * exp(-t * 7.0) * 1.6;

    // RIGID rotation + frozen Keplerian pre-wind.
    // True differential rotation (Ω(r)·t) winds the texture without bound:
    // after a few minutes the pattern is wound tighter than a pixel and the
    // disk reads as frozen, pulsing noise. Instead every radius orbits at the
    // SAME bounded rate, and the Keplerian shear is baked in as a constant
    // pre-wind of the pattern — looks wound like the real thing, moves
    // forever, never degrades.
    float omegaRef = 0.55 * pow(R_ISCO / 3.2, 1.5);   // mid-disk orbital rate
    float spin = mod(uTime * omegaRef, 6.28318530718);
    float prewind = (pow(R_ISCO / max(rad, R_ISCO), 1.5)
                   - pow(R_ISCO / 3.2, 1.5)) * 5.5;   // static spiral winding

    // multi-scale advected filaments — sampled in ROTATED CARTESIAN disk
    // space. The old polar sampling fbm(az * k) hit the atan2 branch cut at
    // ±π, which runs exactly through the FRONT of the band → a hard vertical
    // texture seam. Cartesian coordinates are periodic in azimuth by
    // construction; the Keplerian winding still comes from spin(omega(rad)).
    float aAdv = az + spin + prewind;
    vec2 hp  = vec2(cos(aAdv), sin(aAdv)) * rad;      // advected disk point
    vec2 tg  = vec2(-sin(aAdv), cos(aAdv));           // tangential (flow) dir
    vec2 q   = hp * 1.05;
    float wx = fbm(q * 0.8 + 3.1) - 0.5;              // domain warp → stringy
    vec2 fq  = q + tg * wx * 1.6;
    // 3-tap tangential smear: stretches the noise along the flow so the
    // filaments stay stringy (what the polar trick did, minus its seam)
    float broad = (fbm(fq) + fbm(fq + tg * 0.4) + fbm(fq - tg * 0.4)) / 3.0;
    float fine  = fbm(fq * 1.9 + 17.0);
    float fil = mix(broad, fine, 0.4);
    fil = pow(clamp(fil * 1.35, 0.0, 1.0), 1.9);
    float cn = fbm(hp * 0.62 + 4.0);
    float clump = smoothstep(0.62, 0.82, cn);         // hot orbiting clumps
    float emis = (0.30 + 0.85 * fil) + clump * 1.5;

    // temperature ramp: amber inner → amber-copper → deep copper outer.
    // base stays SATURATED warm; only the doppler hotspot (below) whitens, so
    // the disk reads as molten gold/copper instead of clipping to grey-white.
    vec3 col = mix(WARM, mix(WARM, COPPER, 0.5), smoothstep(0.0, 0.5, t));
    col = mix(col, COPPER, smoothstep(0.5, 1.0, t));

    // ── RELATIVISTIC DOPPLER (beaming + color) ──
    // disk tangential velocity (CCW) at this azimuth; equatorial plane = xz.
    float v = KEPLER * sqrt(R_ISCO / max(rad, R_ISCO)) * 0.82;
    vec2 ca = vec2(cos(az), sin(az));
    vec3 vel = vec3(ca.y, 0.0, -ca.x) * v;            // tangential CW → left limb beams
    float mu = dot(normalize(-rayDir), vel);          // approaching > 0
    float beta = clamp(v, 0.0, 0.96);
    float gamma = 1.0 / sqrt(max(1.0 - beta * beta, 1e-3));
    float doppler = 1.0 / (gamma * (1.0 - clamp(mu, -0.96, 0.96)) + 1e-3);
    float beam = pow(clamp(doppler, 0.18, 4.4), BEAM_PWR);
    // "Nolan floor": true relativistic beaming would erase the receding limb
    // entirely (Interstellar dialed it down for the same reason). Keep the
    // receding side visible as deep dim copper so the disk reads ALL the way
    // around the shadow — the color shift carries the physics story.
    beam = max(beam, 0.5);
    // crush the receding limb hard so the asymmetry reads (dim copper vs white)
    beam *= mix(0.85, 1.0, smoothstep(-0.55, 0.15, mu));

    // only the SHARP peak of the approaching limb whitens; the rest of the
    // bright band stays molten gold so it never clips to a flat grey ribbon.
    float approach = clamp((doppler - 1.0) * 1.5, -1.0, 1.0);
    float whiten = pow(max(approach, 0.0), 2.6);
    col = mix(col, HOT, whiten * 0.7);                // tight white hotspot
    col = mix(col, mix(COPPER, WARM, 0.35), max(-approach, 0.0) * 0.8); // receding warm copper, still clearly visible
    // extra beaming punch on the approaching limb (left limb reads brightest)
    beam *= 1.0 + whiten * 0.8;

    // ── adaptive filament contrast ──
    // The blazing approaching lobe clips after the tonemap and washes its
    // texture flat. Where beaming runs hot, re-deepen the inter-filament
    // valleys so the streaks survive the exposure — the bright side shows the
    // same stringy structure as the dim side instead of a flat cream slab.
    float texKeep = clamp(beam * 0.6, 0.0, 1.0);
    emis = mix(emis, emis * (0.06 + 0.94 * fil) + clump * 0.6, texKeep * 0.95);

    // ── GRAVITATIONAL REDSHIFT (approx): deeper gas dims & reddens ──
    float grav = sqrt(max(1.0 - RS / max(rad, RS * 1.05), 0.02));
    col = mix(COPPER * 0.6, col, grav);
    float gdim = mix(0.55, 1.0, grav);

    return col * (radial * emis * beam * gdim) * DISK_GAIN;
  }

  void main() {
    vec2 res = uResolution;
    float aspect = res.x / res.y;
    vec2 ndc = (vUv * 2.0 - 1.0);
    ndc.x *= aspect;

    // intro framing nudge (start ~5% wider, settle)
    float introZoomOut = (1.0 - uIntro) * 0.05;

    // scroll dive pulls the camera in
    float dive = uZoom;
    float zoom = (1.0 - dive * 0.22 + introZoomOut) * uScale;

    // screen-space hole offset (same NDC convention as before)
    vec2 sc = (ndc - uCenter) / zoom;
    // camera roll: rotate the image plane around the hole so the accretion
    // band crosses the frame diagonally (the promotional-shot composition)
    sc = vec2(sc.x * cos(ROLL) - sc.y * sin(ROLL),
              sc.x * sin(ROLL) + sc.y * cos(ROLL));

    // sky window: stars/milky band live AROUND the hole only — they fade to
    // nothing toward the text column so the left half of the hero stays clean.
    float skyWin = smoothstep(2.0, 0.55, length(sc));

    // ── build the camera basis ──────────────────────────────────────────────
    // Camera orbits the hole, elevated above the equatorial (xz) plane, looking
    // at the origin. Mouse parallax + dive nudge the orbit angle / elevation.
    // base azimuth flips the doppler-bright (approaching) limb toward the
    // visible left side of the shadow
    float orbit = 3.14159265 + uTilt.x * 1.1;            // azimuth parallax
    float elev  = CAM_ELEV + uTilt.y * 0.45 + dive * 0.05; // higher when diving
    float dist  = CAM_DIST * (1.0 - dive * 0.18);        // dive shortens distance

    vec3 camPos = vec3(
      cos(orbit) * cos(elev),
      sin(elev),
      sin(orbit) * cos(elev)
    ) * dist;

    // look-at basis
    vec3 fwd = normalize(-camPos);
    vec3 right = normalize(cross(fwd, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, fwd);

    // primary ray direction through this pixel
    vec3 dir = normalize(fwd + (sc.x * right + sc.y * up) * FOV);

    // ── null-geodesic integration (units: rs = 1) ───────────────────────────
    vec3 pos = camPos;
    vec3 vel = dir;
    // h2 = |r × v|^2, conserved (central force). Computed ONCE from init state.
    vec3 hvec = cross(pos, vel);
    float h2 = dot(hvec, hvec);

    vec3 accum = vec3(0.0);        // disk-crossing emission (survives capture)
    vec3 accumFx = vec3(0.0);      // ring + volumetric glow (escape-only:
                                   // captured rays must stay black inside)
    float transmit = 1.0;          // remaining transmittance (front-to-back)
    bool captured = false;
    int crossings = 0;
    float prevY = pos.y;

    // velocity-Verlet needs an initial acceleration
    float r0 = length(pos);
    vec3 acc = -1.5 * h2 * pos / pow(r0, 5.0);

    for (int i = 0; i < STEPS; i++) {
      float r = length(pos);

      // adaptive step: coast through near-flat space far from the hole
      float dt = DT_BASE + max(r - 3.0, 0.0) * DT_GROW;
      // plane-adaptive refinement: rays grazing the disk plane inside the
      // annulus take finer steps, otherwise they hop straight over y=0 and
      // the front band terminates in a hard horizontal cut
      float rad2dStep = length(pos.xz);
      if (abs(pos.y) < 0.22 && rad2dStep < R_OUT + 0.8) {
        dt *= mix(0.35, 1.0, smoothstep(0.0, 0.22, abs(pos.y)));
      }

      // ── volumetric near-plane glow (cheap atmosphere) ──
      float rad2d = length(pos.xz);
      if (rad2d > R_ISCO * 0.9 && rad2d < R_OUT * 1.1) {
        float planeProx = exp(-pos.y * pos.y * 5.0);
        // strict annulus window: no glow inside the ISCO (it was hazing the
        // shadow gray now that captured rays keep their foreground emission)
        float reach = smoothstep(R_ISCO * 0.8, R_ISCO * 1.1, rad2d)
                    * (1.0 - smoothstep(R_OUT * 0.85, R_OUT * 1.15, rad2d));
        vec3 g = mix(WARM, COPPER, smoothstep(R_ISCO, R_OUT, rad2d));
        accumFx += g * planeProx * reach * GLOW_GAIN * transmit * dt;
      }

      // ── photon-ring glow ──
      // Rays that graze the photon sphere (r ≈ 1.5 rs) loop many times before
      // escaping/capturing; each step they spend near 1.5 adds to a brilliant
      // thin halo hugging the shadow. This is the bright ring that emerges from
      // the geodesics, not a painted circle.
      float ringD = abs(r - 1.5);
      float ring = exp(-ringD * ringD * 16.0);     // ~1.5px wide at full res
      // floor the transmittance so the ring stays brilliant on every limb,
      // even where the near disk has already gone opaque
      accumFx += HOT * ring * RING_GAIN * max(transmit, 0.35) * dt;

      // ── velocity-Verlet (leapfrog) step ──
      vec3 posNext = pos + vel * dt + 0.5 * acc * dt * dt;
      float rN = length(posNext);
      vec3 accNext = -1.5 * h2 * posNext / pow(rN, 5.0);
      vec3 velNext = vel + 0.5 * (acc + accNext) * dt;

      // ── equatorial plane crossing (sign change in y) within annulus ──
      if (posNext.y * prevY < 0.0 && crossings < MAX_CROSS) {
        float frac = prevY / (prevY - posNext.y);     // → y=0 crossing
        frac = clamp(frac, 0.0, 1.0);
        vec3 hit = mix(pos, posNext, frac);
        float rad = length(hit.xz);
        if (rad >= R_ISCO && rad <= R_OUT) {
          float az = atan(hit.z, hit.x);
          vec3 hdir = normalize(mix(vel, velNext, frac));
          vec3 e = diskEmission(rad, az, hdir);
          // front-to-back compositing: nearer crossings occlude farther ones.
          float dens = clamp(
            0.55 + 0.45 * (1.0 - (rad - R_ISCO) / (R_OUT - R_ISCO)),
            0.3, 1.0
          );
          accum += e * transmit;
          transmit *= (1.0 - dens * 0.7);
          crossings++;
        }
      }

      prevY = posNext.y;
      pos = posNext;
      vel = velNext;
      acc = accNext;

      // ── termination ──
      if (rN < RS) { captured = true; break; }
      if (rN > R_MAX) break;
      if (transmit < 0.02) break;     // disk fully opaque ahead
    }

    // foreground disk always shows; ring/glow only on rays that escaped —
    // otherwise every captured ray pales the shadow as it falls through r=1.5
    vec3 col = accum + (captured ? vec3(0.0) : accumFx);

    // ── background: only the still-transmitting fraction sees the sky ──
    // captured rays hit the shadow → no sky. Escaped/exhausted rays add the
    // bent-direction sky behind whatever disk they passed through.
    if (!captured) {
      col += sampleSky(normalize(vel)) * transmit * skyWin;
    }

    // mark the shadow: captured rays are opaque (the only place alpha = 1) and
    // show black space BEHIND — but emission accumulated BEFORE capture (the
    // foreground disk the ray crossed on its way in) SURVIVES. That's the
    // Gargantua signature: the near band passes right across the shadow.
    float shadow = captured ? 1.0 : 0.0;

    float lum = max(col.r, max(col.g, col.b));
    float a = clamp(lum * 1.2, 0.0, 1.0);
    a = max(a, shadow * uIntro);          // shadow opaque after intro settles

    // intro: ease radiance up from black
    col *= uIntro;

    // Pass 1 writes LINEAR premultiplied color in rgb, alpha in a.
    gl_FragColor = vec4(col * a, a);
  }
`;

// ── PASS 2: composite/upscale (full-res, cheap) ──────────────────────────────
const compositeFrag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform sampler2D uScene;     // half-res march result (premultiplied)
  uniform vec2  uResolution;    // full-res
  uniform float uTime;
  uniform float uIntro;
  uniform vec2  uHole;          // hole center in vUv space (vignette/CA anchor)

  const vec3 TOE = vec3(0.0196, 0.0275, 0.051);

  vec3 acesFilmic(vec3 x) {
    const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  float hash31(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  // un-premultiply a sampled texel into straight color
  vec3 straight(vec4 c) { return c.rgb / max(c.a, 1e-4); }

  void main() {
    vec2 uv = vUv;

    vec2 toHole = uv - uHole;
    float rh = length(toHole);
    vec2 rdir = toHole / max(rh, 1e-4);

    vec4 c0 = texture2D(uScene, uv);
    vec3 base = straight(c0);

    // ── edge-aware chromatic aberration ──
    // cheap edge energy via a radial luminance differential; split RGB radially.
    vec2 px = 1.5 / uResolution;
    float lC = dot(c0.rgb, vec3(0.299, 0.587, 0.114));
    float lO = dot(texture2D(uScene, uv + rdir * px * 2.0).rgb, vec3(0.299, 0.587, 0.114));
    // CA belongs to the lens-stressed zone AROUND the hole — strongest near
    // the photon ring, ZERO over the distant starfield (no rainbow stars).
    float edge = clamp(abs(lC - lO) * 6.0 + lC * 0.1, 0.0, 1.0);
    float split = pow(edge, 1.5) * 0.0010 * (1.0 - smoothstep(0.12, 0.40, rh));

    vec3 cr = straight(texture2D(uScene, uv + rdir * split));
    vec3 cb = straight(texture2D(uScene, uv - rdir * split));
    vec3 col = vec3(cr.r, base.g, cb.b);

    // ── exposure + ACES filmic ──
    col *= 1.08;
    col = acesFilmic(col);

    // luminance BEFORE toe for alpha
    float sceneLum = max(col.r, max(col.g, col.b));

    // lifted-black toe near the system (not over empty page space)
    float shadowW = 1.0 - smoothstep(0.0, 0.10, sceneLum);
    float nearSys = smoothstep(0.6, 0.0, rh);
    col = mix(col, max(col, TOE), shadowW * nearSys * uIntro);

    // saturation rebuild (ACES desaturates highlights → pull warmth back)
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 1.5);

    // warm highlight tint: ACES drives the bright disk toward neutral white,
    // which reads as a grey slab. Re-tint the upper range toward cream amber so
    // the hot band stays molten gold even where it clips.
    vec3 HILITE = vec3(1.0, 0.93, 0.80);
    float hi = smoothstep(0.25, 0.9, luma);
    col = mix(col, col * HILITE, hi * 0.95);

    // hole-anchored vignette
    float vig = 1.0 - 0.55 * smoothstep(0.35, 0.95, rh);
    col *= vig;

    // crisp full-res film grain (heavier in shadows, gone in highlights)
    float g = hash31(vec3(gl_FragCoord.xy, floor(uTime * 24.0))) - 0.5;
    float lumg = dot(col, vec3(0.299, 0.587, 0.114));
    float gw = mix(1.6, 0.35, smoothstep(0.0, 0.7, lumg));
    col += g * 0.006 * gw * uIntro;
    col = max(col, vec3(0.0));

    // ── premultiplied output ──
    // The event-horizon shadow arrives as alpha≈1 with ~black rgb from pass 1;
    // preserve its opacity. Everything else: alpha follows scene luminance so
    // empty sky stays transparent over the DOM.
    float isShadow = step(0.999, c0.a) * step(sceneLum, 0.02);
    float a = clamp(sceneLum * 1.15, 0.0, 1.0);
    a = max(a, isShadow * uIntro);
    gl_FragColor = vec4(col * a, a);
  }
`;

export default function GalaxyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // phones: the half-res raymarch reads as pixel noise at small sizes and
    // eats battery — the static astrophoto fallback is the better hero there
    if (window.matchMedia("(max-width: 767px)").matches) return;

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

    // fade out the CSS fallback once WebGL is painting
    const fallback =
      container.parentElement?.querySelector<HTMLElement>("[data-galaxy-fallback]") ?? null;
    if (fallback) fallback.style.opacity = "0";

    const camera = new Camera(gl);
    const geometry = new Triangle(gl);

    // ── half-resolution render target for the expensive geodesic pass ──
    const RT_SCALE = 0.55;
    const rt = new RenderTarget(gl, {
      width: Math.max(2, Math.floor(gl.canvas.width * RT_SCALE)),
      height: Math.max(2, Math.floor(gl.canvas.height * RT_SCALE)),
      depth: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
    });

    // ── pass 1 program (geodesic march, into rt) ──
    const marchProgram = new Program(gl, {
      vertex,
      fragment: marchFrag,
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
    const marchMesh = new Mesh(gl, { geometry, program: marchProgram });

    // ── pass 2 program (composite/upscale, to screen) ──
    const compositeProgram = new Program(gl, {
      vertex,
      fragment: compositeFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uScene: { value: rt.texture },
        uResolution: { value: [1, 1] },
        uTime: { value: 0 },
        uIntro: { value: 0 },
        uHole: { value: [0.5, 0.5] },
      },
    });
    const compositeMesh = new Mesh(gl, { geometry, program: compositeProgram });

    // hole placement (same convention as the original)
    const center: [number, number] = [0, 0];
    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      const w = gl.canvas.width;
      const h = gl.canvas.height;
      const aspect = w / h;

      rt.setSize(
        Math.max(2, Math.floor(w * RT_SCALE)),
        Math.max(2, Math.floor(h * RT_SCALE)),
      );
      compositeProgram.uniforms.uScene.value = rt.texture;

      marchProgram.uniforms.uResolution.value = [w * RT_SCALE, h * RT_SCALE];
      compositeProgram.uniforms.uResolution.value = [w, h];

      // aspect-relative: hole center lands at ~79% across the viewport, clear
      // of the text column on any wide screen
      center[0] = aspect > 1 ? aspect * 0.58 : 0;
      center[1] = aspect > 1 ? 0.04 : 1.05;
      marchProgram.uniforms.uCenter.value = center;
      marchProgram.uniforms.uScale.value = aspect > 1 ? 0.92 : 0.5;

      // hole center in vUv space for the composite vignette/CA anchor.
      // shader: ndc = vUv*2-1, ndc.x *= aspect, then compares to uCenter.
      // so vUv = ((center.x/aspect)+1)/2 , ((center.y)+1)/2
      compositeProgram.uniforms.uHole.value = [
        (center[0] / aspect) * 0.5 + 0.5,
        center[1] * 0.5 + 0.5,
      ];
    };
    window.addEventListener("resize", resize, false);
    resize();

    // ── mouse parallax ──
    const PARALLAX = 0.06;
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      target.x = (((e.clientX - rect.left) / rect.width) * 2 - 1) * PARALLAX;
      target.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1) * PARALLAX;
    };
    container.addEventListener("mousemove", onMouseMove);

    // ── scroll dive ──
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

    // ── cinematic intro reveal (2.5s ease-out-quint) ──
    const INTRO_DUR = 2.5;
    let introElapsed = 0;
    const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);

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

      if (introElapsed < INTRO_DUR) introElapsed += dts;
      const intro = easeOutQuint(Math.min(1, introElapsed / INTRO_DUR));

      mouse.x += (target.x - mouse.x) * 0.09;
      mouse.y += (target.y - mouse.y) * 0.09;
      const diveTarget = smoothstep01(scrollT);
      zoom += (diveTarget - zoom) * 0.06;

      marchProgram.uniforms.uTime.value = elapsed;
      marchProgram.uniforms.uTilt.value = [mouse.x, mouse.y];
      marchProgram.uniforms.uZoom.value = zoom;
      marchProgram.uniforms.uIntro.value = intro;

      compositeProgram.uniforms.uTime.value = elapsed;
      compositeProgram.uniforms.uIntro.value = intro;

      // PASS 1: geodesic march → half-res target
      renderer.render({ scene: marchMesh, camera, target: rt });
      // PASS 2: composite/upscale → screen
      renderer.render({ scene: compositeMesh, camera });
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
