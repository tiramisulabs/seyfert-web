"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Program, Mesh, Triangle } from "ogl";

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTIC BLACK HOLE — the phone cut.
//
// The desktop hero integrates real null geodesics; at phone sizes that march
// read as pixel noise and ate battery, so phones used to get the static CSS
// astrophoto. This is the middle path: the same Gargantua anatomy — shadow,
// photon ring, doppler-beamed front band, folded-over halo, starfield —
// PAINTED analytically in one cheap pass. No integration, no render targets,
// no governor. Every shape is a closed-form distance field, so it runs at
// dpr 1 / 30fps on whatever GPU a phone has.
//
// Shares the locked astro palette and the premultiplied-alpha contract with
// galaxy-canvas: empty sky is transparent (the CSS fallback layers below),
// only the shadow is opaque. Bails ≥768px (desktop boots the real one),
// on prefers-reduced-motion, and on no-WebGL.
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

const fragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec2  uCenter;   // hole offset, same NDC convention as the desktop
  uniform float uScale;    // shadow radius in NDC-y units
  uniform float uZoom;     // scroll dive 0..1
  uniform float uIntro;    // mount reveal 0..1

  // locked astro palette (same constants as the geodesic shader)
  const vec3 HOT    = vec3(1.000, 0.957, 0.886);
  const vec3 WARM   = vec3(1.000, 0.851, 0.627);
  const vec3 COPPER = vec3(0.706, 0.408, 0.235);
  const vec3 STARC  = vec3(0.784, 0.847, 0.941);

  #define ROLL   -0.46     // diagonal band, echoes the desktop composition
  #define TILT    0.30     // disk foreshortening (ellipse y compression)
  #define R_IN    1.45     // disk inner edge (in shadow radii)
  #define R_OUT   2.75     // disk outer edge

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.5 * vnoise(p);
    v += 0.25 * vnoise(p * 2.03 + 7.7);
    return v;
  }

  // disk emission for an (elliptical) annulus point: filaments advected by a
  // bounded rigid spin + frozen Keplerian pre-wind, doppler asymmetry on x
  vec3 band(float sd, float phi, float px) {
    float t = (sd - R_IN) / (R_OUT - R_IN);          // 0 inner .. 1 outer
    float radial = smoothstep(0.0, 0.07, t) * (1.0 - smoothstep(0.62, 1.0, t));
    radial *= 1.0 / (0.40 + 2.2 * t * t);

    float aAdv = phi + uTime * 0.16 + (pow(R_IN / max(sd, R_IN), 1.5) - 0.6) * 4.5;
    vec2 hp = vec2(cos(aAdv), sin(aAdv)) * sd;
    float fil = fbm(hp * 1.5 + 3.1);
    fil = pow(clamp(fil * 1.8, 0.0, 1.0), 1.8);
    float emis = 0.35 + 1.25 * fil;

    // doppler stand-in: the left limb approaches → beams bright and whitens,
    // the right limb recedes → dim deep copper (the color carries the story)
    float appr = smoothstep(0.9, -1.2, px / max(sd, 0.5));
    float beam = mix(0.38, 2.6, appr);
    vec3 col = mix(WARM, COPPER, smoothstep(0.1, 0.9, t));
    col = mix(col, HOT, pow(appr, 2.4) * 0.75);
    return col * (radial * emis * beam);
  }

  void main() {
    vec2 res = uResolution;
    float aspect = res.x / res.y;
    vec2 ndc = vUv * 2.0 - 1.0;
    ndc.x *= aspect;

    // no intro zoom nudge — must match the static fallback photo's framing
    float zoom = uScale * (1.0 - uZoom * 0.22);
    vec2 p = (ndc - uCenter) / zoom;
    p = vec2(p.x * cos(ROLL) - p.y * sin(ROLL),
             p.x * sin(ROLL) + p.y * cos(ROLL));
    float r = length(p);

    vec3 col = vec3(0.0);

    // ── starfield with a fake lensing pull: sample positions are dragged
    // toward the hole as 1/r, so star streaks crowd the ring like the real one
    vec2 sp = p - p / max(r * r, 0.8) * 0.55;
    vec2 cell = floor(sp * 5.0);
    float h = hash21(cell);
    if (h > 0.93 && r > 1.1) {
      vec2 f = fract(sp * 5.0) - 0.5;
      f -= (vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5) * 0.8;
      float tw = 0.7 + 0.3 * sin(uTime * 1.8 + h * 60.0);
      float s = smoothstep(0.09, 0.0, length(f)) * tw;
      col += mix(STARC, WARM, step(0.97, h)) * s * 0.8;
    }

    // ── front band: tilted disk annulus (ellipse inversion), crossing in
    // front of and below the shadow — its top half hides BEHIND the hole
    // (that light is what the halo re-images)
    vec2 e = vec2(p.x, p.y / TILT);
    float sd = length(e);
    if (sd > R_IN && sd < R_OUT && p.y < 0.38) {
      float frontW = smoothstep(0.38, 0.05, p.y);     // fades where halo takes over
      // over the shadow only the NEAR (lower) sheet shows
      if (r < 1.0) frontW *= smoothstep(0.25, -0.05, p.y);
      col += band(sd, atan(e.y, e.x), p.x) * frontW;
    }

    // ── folded halo: the far side of the disk lensed over/under the shadow,
    // hugging the photon ring. Brighter above (primary image), faint below
    // (secondary), same doppler bias.
    float haloR = abs(r - 1.26);
    float halo = exp(-haloR * haloR * 18.0);
    float upper = smoothstep(-0.25, 0.45, p.y);
    float lower = (1.0 - upper) * 0.38;
    float hphi = atan(p.y, p.x);
    float hfil = 0.55 + 0.45 * fbm(vec2(hphi * 2.2 + uTime * 0.16, r * 3.0));
    float happr = smoothstep(0.9, -1.2, p.x / max(r, 0.5));
    vec3 haloCol = mix(mix(WARM, COPPER, 0.35), HOT, pow(happr, 2.2) * 0.6);
    col += haloCol * halo * (upper + lower) * hfil * mix(0.5, 1.9, happr);

    // ── photon ring: thin hot line wrapping the shadow
    float ringD = abs(r - 1.06);
    col += HOT * exp(-ringD * ringD * 220.0) * 1.1;

    // ── warm ambient glow around the whole system
    col += mix(WARM, COPPER, 0.5) * exp(-max(r - 1.0, 0.0) * 1.7) * 0.10;

    // ── shadow: opaque black, swallows everything painted "behind" it
    float shadow = 1.0 - smoothstep(0.965, 1.0, r);
    col *= 1.0 - shadow;

    // filmic-ish curve + the desktop's warm highlight bias
    col = col * (2.2 + col) / (1.6 + col * 1.4);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(1.0, 0.93, 0.80), smoothstep(0.25, 0.9, luma));

    col *= uIntro;

    float lum = max(col.r, max(col.g, col.b));
    float a = clamp(lum * 1.25, 0.0, 1.0);
    a = max(a, shadow * uIntro);
    gl_FragColor = vec4(col * a, a);
  }
