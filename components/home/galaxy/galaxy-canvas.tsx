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
// Pass 1 (expensive): raymarch into a HALF-RESOLUTION RenderTarget
// (tiers 0.6 → 0.42 by the adaptive governor).
// Pass 2 (cheap, full-res): upscale with linear filtering + ACES tonemap +
// chromatic aberration + film grain, so grain/CA stay crisp at native res while
// the costly geodesics run at quarter the pixels.
//
// ── CONTRACT ─────────────────────────────────────────────────────────────────
// Premultiplied alpha over the DOM: output vec4(col*a, a); alpha follows
// luminance so empty sky is transparent and the CSS fallback shows through —
// ONLY the event-horizon shadow is opaque black. Uniforms/behaviors preserved:
// uTime, uResolution, uCenter, uZoom (eased scroll dive), uScale, uTilt (mouse
// parallax), uIntro (0.9s reveal). prefers-reduced-motion / no-WebGL2 bail.
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
  #define R_ACT     7.0     // active sphere: disk (5.2), ring (1.5) and plane
                            // glow (r≲5.8) all live inside — outside is sky
  #define STEPS     120     // integration steps (must cover grazing orbits)
  #define DT_BASE   0.095   // base proper step
  #define DT_GROW   0.028   // step grows per unit r beyond ~3 (adaptive)
  #define MAX_CROSS 3       // 3rd crossing = the underside image; capping
                            // at 2 truncated the lower lens arc in a hard edge

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

    // NO intro framing nudge: the static fallback photo is captured at the
    // settled framing, and any boot-time zoom drift against it reads as a pop

    // scroll dive pulls the camera in
    float dive = uZoom;
    float zoom = (1.0 - dive * 0.30) * uScale;

    // screen-space hole offset (same NDC convention as before)
    vec2 sc = (ndc - uCenter) / zoom;
    // camera roll: rotate the image plane around the hole so the accretion
    // band crosses the frame diagonally (the promotional-shot composition).
    // The dive adds a slow extra twist — falling, not just zooming.
    float roll = ROLL + dive * 0.18;
    sc = vec2(sc.x * cos(roll) - sc.y * sin(roll),
              sc.x * sin(roll) + sc.y * cos(roll));

    // sky window: stars/milky band live AROUND the hole only — they fade to
    // nothing toward the text column so the left half of the hero stays clean.
    float skyWin = smoothstep(2.0, 0.55, length(sc));

    // ── build the camera basis ──────────────────────────────────────────────
    // Camera orbits the hole, elevated above the equatorial (xz) plane, looking
    // at the origin. Mouse parallax + dive nudge the orbit angle / elevation.
    // base azimuth flips the doppler-bright (approaching) limb toward the
    // visible left side of the shadow
    float orbit = 3.14159265 + uTilt.x * 1.1;            // azimuth parallax
    // the dive is a real camera move, not a zoom: the orbit RISES (the disk
    // opens from edge-on band into a visible annulus) while the distance
    // closes to just above the outer rim (9.5 → ~6.2 rs)
    float elev  = CAM_ELEV + uTilt.y * 0.45 + dive * 0.30;
    float dist  = CAM_DIST * (1.0 - dive * 0.35);

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

    // ── active-sphere clip ──
    // The camera sits at r≈9.5 but everything that can light a pixel lives in
    // r < R_ACT. Spacetime out there is near-flat, so instead of integrating
    // empty space, jump the straight ray to the sphere's entry point — and
    // rays that miss the sphere entirely are pure sky, no marching at all.
    // (pos×vel is invariant under pos += t·vel, so h2 stays exact.)
    float bq = dot(pos, vel);                  // vel is normalized
    float cq = dot(pos, pos) - R_ACT * R_ACT;
    float discr = bq * bq - cq;
    bool engaged = true;
    if (cq > 0.0) {
      if (discr < 0.0 || bq > 0.0) engaged = false;  // miss, or moving away
      else pos += vel * (-bq - sqrt(discr));         // jump to sphere entry
    }

    vec3 accum = vec3(0.0);        // disk-crossing emission (survives capture)
    vec3 accumFx = vec3(0.0);      // ring + volumetric glow (escape-only:
                                   // captured rays must stay black inside)
    float transmit = 1.0;          // remaining transmittance (front-to-back)
    bool captured = false;
    int crossings = 0;
    float prevY = pos.y;

    // velocity-Verlet needs an initial acceleration. r⁵ as multiplies — pow()
    // is two transcendentals and this runs once per step below.
    float r0sq = dot(pos, pos);
    vec3 acc = -1.5 * h2 * pos / (r0sq * r0sq * sqrt(r0sq));

    for (int i = 0; i < STEPS; i++) {
      if (!engaged) break;
      float r = length(pos);

      // adaptive step: coast through near-flat space far from the hole
      float dt = DT_BASE + max(r - 3.0, 0.0) * DT_GROW;


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
      // beyond r=3 the gaussian is < 1e-15 — skip the exp on far steps
      if (r < 3.0) {
        float ringD = abs(r - 1.5);
        float ring = exp(-ringD * ringD * 16.0);   // ~1.5px wide at full res
        // floor the transmittance so the ring stays brilliant on every limb,
        // even where the near disk has already gone opaque
        accumFx += HOT * ring * RING_GAIN * max(transmit, 0.35) * dt;
      }

      // ── velocity-Verlet (leapfrog) step ──
      vec3 posNext = pos + vel * dt + 0.5 * acc * dt * dt;
      float rNsq = dot(posNext, posNext);
      float rN = sqrt(rNsq);
      vec3 accNext = -1.5 * h2 * posNext / (rNsq * rNsq * rN);
      vec3 velNext = vel + 0.5 * (acc + accNext) * dt;

      // ── tangential graze: the y(t) parabola inside this step can touch the
      // plane and return without an endpoint sign change. Solve its vertex
      // analytically — no step refinement needed, no seam at any boundary. ──
      if (posNext.y * prevY > 0.0 && crossings < MAX_CROSS && abs(acc.y) > 1e-6) {
        float tv = -vel.y / acc.y;               // vertex of y(t) within step
        if (tv > 0.0 && tv < dt) {
          float yv = pos.y + vel.y * tv + 0.5 * acc.y * tv * tv;
          if (yv * prevY < 0.0) {
            // grazing double-crossing: emit once at the vertex point
            vec3 hitG = pos + vel * tv + 0.5 * acc * tv * tv;
            float radG = length(hitG.xz);
            if (radG >= R_ISCO && radG <= R_OUT) {
              float azG = atan(hitG.z, hitG.x);
              vec3 eG = diskEmission(radG, azG, normalize(vel));
              float densG = clamp(0.55 + 0.45 * (1.0 - (radG - R_ISCO) / (R_OUT - R_ISCO)), 0.3, 1.0);
              accum += eG * transmit;
              transmit *= (1.0 - densG * 0.7);
              crossings++;
            }
          }
        }
      }

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
      // outward past the active sphere: in a central potential beyond the
      // photon sphere an outbound ray never returns — nothing left to hit
      if (rN > R_ACT && dot(posNext, velNext) > 0.0) break;
      if (rN > R_MAX) break;          // safety net
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
  uniform sampler2D uBloom;     // blurred bright-pass (straight color, tiny RT)
  uniform float uBloomGain;
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

    // ── bloom ──
    // blurred bright-pass added BEFORE the tonemap so the halo rolls through
    // the same filmic shoulder as the disk: the doppler limb and photon ring
    // RADIATE over the shadow and the sky instead of ending in a hard cut.
    col += texture2D(uBloom, uv).rgb * uBloomGain;

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
    // captured rays stay opaque regardless of luminance: bloom spilling over
    // the horizon must ADD light on black, not punch a translucent hole that
    // lets the page background bleed through the shadow.
    float isShadow = step(0.999, c0.a);
    float a = clamp(sceneLum * 1.15, 0.0, 1.0);
    a = max(a, isShadow * uIntro);
    gl_FragColor = vec4(col * a, a);
  }
