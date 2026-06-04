"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Program, Mesh, Triangle, RenderTarget } from "ogl";

// Interstellar Gargantua — a REAL gravitationally-lensed black hole.
//
// The lensing is NOT analytic anymore: every pixel shoots a null geodesic and
// integrates the Schwarzschild photon ODE
//     accel = -1.5 * h2 * pos / |pos|^5,   h2 = |cross(pos,vel)|^2  (conserved)
// with a leapfrog/RK2 integrator (fixed step, 64-96 steps, early-exit on
// capture r<rs or escape r>r_max). The camera sits a few degrees ABOVE the
// equatorial disk so the disk reads as a 3D plane in perspective; the bending
// folds the far side up and over the hole. The photon ring emerges from the
// geodesics — we never draw a ring. When a ray escapes we sample a procedural
// starfield + milky band from its FINAL direction, so the sky visibly wraps.
//
// PASS 1 (half-res RenderTarget): the geodesic raymarch + disk + sky. Heavy.
// PASS 2 (full-res to screen): bilinear upscale + ACES tonemap + edge-aware
//        chromatic aberration + animated film grain + hole-anchored vignette.
//        Grain/CA run at full res so they stay crisp under the upscale.
//
// Premultiplied-alpha contract: out = vec4(col*a, a); alpha tracks luminance so
// empty sky is transparent over the DOM. ONLY the event-horizon shadow forces
// alpha=1 (opaque black) so the hole genuinely occludes the page.
//
// Astrophoto palette ONLY: #fff4e2 warm white, #ffd9a0 amber, #b4683c copper,
// #c8d8f0 cool stars, #05070d toe. No neon / cyan / purple.

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// ───────────────────────── PASS 1 : geodesic raymarch ─────────────────────────
const fragGeo = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform vec2  uResolution;  // half-res target size
  uniform vec2  uCenter;      // hole offset in aspect-scaled NDC (right-of-center wide)
  uniform float uZoom;        // scroll dive 0..1 (eased CPU-side)
  uniform float uScale;       // system scale (smaller on narrow screens)
  uniform vec2  uTilt;        // mouse parallax (radians-ish)
  uniform float uIntro;       // mount reveal 0..1 (ease-out-quint)

  // ── astrophotographic palette (locked) ──
  const vec3 HOT    = vec3(1.000, 0.957, 0.886); // #fff4e2
  const vec3 WARM   = vec3(1.000, 0.851, 0.627); // #ffd9a0
  const vec3 COPPER = vec3(0.706, 0.408, 0.235); // #b4683c
  const vec3 STAR   = vec3(0.784, 0.847, 0.941); // #c8d8f0
  const vec3 TOE    = vec3(0.0196, 0.0275, 0.051); // #05070d

  // ── physical scale (geometric units; rs = 1) ──
  #define RS        1.0      // Schwarzschild radius (event horizon)
  #define R_MAX     32.0     // escape radius (sky sampled here)
  #define R_ISCO    2.2      // disk inner edge (~2.2 rs)
  #define R_OUT     5.2      // disk outer edge (~5.2 rs)

  // ── integrator tunables ──
  #define STEPS     80       // geodesic steps (image-first; 64-96 range)
  #define DT_BASE   0.085    // base leapfrog step
  #define MAX_CROSS 3         // equatorial crossings accumulated

  // ── disk look-dev ──
  #define KEPLER     0.85    // Keplerian advection rate (azimuth/sec scaler)
  #define FIL_FREQ   2.6     // azimuthal filament frequency
  #define BEAM_GAIN  2.6     // relativistic doppler beaming exponent gain
  #define REDSHIFT   0.55    // gravitational redshift dimming toward rs

  // ── camera ──
  #define CAM_DIST   13.0    // camera distance from hole (rs)
  #define CAM_ELEV   0.105   // elevation above equatorial plane (~6deg)
  #define FOV        0.62    // field of view scaler

  // ---------- hashing / noise ----------
  float hash11(float n){ return fract(sin(n)*43758.5453123); }
  float hash21(vec2 p){
    p = fract(p*vec2(123.34,345.45));
    p += dot(p, p+34.345);
    return fract(p.x*p.y);
  }
  float hash31(vec3 p){
    p = fract(p*vec3(0.1031,0.1030,0.0973));
    p += dot(p, p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
  }
  float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    vec2 u=f*f*(3.0-2.0*f);
    float a=hash21(i), b=hash21(i+vec2(1,0));
    float c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v=0.0, amp=0.5;
    for(int i=0;i<4;i++){ v+=amp*vnoise(p); p=p*2.03+11.3; amp*=0.5; }
    return v;
  }
  float fbm3(vec2 p){
    float v=0.0, amp=0.5;
    for(int i=0;i<3;i++){ v+=amp*vnoise(p); p=p*2.05+7.7; amp*=0.5; }
    return v;
  }
  mat2 rot(float a){ return mat2(cos(a),-sin(a),sin(a),cos(a)); }

  // ── procedural sky from a 3D escape direction ──
  // starfield + faint milky band; stars stretch into arcs near the photon ring
  // automatically because neighbouring geodesics fan out into the same cells.
  vec3 sampleSky(vec3 d){
    // spherical-ish parameterisation for stable cells
    vec2 uvp = vec2(atan(d.z, d.x), asin(clamp(d.y,-1.0,1.0)));
    vec3 col = vec3(0.0);
    // faint milky band tilted across the sky
    float band = exp(-pow((uvp.y + 0.12*sin(uvp.x*1.3))*2.1, 2.0));
    col += mix(vec3(0.012,0.016,0.028), COPPER*0.10, fbm(uvp*2.5)) * (0.45 + band*0.9);
    // two star layers at different scales
    for(int L=0;L<2;L++){
      float sc = (L==0)? 26.0 : 14.0;
      vec2 g = uvp*sc;
      vec2 cell = floor(g);
      float h = hash21(cell + float(L)*19.0);
      float thr = (L==0)? 0.978 : 0.965;
      if(h>thr){
        vec2 f = fract(g)-0.5;
        f -= (vec2(hash21(cell+3.1),hash21(cell+7.7))-0.5)*0.7;
        float dst = length(f);
        float ph = h*60.0;
        float tw = 0.7 + 0.3*sin(uTime*(1.5+float(L)) + ph);
        float big = step(0.9975, h);
        float rad = mix(0.10, 0.20, big);
        float s = smoothstep(rad, 0.0, dst)*tw;
        float temp = hash21(cell+91.7);
        vec3 sc2 = mix(mix(STAR, vec3(0.93,0.95,1.0),0.35), WARM, smoothstep(0.5,1.0,temp));
        col += sc2 * s * mix(1.4,2.4,big);
      }
    }
    return col;
  }

  // multi-scale disk filaments advected by Keplerian differential rotation.
  // radius in rs, phi azimuth. Returns emission colour (linear, pre-beaming).
  vec3 diskEmission(float radius, float phi, out float intensity){
    // Keplerian angular velocity ~ r^-1.5 → inner gas leads strongly.
    float omega = KEPLER * pow(radius, -1.5);
    float adv   = phi + omega * uTime;        // advected azimuth
    // radial coordinate normalised across the annulus 0(inner)..1(outer)
    float rn = clamp((radius - R_ISCO)/(R_OUT - R_ISCO), 0.0, 1.0);

    // domain-warp for stringy filaments
    vec2 q = vec2(adv*FIL_FREQ, radius*1.2);
    float wx = fbm3(q + 3.1)-0.5;
    float wy = fbm3(q + 9.4)-0.5;
    vec2 fp = vec2(adv*FIL_FREQ + wx*1.4, radius*1.6 + wy*1.1);
    float broad = fbm3(fp);
    float fine  = fbm3(fp*vec2(2.4,1.5)+17.0);
    float fil = mix(broad, fine, 0.45);
    fil = pow(clamp(fil*1.3,0.0,1.0), 1.5);

    // orbiting hot clumps
    float cn = fbm3(vec2(adv*1.5+4.0, radius*0.9));
    float clump = smoothstep(0.62, 0.82, cn);

    // radial brightness: bright inner, frayed outer rim
    float edgeIn  = smoothstep(0.0, 0.06, rn);          // ISCO lip
    float edgeOut = 1.0 - smoothstep(0.78, 1.0, rn);    // ragged outer fade
    float bodyFray = mix(0.55, 1.0, smoothstep(0.1,0.6,fil));
    intensity = (0.45 + 0.95*fil + clump*1.6) * edgeIn * edgeOut * bodyFray;
    // razor inner lip flares
    intensity += smoothstep(0.05,0.0,rn) * 1.6;

    // temperature: white-amber inner → copper outer (gravitational reddening)
    vec3 c = mix(mix(HOT, WARM, 0.35), WARM, smoothstep(0.0,0.45,rn));
    c = mix(c, COPPER, smoothstep(0.5,1.0,rn));
    // inner gas whitens
    c = mix(c, vec3(1.0), (1.0-rn)*0.30);
    return c;
  }

  void main(){
    vec2 res = uResolution;
    float aspect = res.x/res.y;
    vec2 ndc = (vUv*2.0-1.0);
    ndc.x *= aspect;

    // intro framing nudge + breath
    float breath = sin(uTime*6.2831853/19.0);
    float introZoomOut = (1.0-uIntro)*0.05;
    float dive = uZoom;
    float zoom = (1.0 - dive*0.22 + introZoomOut) * uScale * (1.0+breath*0.010);

    // map pixel into the hole-local image plane
    vec2 sp = (ndc - uCenter) / max(zoom, 0.0001);
    // mouse parallax + dive counter-tilt on the screen plane
    sp = rot(uTilt.x*0.4 - dive*0.10) * sp;
    sp += uTilt*0.04;
    sp.y -= dive*0.05;

    // ── build a 3D camera basis: above the equatorial (xz) plane, looking at hole.
    // Disk lives in y=0 plane. Camera elevated by CAM_ELEV (radians).
    float el = CAM_ELEV + uTilt.y*0.20 - dive*0.04;  // a touch of mouse/dive elevation
    vec3 camPos = vec3(0.0, sin(el)*CAM_DIST, -cos(el)*CAM_DIST);
    vec3 fwd = normalize(-camPos);
    vec3 right = normalize(cross(vec3(0.0,1.0,0.0), fwd));
    vec3 up = cross(fwd, right);

    // ray dir through this pixel
    vec3 rd = normalize(fwd + (sp.x*right + sp.y*up)*FOV);
    vec3 pos = camPos;
    vec3 vel = rd;

    // conserved angular-momentum magnitude² for the Schwarzschild photon ODE
    vec3 h = cross(pos, vel);
    float h2 = dot(h, h);

    // accumulation
    vec3 col = vec3(0.0);
    float alpha = 0.0;       // luminance-coupled coverage
    float holeMask = 0.0;    // 1 if captured by horizon (opaque black)
    float prevY = pos.y;     // for equatorial crossing detection
    int crossings = 0;
    float glow = 0.0;        // volumetric atmosphere near the plane

    // ── geodesic integration (leapfrog) ──
    for(int i=0;i<STEPS;i++){
      float r = length(pos);

      // capture / escape
      if(r < RS*1.02){ holeMask = 1.0; break; }
      if(r > R_MAX){
        col += sampleSky(normalize(vel)) * (1.0 - min(alpha,1.0));
        break;
      }

      // adaptive step: smaller near the hole where bending is strong
      float dt = DT_BASE * clamp(r*0.16, 0.45, 1.6);

      // leapfrog half-kick / drift / half-kick
      vec3 acc = -1.5 * h2 * pos / pow(dot(pos,pos), 2.5);
      vec3 velH = vel + acc * (dt*0.5);
      vec3 newPos = pos + velH * dt;
      vec3 acc2 = -1.5 * h2 * newPos / pow(dot(newPos,newPos), 2.5);
      vec3 newVel = velH + acc2 * (dt*0.5);

      // ── equatorial plane crossing (y sign change) → disk sample ──
      if(prevY * newPos.y < 0.0 && crossings < MAX_CROSS){
        float t = prevY / (prevY - newPos.y);          // lerp factor to y=0
        vec3 hit = mix(pos, newPos, t);
        float hr = length(hit);
        if(hr > R_ISCO && hr < R_OUT){
          float phi = atan(hit.z, hit.x);
          float emI;
          vec3 emC = diskEmission(hr, phi, emI);

          // ── relativistic doppler beaming + grav redshift ──
          // tangential (Keplerian) velocity direction at the hit, prograde.
          vec3 radial = normalize(vec3(hit.x, 0.0, hit.z));
          vec3 tang = normalize(cross(vec3(0.0,1.0,0.0), radial)); // orbital dir
          float vmag = clamp(0.5/sqrt(max(hr,1.0)), 0.0, 0.6);     // ~Keplerian
          vec3 beta = tang*vmag;
          // photon dir at crossing (use velH, the local ray direction)
          vec3 pdir = normalize(velH);
          // doppler factor: approaching (beta·-pdir>0) brightens
          float mu = dot(beta, -pdir);
          float doppler = 1.0 / (1.0 - mu);             // > 1 approaching
          float beam = pow(clamp(doppler,0.2,3.0), BEAM_GAIN);
          // gravitational redshift dimming as r→rs
          float gz = pow(clamp(1.0 - RS/hr, 0.0, 1.0), REDSHIFT);
          // approaching side whitens & cools toward HOT; receding deepens copper
          vec3 dc = mix(mix(emC, COPPER, 0.35), mix(emC, HOT, 0.5),
                        smoothstep(-0.15, 0.15, mu));

          float w = (1.0 - min(alpha,1.0));
          float contrib = emI * beam * gz;
          col += dc * contrib * w * 1.7;
          alpha += contrib * w * 0.5;
          crossings++;
        }
      }

      // ── cheap volumetric glow: emission when the ray skims the disk plane,
      // even between crossings, gives the disk atmosphere (not paper-thin) ──
      {
        float hy = abs(newPos.y);
        float rr = length(vec2(newPos.x, newPos.z));
        if(rr > R_ISCO*0.9 && rr < R_OUT*1.15){
          float planeNear = exp(-hy*hy*3.2);
          float radFall = (1.0 - smoothstep(R_ISCO, R_OUT*1.1, rr));
          glow += planeNear * radFall * dt * 0.10;
        }
      }

      prevY = newPos.y;
      pos = newPos;
      vel = newVel;
    }

    // fold the volumetric atmosphere in (warm, behind the disk emission)
    glow = clamp(glow, 0.0, 1.2);
    col += mix(WARM, COPPER, 0.4) * glow * (1.0 - min(alpha,1.0)) * 0.9;
    alpha += glow * 0.35;

    // intro exposure ramp (true fade-from-black), then carry to composite
    col *= uIntro;
    alpha = clamp(alpha, 0.0, 1.0);

    // store: rgb = linear scene radiance, a = coverage; horizon flagged via a<0 trick:
    // we instead pack holeMask into alpha sign by clamping — composite reads holeMask
    // from a dedicated channel below. Simpler: bias alpha negative-free, encode hole in
    // a tiny reserved range. We output hole as alpha=1 + pure black.
    if(holeMask>0.5){
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);  // opaque black shadow
    } else {
      gl_FragColor = vec4(col, alpha);
    }
  }
