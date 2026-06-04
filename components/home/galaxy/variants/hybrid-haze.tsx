"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh } from "ogl";

/*
 * Hybrid edge-on galaxy. Composed of five additive layers, drawn back-to-front:
 *   1. BODY   — a clip-space quad running a domain-warped FBM value-noise shader.
 *               Paints the volumetric luminous ellipse: warm core gradient, dust
 *               lane darkening, coppery streaks. This quad alone reads as a photo.
 *   2. HAZE   — extra low-octave FBM term folded into the body shader (no extra
 *               draw) plus a soft glow falloff: kills the "dots on black" look.
 *   3. STARS  — ~14k tiny sharp gaussian points in a flattened-ellipse + halo
 *               distribution, differential drift + twinkle.
 *   4. ACCENT — ~12 bright feature stars with procedural 4-point diffraction
 *               spikes, desaturated photographic color variety.
 *   5. CORE   — a quad with a gaussian bloom + vertical anamorphic light streak
 *               that gently breathes; the single brightest element.
 *
 * COMPOSITING: the canvas composites over DOM with PREMULTIPLIED alpha. Every
 * fragment outputs vec4(color * I, I) — alpha follows brightness, never 1.0 on
 * dark pixels. All programs use ONE/ONE additive blend (set per-program: ogl
 * re-applies program blend state every draw, overriding raw gl.blendFunc).
 */

// ── tunable knobs ────────────────────────────────────────────────────────────
const K = {
    STAR_COUNT: 14000,
    ACCENT_COUNT: 12,
    DISC_RADIUS: 2.7, // ellipse semi-major axis (world units)
    DISC_FLATTEN: 0.16, // vertical squash → edge-on look (lower = flatter)
    DISC_THICKNESS: 0.07, // out-of-plane scatter
    HALO_FRACTION: 0.16, // share of stars thrown into the spherical halo
    BODY_SCALE: 3.6, // body quad world half-size (covers the disc + glow)
    BODY_BRIGHT: 1.0, // overall body luminosity multiplier
    DUST_DEPTH: 0.62, // how dark the dust lane cuts (0..1)
    CORE_SIZE: 2.2, // core flare quad half-size
    CORE_BRIGHT: 1.35, // core flare luminosity
    ROT_SPEED: 0.11, // base differential rotation rate
    DRIFT: 0.0009, // body/stars slow drift coupling
    PARALLAX: 0.18, // mouse parallax magnitude
    DIVE: 2.2, // scroll dive depth (z units pulled toward core)
};

type Rgb = [number, number, number];
const hex = (h: string): Rgb => {
    const i = parseInt(h.slice(1), 16);
    return [((i >> 16) & 255) / 255, ((i >> 8) & 255) / 255, (i & 255) / 255];
};

// Hubble/JWST astrophoto palette — no neon, no sci-fi.
const CORE_WHITE = hex("#fff4e2");
const CORE_AMBER = hex("#ffd9a0");
const ARM_BLUE = hex("#c8d8f0");
const ARM_WHITE = hex("#efe9dd");
const DUST_COPPER = hex("#b4683c");

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
];
const gauss = () => (Math.random() + Math.random() + Math.random()) / 3 - 0.5;

// ── shared GLSL noise (value noise + fbm) ────────────────────────────────────
const NOISE = /* glsl */ `
  vec2 hash2(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453) * 2.0 - 1.0;
  }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0));
    float b = dot(hash2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0));
    float c = dot(hash2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0));
    float d = dot(hash2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.5 + 0.5;
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for(int i = 0; i < 5; i++){
      v += a * vnoise(p);
      p = m * p;
      a *= 0.5;
    }
    return v;
  }
`;

// ── BODY layer ───────────────────────────────────────────────────────────────
// Full-clip-space quad. We pass the quad's world-space footprint so the noise is
// anchored to the disc, then warp coordinates along the ellipse.
const bodyVert = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uScale;
  varying vec2 vUv;
  varying vec2 vWorld;
  void main(){
    vUv = uv;
    vec3 local = vec3(position * uScale, 0.0);
    vWorld = position * uScale;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(local, 1.0);
  }