`;

// ── BLOOM CHAIN: bright-pass + separable gaussian (tiny RTs, ~free) ──────────
const brightFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uScene;   // premultiplied march target

  void main() {
    vec4 c = texture2D(uScene, vUv);
    vec3 col = c.rgb / max(c.a, 1e-4);
    float l = max(col.r, max(col.g, col.b));
    // soft knee: the doppler limb, photon ring and brightest stars pass;
    // the dim copper floor and the milky band barely register
    float w = smoothstep(0.55, 1.0, l);
    gl_FragColor = vec4(col * w, 1.0);
  }
`;

// linear-sampled 9-tap gaussian (5 fetches), run twice per axis
const blurFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform vec2 uDir;          // (texel.x, 0) or (0, texel.y)

  void main() {
    vec2 off1 = uDir * 1.3846153846;
    vec2 off2 = uDir * 3.2307692308;
    vec3 acc = texture2D(uScene, vUv).rgb * 0.2270270270;
    acc += texture2D(uScene, vUv + off1).rgb * 0.3162162162;
    acc += texture2D(uScene, vUv - off1).rgb * 0.3162162162;
    acc += texture2D(uScene, vUv + off2).rgb * 0.0702702703;
    acc += texture2D(uScene, vUv - off2).rgb * 0.0702702703;
    gl_FragColor = vec4(acc, 1.0);
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
    const probeGl = probe.getContext("webgl2");
    if (!probeGl) return;
    // release the probe context immediately — browsers cap live contexts and
    // dev double-mount/HMR would otherwise slowly exhaust the budget
    probeGl.getExtension("WEBGL_lose_context")?.loseContext();

    const renderer = new Renderer({
      depth: false,
      alpha: true,
      // 1.5 dpr cap: the march pass is res-capped separately, but the full-res
      // composite (grain/CA) at dpr 2 doubles fragment work for detail the
      // film grain immediately re-textures anyway. 1.5 is visually identical.
      dpr: Math.min(window.devicePixelRatio, 1.5),
      // decorative hero: never spin up the discrete GPU on dual-GPU laptops
      powerPreference: "low-power",
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    // The CSS fallback stays visible until the FIRST composited frame lands —
    // fading it at boot left a beat of empty space while shaders compiled.
    const fallback =
      container.parentElement?.querySelector<HTMLElement>("[data-galaxy-fallback]") ?? null;
    let fallbackHidden = false;

    // GPU resets, driver crashes and reclaimed background contexts would
    // otherwise leave a dead black rectangle — bring the astrophoto back.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      container.style.opacity = "0"; // dead canvas must not sit over the photo
      if (fallback) fallback.style.opacity = "1";
    };
    gl.canvas.addEventListener("webglcontextlost", onContextLost);

    const camera = new Camera(gl);
    const geometry = new Triangle(gl);

    // ── half-resolution render target for the expensive geodesic pass ──
    // The scale is tiered: everyone starts at the full look, and the adaptive
    // governor in the render loop steps down only on machines that
    // demonstrably can't hold frame budget (then climbs back when they can).
    // Tier 0 (0.6) IS the look — the soft half-res rendering under crisp
    // full-res grain is the intended astrophoto texture, and it keeps the
    // GPU bill modest. (A 0.9 "razor-sharp" baseline was tried and rejected:
    // too much for this page.) The scale NEVER changes upward mid-view; the
    // governor only steps down on machines that can't hold frame budget.
    // NOTE: the fallback photos in public/ are captured at this exact tier-0
    // look — re-raising the baseline requires recapturing them (?bhfreeze=0)
    // or the photo→live handoff pops.
    const RT_TIERS = [0.6, 0.5, 0.42];
    let tier = 0;
    // forces the next frame to render the march pass regardless of cadence —
    // set whenever the rt is (re)sized, because rt.setSize clears the texture
    // and the composite would otherwise sample an empty scene for one frame
    let marchDirty = true;
    const rt = new RenderTarget(gl, {
      width: Math.max(2, Math.floor(gl.canvas.width * RT_TIERS[0])),
      height: Math.max(2, Math.floor(gl.canvas.height * RT_TIERS[0])),
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
        uIntro: { value: 1 }, // no reveal ramp — the fallback photo IS frame 0
      },
    });
    const marchMesh = new Mesh(gl, { geometry, program: marchProgram });

    // ── bloom ping-pong pair (1/8 res, sized in sizeRT) ──
    const mkBloomRT = () =>
      new RenderTarget(gl, {
        width: 2,
        height: 2,
        depth: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
      });
    const bloomA = mkBloomRT();
    const bloomB = mkBloomRT();

    const brightProgram = new Program(gl, {
      vertex,
      fragment: brightFrag,
      depthTest: false,
      depthWrite: false,
      uniforms: { uScene: { value: rt.texture } },
    });
    const brightMesh = new Mesh(gl, { geometry, program: brightProgram });

    const blurProgram = new Program(gl, {
      vertex,
      fragment: blurFrag,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uScene: { value: bloomA.texture },
        uDir: { value: [0, 0] },
      },
    });
    const blurMesh = new Mesh(gl, { geometry, program: blurProgram });

    // ── pass 2 program (composite/upscale, to screen) ──
    const compositeProgram = new Program(gl, {
      vertex,
      fragment: compositeFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uScene: { value: rt.texture },
        uBloom: { value: bloomA.texture },
        uBloomGain: { value: 0.85 },
        uResolution: { value: [1, 1] },
        uTime: { value: 0 },
        uIntro: { value: 1 }, // no reveal ramp — the fallback photo IS frame 0
        uHole: { value: [0.5, 0.5] },
      },
    });
    const compositeMesh = new Mesh(gl, { geometry, program: compositeProgram });

    // hole placement (same convention as the original)
    const center: [number, number] = [0, 0];

    // rt-only sizing — what the governor calls on a tier change. Deliberately
    // does NOT touch renderer.setSize: assigning canvas.width (even unchanged)
    // reallocates and clears the full-res backbuffer, which a tier flip
    // doesn't need.
    const sizeRT = () => {
      const w = gl.canvas.width;
      const h = gl.canvas.height;
      // cap the march target's longest side: on 4K/5K + dpr the geodesic
      // loop would otherwise dominate (cost scales with fragment count)
      const rtScale = RT_TIERS[tier];
      const rtCap = Math.min(1, 1600 / Math.max(w * rtScale, h * rtScale));
      rt.setSize(
        Math.max(2, Math.floor(w * rtScale * rtCap)),
        Math.max(2, Math.floor(h * rtScale * rtCap)),
      );
      compositeProgram.uniforms.uScene.value = rt.texture;
      marchProgram.uniforms.uResolution.value = [w * rtScale * rtCap, h * rtScale * rtCap];
      // bloom pair tracks the canvas (not the tier): 1/8 res, longest side
      // ≤ 280 — setSize early-returns when unchanged, so tier flips are free
      const bCap = Math.min(1, 280 / Math.max(w / 8, h / 8));
      const bw = Math.max(2, Math.floor((w / 8) * bCap));
      const bh = Math.max(2, Math.floor((h / 8) * bCap));
      bloomA.setSize(bw, bh);
      bloomB.setSize(bw, bh);
      marchDirty = true; // rt was cleared — re-march before the next composite
    };

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      const w = gl.canvas.width;
      const h = gl.canvas.height;
      const aspect = w / h;

      sizeRT();
      compositeProgram.uniforms.uResolution.value = [w, h];

      // v5 "Cygnus": hole centered (matches the static fallback's 50% anchor so
      // there's no jump on boot), behind the centered SEYFERT title
      center[0] = 0;
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
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // pause when off-screen
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(container);

    // NO shader intro. The fallback photo IS this scene's t=0 frame, so any
    // radiance ramp would visibly dim the photo and re-brighten — that's a
    // pop. uIntro stays hardwired to 1; the only entrance is the CSS
    // crossfade, and since the live render boots at the same time-phase the
    // photo was captured at, the handoff is the photo starting to move.

    const smoothstep01 = (x: number) => {
      const t = Math.min(1, Math.max(0, x));
      return t * t * (3 - 2 * t);
    };

    // backgrounded tabs keep firing throttled rAFs — skip the GPU work there
    let hidden = document.hidden;
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden) last = performance.now(); // no dt spike on resume
    };
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let zoom = 0;
    // set on the frame the canvas fades in; the disk is held at its t=0 phase
    // until the fade finishes (see settling below) so it materialises settled
    let fadeStart = 0;
    // uTime is a float32 uniform; left unbounded it slowly degrades the
    // sin()-driven star twinkle and the per-frame grain hash in very long
    // sessions. Wrap it at an exact multiple of the disk's rotation period
    // (2π / omegaRef, mirroring the shader's omegaRef = 0.55·(R_ISCO/3.2)^1.5
    // with R_ISCO = 2.2) so the mod-2π spin stays perfectly continuous across
    // the wrap — only twinkle/grain phases reseed, which is imperceptible.
    const TIME_WRAP = ((Math.PI * 2) / (0.55 * Math.pow(2.2 / 3.2, 1.5))) * 30; // ≈ 601 s

    // capture hook: /?bhfreeze=<seconds> freezes scene time, so the static
    // fallback photos are shot at the exact phase (t=0) the live shader
    // boots with — that phase-match is what makes the handoff invisible
    const freezeParam = new URLSearchParams(window.location.search).get("bhfreeze");
    const freeze = freezeParam === null ? null : Number(freezeParam) || 0;

    // ── adaptive quality governor state ──
    // Driven by the RAW rAF cadence (every callback, before the 60fps cap),
    // which is the device's true frame delivery rate: a healthy 144 Hz panel
    // reads ~6.9 ms, a healthy 60 Hz one ~16.7, a GPU-bound machine reads its
    // real render interval. The PROCESSED dt is useless here — the cap
    // quantizes it to ~20.8 ms on 144 Hz panels, indistinguishable from
    // genuine strain. Hysteresis + cooldown + a climb ban keep it from ever
    // hunting between two tiers.
    let frame = 0;
    let prevRaf = performance.now();
    let rawEma = 16.7;
    let strain = 0;
    let relief = 0;
    let cooldown = 0;      // processed frames until the governor may act again
    let bannedTier = -1;   // quality level that re-strained right after a climb
    let lastClimb = -1e9;  // frame index of the most recent climb

    const update = (t: number) => {
      raf = requestAnimationFrame(update);
      const raw = t - prevRaf;
      prevRaf = t;
      if (!visible || hidden) { last = t; return; }
      // ignore resume gaps / background-throttled callbacks
      if (raw > 0 && raw < 250) rawEma += (raw - rawEma) * 0.05;
      const dt = Math.min(t - last, 64);
      // ~60fps cap: on 120/144 Hz displays rAF would otherwise run the whole
      // pipeline 2–2.4× more often for motion the disk doesn't have. Skipping
      // without touching `last` lets dt accumulate, so elapsed stays real-time.
      if (dt < 15.5) return;
      last = t;
      const dts = dt * 0.001;
      // hold the disk frozen at its captured t=0 phase until the photo→canvas
      // crossfade has fully finished. Otherwise the live disk rotates UNDER the
      // still photo during the 500ms fade and reads as a displacement on load.
      const settling = fadeStart === 0 || t < fadeStart + 560;
      elapsed = freeze ?? (settling ? 0 : (elapsed + dts) % TIME_WRAP);
      frame++;

      // ── governor: step the march resolution to what THIS machine sustains.
      // Armed only after the intro settles (first frames are compile/upload
      // jank on every machine and would trigger a false drop). Strain means
      // the device genuinely delivers < ~43 fps; relief covers every healthy
      // cadence down to 50 Hz panels so a transient drop can always recover.
      if (cooldown > 0) cooldown--;
      else if (frame > 90) {
        // armed earlier than the old 240 (the 0.9 baseline must not gift a
        // weak machine seconds of jank), and severe strain — a genuinely
        // sub-25fps cadence — walks down the ladder 3× faster. The EMA has
        // already washed out the frame-1 compile/upload spikes by frame 90.
        if (rawEma > 23) { strain += rawEma > 40 ? 3 : 1; relief = 0; }
        else if (rawEma < 20.5) { relief++; strain = 0; }
        else if (strain > 0) strain--;   // dead zone: bleed off jitter spikes
        if (strain > 90 && tier < RT_TIERS.length - 1) {
          // re-straining shortly after climbing into this level — ban it so
          // a machine straddling a tier boundary can't flicker forever
          if (frame - lastClimb < 1800) bannedTier = tier;
          // short demote cooldown: the fine ladder means a struggling machine
          // may need several notches — let it walk them quickly (each step is
          // invisible) instead of janking for 10s per step
          tier++; strain = 0; relief = 0; cooldown = 300;
          sizeRT();
        } else if (relief > 600 && tier > 0 && tier - 1 !== bannedTier) {
          tier--; relief = 0; lastClimb = frame; cooldown = 600;
          sizeRT();
        }
      }

      mouse.x += (target.x - mouse.x) * 0.09;
      mouse.y += (target.y - mouse.y) * 0.09;
      const diveTarget = smoothstep01(scrollT);
      zoom += (diveTarget - zoom) * 0.06;

      // ── march cadence ──
      // PASS 1 (the geodesic march) is ~90% of the GPU bill and the scene it
      // draws changes slowly — disk spin ω≈0.31 rad/s, slow-eased tilt. At
      // rest it renders every OTHER frame, while PASS 2's film grain keeps
      // animating at full rate over it, which reads as fully continuous (the
      // grain-over-24fps cinema trick). Anything interactive — intro reveal,
      // scroll dive, active mouse easing — forces the march back to full rate.
      // march at a UNIFORM half rate, interacting or not — never slower
      // (sub-1/2 cadences make the disk's rotation visibly snap when they
      // engage), and never faster either: full-rate march during scroll and
      // mouse parallax was the single biggest GPU spike on the page — 2.25×
      // the old interactive bill at the 0.9 baseline, i.e. jank exactly while
      // the user is moving. The dive and parallax are slow eased motions;
      // sampled at 30fps under the 60fps film grain they read identical, and
      // one fixed cadence means there is no smoothness mode-switch to notice.
      if (marchDirty || frame % 2 === 0) {
        marchProgram.uniforms.uTime.value = elapsed;
        marchProgram.uniforms.uTilt.value = [mouse.x, mouse.y];
        marchProgram.uniforms.uZoom.value = zoom;
        // PASS 1: geodesic march → half-res target
        renderer.render({ scene: marchMesh, camera, target: rt });
        // bloom chain re-renders only when the march does — between marches
        // the composite keeps sampling the previous (still-valid) halo
        brightProgram.uniforms.uScene.value = rt.texture;
        renderer.render({ scene: brightMesh, camera, target: bloomA });
        for (let p = 0; p < 2; p++) {
          blurProgram.uniforms.uScene.value = bloomA.texture;
          blurProgram.uniforms.uDir.value = [1 / bloomA.width, 0];
          renderer.render({ scene: blurMesh, camera, target: bloomB });
          blurProgram.uniforms.uScene.value = bloomB.texture;
          blurProgram.uniforms.uDir.value = [0, 1 / bloomB.height];
          renderer.render({ scene: blurMesh, camera, target: bloomA });
        }
        marchDirty = false;
      }

      compositeProgram.uniforms.uTime.value = elapsed;
      // PASS 2: composite/upscale → screen (every frame: grain/CA/vignette)
      renderer.render({ scene: compositeMesh, camera });

      // First real frame is on screen — crossfade: canvas in, fallback out.
      // Shader compilation can stall the first draw for seconds (cold cache),
      // and an instant swap after that wait reads as detail popping out of
      // nowhere. The CSS transition makes the entrance a fade no matter how
      // long the driver took.
      // first rendered frame is up — fade the canvas in from black
      if (!fallbackHidden) {
        container.style.opacity = "1";
        if (fallback) fallback.style.opacity = "0";
        fallbackHidden = true;
        fadeStart = t; // freeze the disk until this fade-in completes
      }
    };
    raf = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      container.removeEventListener("mousemove", onMouseMove);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.canvas.removeEventListener("webglcontextlost", onContextLost);
      cancelAnimationFrame(raf);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      // deterministic GL teardown (the contextlost listener is already
      // removed above, so this won't resurrect the CSS fallback): without it,
      // strict-mode double-mount + HMR accumulate live contexts until the
      // browser starts reaping the oldest ones
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  // starts transparent; the render loop fades it in on the first real frame
  return (
    <div
      ref={containerRef}
      aria-hidden
      className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out"
    />
  );
}