`;

export default function GalaxyLite() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // desktop boots the geodesic raymarcher instead
    if (window.matchMedia("(min-width: 768px)").matches) return;

    const renderer = new Renderer({
      depth: false,
      alpha: true,
      dpr: 1, // phone hero: shapes are smooth gradients, dpr 1 is invisible
      powerPreference: "low-power",
    });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);
    gl.clearColor(0, 0, 0, 0);

    const fallback =
      container.parentElement?.querySelector<HTMLElement>("[data-galaxy-fallback]") ?? null;
    let fallbackHidden = false;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      container.style.opacity = "0"; // dead canvas must not sit over the photo
      if (fallback) fallback.style.opacity = "1";
    };
    gl.canvas.addEventListener("webglcontextlost", onContextLost);

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
        // bottom-right corner, partially cropped — the band sweeps up-left
        // through the hero's only empty pocket and no copy ever crosses the
        // shadow or the bright halo. x is set aspect-proportionally in
        // resize() so the hole sits at the same width-fraction on any phone
        // (and so the static fallback photo aligns exactly).
        uCenter: { value: [0.34, -0.78] },
        uScale: { value: 0.26 },
        uZoom: { value: 0 },
        uIntro: { value: 1 }, // no reveal ramp — the fallback photo IS frame 0
      },
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
      // hole center x at ~86.8% of the width on every aspect
      const aspect = gl.canvas.width / gl.canvas.height;
      program.uniforms.uCenter.value = [aspect * 0.736, -0.78];
    };
    window.addEventListener("resize", resize, false);
    resize();

    let scrollT = 0;
    const onScroll = () => {
      scrollT = Math.min(1, window.scrollY / window.innerHeight);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(container);

    let hidden = document.hidden;
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    let zoom = 0;
    let fadeStart = 0; // disk held at t=0 until the canvas fade-in ends
    const TIME_WRAP = (Math.PI * 2 / 0.16) * 30; // exact spin periods ≈ 1178 s

    // capture hook: /?bhfreeze=<seconds> — see galaxy-canvas; the fallback
    // photo must be this scene's exact t=0 frame for an invisible handoff
    const freezeParam = new URLSearchParams(window.location.search).get("bhfreeze");
    const freeze = freezeParam === null ? null : Number(freezeParam) || 0;

    const update = (t: number) => {
      raf = requestAnimationFrame(update);
      if (!visible || hidden) { last = t; return; }
      const dt = Math.min(t - last, 64);
      if (dt < 31) return; // 30fps cap — battery first, the motion is slow
      last = t;
      const dts = dt * 0.001;
      // hold the disk frozen at its captured t=0 phase through the 500ms fade so
      // it doesn't rotate under the still photo (reads as a load displacement)
      const settling = fadeStart === 0 || t < fadeStart + 560;
      elapsed = freeze ?? (settling ? 0 : (elapsed + dts) % TIME_WRAP);

      zoom += (scrollT - zoom) * 0.08;

      program.uniforms.uTime.value = elapsed;
      program.uniforms.uZoom.value = zoom;
      renderer.render({ scene: mesh, camera });

      // crossfade in on the first real frame (same anti-pop as the desktop)
      if (!fallbackHidden) {
        container.style.opacity = "1";
        if (fallback) fallback.style.opacity = "0";
        fallbackHidden = true;
        fadeStart = t;
      }
    };
    raf = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.canvas.removeEventListener("webglcontextlost", onContextLost);
      cancelAnimationFrame(raf);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
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