`;

const bodyFrag = /* glsl */ `
  precision highp float;
  ${NOISE}
  varying vec2 vUv;
  varying vec2 vWorld;
  uniform float uTime;
  uniform float uFlatten;
  uniform float uDust;
  uniform float uBright;
  uniform vec3 uCore, uAmber, uBlue, uCopper;

  void main(){
    // ellipse space: squash Y so the body is a strongly inclined disc.
    vec2 p = vWorld;
    vec2 e = vec2(p.x, p.y / uFlatten);
    float r = length(e);

    // base luminous envelope of the galaxy body
    float body = exp(-r * r * 0.55);

    // domain warp along the disc → coppery streaks following the major axis
    float t = uTime * 0.03;
    vec2 wp = vec2(p.x * 1.1, p.y / uFlatten * 0.9);
    vec2 warp = vec2(fbm(wp * 1.3 + t), fbm(wp * 1.3 + 7.3 - t)) - 0.5;
    float streak = fbm(wp * 1.6 + warp * 1.4);
    float fine = fbm(wp * 4.0 + warp * 2.0);

    // dust lane: a dark band hugging the mid-plane, broken up by noise.
    float lane = exp(-pow(p.y / (uFlatten * 0.9), 2.0) * 6.0);
    lane *= 0.55 + 0.45 * fbm(vec2(p.x * 2.2, 5.0));
    float dust = lane * uDust * smoothstep(0.05, 1.4, r);

    // luminosity field: bright core falling off, modulated by streaks.
    float lum = body * (0.55 + 0.7 * streak) * (0.8 + 0.4 * fine);
    lum *= (1.0 - dust);
    lum = max(lum, 0.0);

    // color: white-amber core → blue-white arms outward, copper in the streaks.
    float heat = exp(-r * r * 1.4);
    vec3 col = mix(uBlue, uAmber, heat);
    col = mix(col, uCore, heat * heat);
    // coppery dust accents where streaks dip
    col = mix(col, uCopper, clamp((0.5 - streak) * 1.4, 0.0, 0.5) * smoothstep(0.2, 1.2, r));

    float I = lum * uBright;
    // soft outer haze floor so the body never reads as a hard-edged blob
    I += exp(-r * r * 0.18) * 0.06 * (0.6 + 0.4 * streak);

    gl_FragColor = vec4(col * I, I);
  }