`;

// ───────────────────── PASS 2 : full-res composite / grade ─────────────────────
const fragComposite = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uScene;     // half-res raymarch result (premultiplied? no — straight)
  uniform vec2  uResolution;    // full-res
  uniform vec2  uCenter;
  uniform float uScale;
  uniform float uZoom;
  uniform float uTime;
  uniform float uIntro;

  const vec3 TOE = vec3(0.0196, 0.0275, 0.051);

  vec3 acesFilmic(vec3 x){
    const float a=2.51,b=0.03,c=2.43,d=0.59,e=0.14;
    return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
  }
  float hash31(vec3 p){
    p=fract(p*vec3(0.1031,0.1030,0.0973));
    p+=dot(p,p.yzx+33.33);
    return fract((p.x+p.y)*p.z);
  }

  void main(){
    vec2 res = uResolution;
    float aspect = res.x/res.y;
    vec2 ndc = (vUv*2.0-1.0); ndc.x*=aspect;
    float zoom = uScale * (1.0 - uZoom*0.22);
    vec2 p = (ndc - uCenter)/max(zoom,0.0001);
    float r = length(p);

    // bilinear upscale of the scene (linear filtering on the RT does the smoothing)
    vec4 sc = texture2D(uScene, vUv);
    vec3 col = sc.rgb;
    float a = sc.a;
    // hole shadow arrives as opaque black (a==1, rgb==0); detect to protect it
    float holeMask = step(0.999, a) * (1.0 - step(0.001, max(col.r,max(col.g,col.b))));

    // edge-energy proxy for CA: local luminance gradient (cheap 4-tap)
    vec2 px = 1.0/res;
    float l0 = dot(col, vec3(0.299,0.587,0.114));
    float lx = dot(texture2D(uScene, vUv+vec2(px.x,0.0)).rgb, vec3(0.299,0.587,0.114));
    float ly = dot(texture2D(uScene, vUv+vec2(0.0,px.y)).rgb, vec3(0.299,0.587,0.114));
    float edge = clamp((abs(lx-l0)+abs(ly-l0))*3.0, 0.0, 1.0);

    // edge-aware chromatic aberration: radial RGB split scaled by edge + radius
    {
      float caAmt = pow(edge, 1.25) * mix(0.5,1.0, smoothstep(0.0,0.6,r));
      vec2 dir = normalize(p + 1e-4);
      float k = caAmt * 0.0035;
      float cr = texture2D(uScene, vUv + dir*k).r;
      float cb = texture2D(uScene, vUv - dir*k).b;
      col.r = mix(col.r, cr, edge);
      col.b = mix(col.b, cb, edge);
      col = max(col, vec3(0.0));
    }

    // exposure + ACES
    col *= 1.05;
    col = acesFilmic(col);

    float sceneLum = max(col.r, max(col.g, col.b));

    // lifted toe near the system only (don't flood empty page space)
    float shadowW = 1.0 - smoothstep(0.0, 0.10, sceneLum);
    float nearSys = smoothstep(8.0, 1.0, r);
    col = mix(col, max(col, TOE), shadowW*nearSys*uIntro);

    // gentle saturation rebuild
    float luma = dot(col, vec3(0.299,0.587,0.114));
    col = mix(vec3(luma), col, 1.18);

    // hole-anchored vignette
    {
      float vd = r/9.0;
      col *= 1.0 - 0.6*smoothstep(0.55,1.25, vd);
    }

    // full-res film grain (crisp because it's post-upscale)
    {
      float g = hash31(vec3(gl_FragCoord.xy, floor(uTime*24.0))) - 0.5;
      float lg = dot(col, vec3(0.299,0.587,0.114));
      float gw = mix(1.6, 0.35, smoothstep(0.0,0.7,lg));
      col += g * 0.015 * gw * uIntro;
      col = max(col, vec3(0.0));
    }

    // premultiplied output; only the horizon is opaque
    float outA = clamp(sceneLum*1.15, 0.0, 1.0);
    outA = max(outA, holeMask*uIntro);
    col *= (1.0 - holeMask);  // horizon stays true black
    gl_FragColor = vec4(col*outA, outA);
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

        const dpr = Math.min(window.devicePixelRatio, 2);
        const renderer = new Renderer({ depth: false, alpha: true, dpr });
        const gl = renderer.gl;
        container.appendChild(gl.canvas);
        gl.clearColor(0, 0, 0, 0);

        const fallback = container.parentElement?.querySelector<HTMLElement>("[data-galaxy-fallback]") ?? null;
        if (fallback) fallback.style.opacity = "0";

        const camera = new Camera(gl);
        const geometry = new Triangle(gl);

        // half-res RenderTarget for the heavy geodesic pass (linear filter → free upscale)
        const target = new RenderTarget(gl, {
            width: 2, height: 2,
            depth: false,
            magFilter: gl.LINEAR, minFilter: gl.LINEAR,
        });

        const center: [number, number] = [0, 0];

        const geoProgram = new Program(gl, {
            vertex, fragment: fragGeo,
            transparent: true, depthTest: false, depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: [1, 1] },
                uCenter: { value: center },
                uZoom: { value: 0 },
                uScale: { value: 1 },
                uTilt: { value: [0, 0] },
                uIntro: { value: 0 },
            },
        });
        const geoMesh = new Mesh(gl, { geometry, program: geoProgram });

        const compProgram = new Program(gl, {
            vertex, fragment: fragComposite,
            transparent: true, depthTest: false, depthWrite: false,
            uniforms: {
                uScene: { value: target.texture },
                uResolution: { value: [1, 1] },
                uCenter: { value: center },
                uScale: { value: 1 },
                uZoom: { value: 0 },
                uTime: { value: 0 },
                uIntro: { value: 0 },
            },
        });
        const compMesh = new Mesh(gl, { geometry, program: compProgram });

        const RT_SCALE = 0.5; // half-resolution raymarch
        const resize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            const w = gl.canvas.width, h = gl.canvas.height;
            const aspect = w / h;
            const hw = Math.max(2, Math.floor(w * RT_SCALE));
            const hh = Math.max(2, Math.floor(h * RT_SCALE));
            target.setSize(hw, hh);
            geoProgram.uniforms.uResolution.value = [hw, hh];
            compProgram.uniforms.uResolution.value = [w, h];
            center[0] = aspect > 1 ? 0.72 : 0;
            center[1] = aspect > 1 ? 0.04 : 0.78;
            const sc = aspect > 1 ? 1 : 0.62;
            geoProgram.uniforms.uScale.value = sc;
            compProgram.uniforms.uScale.value = sc;
        };
        window.addEventListener("resize", resize, false);
        resize();

        const PARALLAX = 0.035;
        const mouse = { x: 0, y: 0 };
        const targetM = { x: 0, y: 0 };
        const onMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            targetM.x = (((e.clientX - rect.left) / rect.width) * 2 - 1) * PARALLAX;
            targetM.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1) * PARALLAX;
        };
        container.addEventListener("mousemove", onMouseMove);

        let scrollT = 0;
        const onScroll = () => { scrollT = Math.min(1, window.scrollY / window.innerHeight); };
        window.addEventListener("scroll", onScroll, { passive: true });

        let visible = true;
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
        io.observe(container);

        const INTRO_DUR = 2.5;
        let introElapsed = 0;
        const easeOutQuint = (x: number) => 1 - Math.pow(1 - x, 5);
        const smoothstep01 = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

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

            mouse.x += (targetM.x - mouse.x) * 0.05;
            mouse.y += (targetM.y - mouse.y) * 0.05;
            const diveTarget = smoothstep01(scrollT);
            zoom += (diveTarget - zoom) * 0.06;

            geoProgram.uniforms.uTime.value = elapsed;
            geoProgram.uniforms.uTilt.value = [mouse.x, mouse.y];
            geoProgram.uniforms.uZoom.value = zoom;
            geoProgram.uniforms.uIntro.value = intro;

            compProgram.uniforms.uTime.value = elapsed;
            compProgram.uniforms.uZoom.value = zoom;
            compProgram.uniforms.uIntro.value = intro;

            // pass 1 → half-res target
            renderer.render({ scene: geoMesh, camera, target });
            // pass 2 → screen
            renderer.render({ scene: compMesh, camera });
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
