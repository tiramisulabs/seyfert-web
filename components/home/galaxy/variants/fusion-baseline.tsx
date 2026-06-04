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
//   5. front accretion band (rotated thin ellipse, FBM streaks drifting)
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
  uniform float uZoom;     // scroll dive 0..1
  uniform float uScale;    // system scale (smaller on narrow screens)
  uniform vec2  uTilt;     // mouse parallax (radians-ish, tiny)

  // ── astrophotographic palette (locked: no neon, no cyan/purple) ──
  const vec3 HOT   = vec3(1.000, 0.957, 0.886); // #fff4e2 warm white
  const vec3 WARM  = vec3(1.000, 0.851, 0.627); // #ffd9a0 amber
  const vec3 COPPER= vec3(0.706, 0.408, 0.235); // #b4683c coppery edge
  const vec3 STAR  = vec3(0.784, 0.847, 0.941); // #c8d8f0 cool white-blue

  // ── tunables ──
  #define HOLE_R   0.255   // event-horizon radius (in local units)
  #define RING_W   0.011   // photon-ring thickness
  #define DISK_TILT -0.42  // accretion band diagonal angle (radians)
  #define BEAM      0.70   // doppler beaming asymmetry 0..1
  #define DRIFT     0.045  // disk scroll speed
  #define STAR_DENSITY 0.955

  // ---------- hashing / noise ----------
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

  // 4-octave FBM — capped for perf
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

  mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  // soft band profile around 0
  float band(float x, float w) {
    return exp(-x * x / (w * w));
  }

  void main() {
    // aspect-correct coordinates, origin at the hole center
    vec2 res = uResolution;
    float aspect = res.x / res.y;
    vec2 ndc = (vUv * 2.0 - 1.0);
    ndc.x *= aspect;

    // scroll dive: gently zoom toward the system
    float zoom = (1.0 - uZoom * 0.22) * uScale;
    vec2 p = (ndc - uCenter) / zoom;

    // whole-system tilt (mouse parallax ±2°)
    p = rot(uTilt.x * 0.5) * p;
    p += uTilt * 0.04;

    float r = length(p);

    vec3 col = vec3(0.0);

    // ===== 1. background starfield (behind everything) =====
    {
      vec2 sp = ndc * 2.2;
      sp = rot(uTilt.x * 0.5) * sp + uTilt * 0.3;
      vec2 cell = floor(sp * 14.0);
      float h = hash21(cell);
      // sparse: only cells above threshold spawn a star
      if (h > STAR_DENSITY) {
        vec2 f = fract(sp * 14.0) - 0.5;
        // jitter star within its cell
        f -= (vec2(hash21(cell + 3.1), hash21(cell + 7.7)) - 0.5) * 0.7;
        float d = length(f);
        float tw = 0.6 + 0.4 * sin(uTime * 1.3 + h * 40.0);
        // a few stars are bigger and warmer (photographic variety)
        float big = step(0.9988, h);
        float rad = mix(0.06, 0.16, big);
        float s = smoothstep(rad, 0.0, d) * tw;
        vec3 starCol = mix(STAR, WARM, big * 0.7);
        col += starCol * s * mix(1.7, 2.6, big);
      }
      // faint dust haze so space isn't pure black (still transparent-ish)
      float haze = fbm(ndc * 1.3 + 5.0) * 0.04;
      col += mix(vec3(0.02, 0.03, 0.05), COPPER * 0.12, haze) * haze * 2.5;
    }

    // accretion-disk local frame: rotate so the band runs diagonally
    vec2 dp = rot(-DISK_TILT) * p;
    // disk longitude used for doppler + streak scroll
    float lon = atan(dp.y, dp.x);
    // approaching side (left) is blue-shifted & beamed brighter
    float doppler = 0.5 + 0.5 * cos(lon); // 1 on +x, 0 on -x
    float beamL = mix(1.0, 1.0 - BEAM, doppler);   // brighter on left
    float beamR = mix(1.0, 1.0 - BEAM, 1.0 - doppler);

    // streak coordinate: scroll along the band over time
    float streakU = lon * 2.2 - uTime * DRIFT * 14.0;
    float streakV = (r - HOLE_R) * 6.0;
    float streaks = fbm(vec2(streakU, streakV)) * 0.55 + 0.45;
    streaks = mix(0.75, 1.25, streaks);

    // ===== 1b. luminous disc body (fusion with hybrid-haze) =====
    // wide soft haze hugging the disc plane + fine star dust — gives the
    // photographic milky body the bare analytic bands lacked
    {
      float hazeBand = band(dp.y, 0.20) * smoothstep(1.9, 0.15, r);
      float hazeNoise = fbm(vec2(dp.x * 2.0 - uTime * 0.02, dp.y * 9.0)) * 0.6 + 0.4;
      vec3 hazeCol = mix(WARM, COPPER, 0.58);
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
      col += arcCol * a * streaks * 2.4;
    }

    // ===== 3. event horizon (true black disc, occludes) =====
    float holeMask = smoothstep(HOLE_R, HOLE_R - 0.010, r); // 1 inside
    // darken everything inside the rim toward black
    col *= (1.0 - holeMask);

    // ===== 4. photon ring (thin, bright, doppler-asymmetric, bloomed) =====
    {
      float x = r - (HOLE_R + RING_W * 0.5);
      // three-layer glow: razor core + tight halo + wide faint bloom
      float ring = band(x, 0.007) * 3.6 + band(x, 0.045) * 0.55 + band(x, 0.16) * 0.16;
      // brighter on the approaching (left) limb
      float limb = mix(beamR, beamL, smoothstep(-0.2, 0.2, p.x));
      float brightness = mix(0.85, 2.1, limb);
      vec3 ringCol = mix(HOT, WARM, 0.55);
      col += ringCol * ring * brightness;
    }

    // ===== 5. front accretion band (crosses the hole equator) =====
    {
      // thin ellipse in disk frame: tight in V, wide in U
      float thickness = 0.052;
      float bandMask = band(dp.y, thickness);
      // the FRONT of the disk crosses the hole (the Interstellar signature) —
      // slightly dimmer across the disc, full strength outside
      float front = smoothstep(HOLE_R * 0.5, HOLE_R * 1.1, abs(dp.x));
      // outer falloff so the band has finite extent
      float reach = smoothstep(1.7, 0.3, r);
      float m = bandMask * mix(0.5, 1.0, front) * reach;

      // color across the band: hot core line → amber → copper edges
      float edge = abs(dp.y) / thickness;
      vec3 bandCol = mix(HOT, WARM, smoothstep(0.0, 0.7, edge));
      bandCol = mix(bandCol, COPPER, smoothstep(0.7, 1.6, edge));

      // doppler beaming: left limb brighter
      float beam = mix(0.6, 1.8, smoothstep(-0.6, 0.6, -dp.x));
      col += bandCol * m * streaks * beam * 2.1;

      // hotspot where the approaching flow grazes the ring (left limb)
      float hs = band(dp.y, 0.1) * exp(-pow((dp.x + HOLE_R * 1.25) / 0.22, 2.0));
      col += mix(HOT, WARM, 0.3) * hs * 1.5;

      // anamorphic streak bleeding horizontally from the hotspot (lens flare)
      vec2 hp = p + HOLE_R * 1.25 * vec2(cos(DISK_TILT), sin(DISK_TILT));
      float flare = exp(-abs(hp.y) * 22.0) * exp(-abs(hp.x) * 2.4);
      col += mix(HOT, WARM, 0.45) * flare * 0.9;
    }

    // gentle filmic-ish tone shaping, keep highlights warm
    col = col / (col + vec3(0.6));
    col = pow(col, vec3(0.9));
    // nudge saturation back up after the compression
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, 1.45);

    // ── premultiplied output ──
    // alpha follows luminance so empty space is transparent... EXCEPT the
    // event horizon, which must occlude the page → force alpha to 1 (black).
    float lum = max(col.r, max(col.g, col.b));
    float a = clamp(lum * 1.15, 0.0, 1.0);
    a = max(a, holeMask);            // hole stays opaque
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

        let raf = 0;
        let last = performance.now();
        let elapsed = 0;
        let zoom = 0;
        const update = (t: number) => {
            raf = requestAnimationFrame(update);
            const dt = Math.min(t - last, 64);
            last = t;
            if (!visible) return;
            elapsed += dt * 0.001;

            // smooth the parallax + zoom so motion feels heavy and cinematic
            mouse.x += (target.x - mouse.x) * 0.05;
            mouse.y += (target.y - mouse.y) * 0.05;
            zoom += (scrollT * scrollT - zoom) * 0.06;

            program.uniforms.uTime.value = elapsed;
            program.uniforms.uTilt.value = [mouse.x, mouse.y];
            program.uniforms.uZoom.value = zoom;

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