`;

// ── STARS layer ──────────────────────────────────────────────────────────────
const starVert = /* glsl */ `
  attribute float aRadius;
  attribute float aTheta;
  attribute float aY;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aHalo;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uFlatten;
  varying vec3 vColor;
  varying float vTw;
  void main(){
    // differential rotation: inner stars orbit faster (disc stars only).
    float w = (1.0 - aHalo) * 0.11 / (0.3 + aRadius);
    float th = aTheta + uTime * w;
    // flattened ellipse: squash the orbital plane in Y for the edge-on body.
    vec3 pos = vec3(cos(th) * aRadius, sin(th) * aRadius * uFlatten + aY, 0.0);
    vec4 mv = viewMatrix * modelMatrix * vec4(pos, 1.0);
    vColor = aColor;
    vTw = 0.78 + 0.22 * sin(uTime * 1.9 + aPhase);
    gl_PointSize = aSize * (7.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const starFrag = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vTw;
  void main(){
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    float I = exp(-d2 * 16.0) * vTw;
    gl_FragColor = vec4(vColor * I, I);
  }
`;

// ── ACCENT layer (diffraction-spike feature stars) ───────────────────────────
const accentVert = /* glsl */ `
  attribute vec3 aPos;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTw;
  void main(){
    vec4 mv = viewMatrix * modelMatrix * vec4(aPos, 1.0);
    vColor = aColor;
    vTw = 0.7 + 0.3 * sin(uTime * 1.3 + aPhase);
    gl_PointSize = aSize * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const accentFrag = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vTw;
  void main(){
    vec2 uv = (gl_PointCoord - 0.5) * 2.0;
    float core = exp(-dot(uv, uv) * 9.0);
    // 4-point diffraction spikes (horizontal + vertical)
    float sx = exp(-abs(uv.y) * 26.0) * exp(-abs(uv.x) * 1.6);
    float sy = exp(-abs(uv.x) * 26.0) * exp(-abs(uv.y) * 1.6);
    float spikes = (sx + sy) * 0.6;
    float I = (core + spikes) * vTw;
    gl_FragColor = vec4(vColor * I, I);
  }
`;

// ── CORE flare layer ─────────────────────────────────────────────────────────
const coreVert = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uScale;
  varying vec2 vUv;
  void main(){
    vUv = uv - 0.5;
    vec3 local = vec3(position * uScale, 0.0);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(local, 1.0);
  }
`;

const coreFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uBright;
  uniform vec3 uCore, uAmber;
  void main(){
    float breathe = 0.92 + 0.08 * sin(uTime * 0.6);
    vec2 p = vUv;
    float r = length(p);
    // wide soft gaussian bloom
    float bloom = exp(-r * r * 7.0);
    float hot = exp(-r * r * 55.0);
    // vertical anamorphic streak (lens-flare feel)
    float streak = exp(-abs(p.x) * 60.0) * exp(-abs(p.y) * 3.2) * 0.7;
    // faint horizontal companion streak
    float streakH = exp(-abs(p.y) * 90.0) * exp(-abs(p.x) * 5.0) * 0.3;
    float I = (bloom * 0.6 + hot * 1.2 + streak + streakH) * uBright * breathe;
    vec3 col = mix(uAmber, uCore, hot + streak);
    gl_FragColor = vec4(col * I, I);
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

        const camera = new Camera(gl, { fov: 40 });

        // right-of-center on wide screens; centered on narrow ones.
        const center: [number, number] = [0, 0];
        const resize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            const aspect = gl.canvas.width / gl.canvas.height;
            camera.perspective({ aspect });
            center[0] = aspect > 1 ? 1.15 : 0;
            center[1] = aspect > 1 ? 0.1 : 0.55;
        };
        window.addEventListener("resize", resize, false);
        resize();

        // ── quad geometry (shared by body + core) ─────────────────────────────
        const quad = () =>
            new Geometry(gl, {
                position: {
                    size: 2,
                    data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                },
                uv: {
                    size: 2,
                    data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
                },
            });

        // ── BODY ──────────────────────────────────────────────────────────────
        const bodyProgram = new Program(gl, {
            vertex: bodyVert,
            fragment: bodyFrag,
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: K.BODY_SCALE },
                uFlatten: { value: K.DISC_FLATTEN * 2.4 },
                uDust: { value: K.DUST_DEPTH },
                uBright: { value: K.BODY_BRIGHT },
                uCore: { value: CORE_WHITE },
                uAmber: { value: CORE_AMBER },
                uBlue: { value: ARM_BLUE },
                uCopper: { value: DUST_COPPER },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        bodyProgram.setBlendFunc(gl.ONE, gl.ONE);
        const bodyMesh = new Mesh(gl, { geometry: quad(), program: bodyProgram });

        // ── STARS ─────────────────────────────────────────────────────────────
        const COUNT = K.STAR_COUNT;
        const aRadius = new Float32Array(COUNT);
        const aTheta = new Float32Array(COUNT);
        const aY = new Float32Array(COUNT);
        const sColors = new Float32Array(COUNT * 3);
        const sSizes = new Float32Array(COUNT);
        const sPhase = new Float32Array(COUNT);
        const sHalo = new Float32Array(COUNT);

        for (let n = 0; n < COUNT; n++) {
            const isHalo = Math.random() < K.HALO_FRACTION;
            let r: number, y: number, c: Rgb, size: number, lum: number;
            if (isHalo) {
                r = K.DISC_RADIUS * (0.6 + Math.random() * 1.7);
                y = gauss() * K.DISC_RADIUS * 0.55;
                c = mix(ARM_BLUE, ARM_WHITE, Math.random());
                size = 0.9 + Math.random() * 1.6;
                lum = 0.32;
            } else {
                // flattened disc: dense toward the core (pow weighting)
                const tt = Math.pow(Math.random(), 0.6);
                r = 0.08 + tt * K.DISC_RADIUS;
                y = gauss() * K.DISC_THICKNESS * (0.5 + tt);
                const heat = Math.exp(-r * r * 0.9); // warmer near core
                if (Math.random() < heat * 0.8) {
                    c = mix(CORE_AMBER, CORE_WHITE, Math.random() * 0.7);
                } else {
                    c = mix(ARM_BLUE, ARM_WHITE, Math.random() * 0.6);
                }
                size = 1.0 + Math.random() * 2.2 + heat * 1.4;
                lum = 0.55 + heat * 0.4;
            }
            aRadius[n] = r;
            aTheta[n] = Math.random() * Math.PI * 2;
            aY[n] = y;
            sColors.set([c[0] * lum, c[1] * lum, c[2] * lum], n * 3);
            sSizes[n] = size;
            sPhase[n] = Math.random() * Math.PI * 2;
            sHalo[n] = isHalo ? 1 : 0;
        }

        const starGeo = new Geometry(gl, {
            aRadius: { size: 1, data: aRadius },
            aTheta: { size: 1, data: aTheta },
            aY: { size: 1, data: aY },
            aColor: { size: 3, data: sColors },
            aSize: { size: 1, data: sSizes },
            aPhase: { size: 1, data: sPhase },
            aHalo: { size: 1, data: sHalo },
        });
        const starProgram = new Program(gl, {
            vertex: starVert,
            fragment: starFrag,
            uniforms: {
                uTime: { value: 0 },
                uFlatten: { value: K.DISC_FLATTEN },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        starProgram.setBlendFunc(gl.ONE, gl.ONE);
        const starMesh = new Mesh(gl, { mode: gl.POINTS, geometry: starGeo, program: starProgram });

        // ── ACCENT stars ──────────────────────────────────────────────────────
        const AC = K.ACCENT_COUNT;
        const aaPos = new Float32Array(AC * 3);
        const aaCol = new Float32Array(AC * 3);
        const aaSize = new Float32Array(AC);
        const aaPhase = new Float32Array(AC);
        const accentPalette: Rgb[] = [
            hex("#ffe6c0"), // warm gold
            hex("#ffd0b0"), // soft orange
            hex("#f3c8d0"), // pale pink
            hex("#cfe0f5"), // pale blue
            hex("#fff0dd"), // white
        ];
        for (let n = 0; n < AC; n++) {
            const r = 0.25 + Math.random() * (K.DISC_RADIUS * 0.95);
            const th = Math.random() * Math.PI * 2;
            const y = gauss() * K.DISC_THICKNESS * 1.4;
            aaPos.set([Math.cos(th) * r, Math.sin(th) * r * K.DISC_FLATTEN + y, 0], n * 3);
            const c = accentPalette[(Math.random() * accentPalette.length) | 0];
            const lum = 0.8 + Math.random() * 0.5;
            aaCol.set([c[0] * lum, c[1] * lum, c[2] * lum], n * 3);
            aaSize[n] = 7 + Math.random() * 9;
            aaPhase[n] = Math.random() * Math.PI * 2;
        }
        const accentGeo = new Geometry(gl, {
            aPos: { size: 3, data: aaPos },
            aColor: { size: 3, data: aaCol },
            aSize: { size: 1, data: aaSize },
            aPhase: { size: 1, data: aaPhase },
        });
        const accentProgram = new Program(gl, {
            vertex: accentVert,
            fragment: accentFrag,
            uniforms: { uTime: { value: 0 } },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        accentProgram.setBlendFunc(gl.ONE, gl.ONE);
        const accentMesh = new Mesh(gl, { mode: gl.POINTS, geometry: accentGeo, program: accentProgram });

        // ── CORE flare ────────────────────────────────────────────────────────
        const coreProgram = new Program(gl, {
            vertex: coreVert,
            fragment: coreFrag,
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: K.CORE_SIZE },
                uBright: { value: K.CORE_BRIGHT },
                uCore: { value: CORE_WHITE },
                uAmber: { value: CORE_AMBER },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });
        coreProgram.setBlendFunc(gl.ONE, gl.ONE);
        const coreMesh = new Mesh(gl, { geometry: quad(), program: coreProgram });

        const layers = [bodyMesh, starMesh, accentMesh, coreMesh];

        // ── interaction ───────────────────────────────────────────────────────
        const mouse = { x: 0, y: 0 };
        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
        };
        container.addEventListener("mousemove", onMouseMove);

        let scrollT = 0;
        const onScroll = () => {
            scrollT = Math.min(1, window.scrollY / window.innerHeight);
        };
        window.addEventListener("scroll", onScroll, { passive: true });

        let visible = true;
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
        });
        io.observe(container);

        // ── render loop ───────────────────────────────────────────────────────
        let raf = 0;
        let last = performance.now();
        let elapsed = 0;
        const update = (t: number) => {
            raf = requestAnimationFrame(update);
            const dt = Math.min(t - last, 64);
            last = t;
            if (!visible) return;
            elapsed += dt * 0.001 * K.ROT_SPEED * 10;

            bodyProgram.uniforms.uTime.value = elapsed;
            starProgram.uniforms.uTime.value = elapsed;
            accentProgram.uniforms.uTime.value = elapsed;
            coreProgram.uniforms.uTime.value = elapsed;

            const dive = scrollT * scrollT;
            camera.position.set(
                mouse.x * K.PARALLAX,
                -2.4 + dive * 1.3 + mouse.y * K.PARALLAX * 0.6,
                5.8 - dive * K.DIVE,
            );
            camera.lookAt([0, 0, 0]);

            for (const m of layers) m.position.set(center[0], center[1], 0);

            renderer.render({ scene: bodyMesh, camera, clear: true });
            renderer.render({ scene: starMesh, camera, clear: false });
            renderer.render({ scene: accentMesh, camera, clear: false });
            renderer.render({ scene: coreMesh, camera, clear: false });
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
