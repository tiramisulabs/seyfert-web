'use client';

import React, { useEffect, useRef } from "react";
import { Renderer, Camera, Geometry, Program, Mesh } from "ogl";
import { cn } from '@/lib/utils';

interface StarryBackgroundProps {
    className?: string;
    starCount?: number;
    speed?: number;
}

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 random;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uPulse;
  uniform float uColorShift;
  uniform float uWave;
  
  varying vec2 vRandom;
  varying float vTwinkle;
  varying float vTrail;
  varying float vFade;
  
  void main() {
    vRandom = random;
    vec3 pos = position;
    
    float depth = (pos.z + 10.0) / 20.0;
    float parallaxStrength = mix(0.5, 2.0, depth);
    float speedMultiplier = mix(1.5, 0.5, random.y);
    
    vFade = min(1.0, uTime * 1.5 - random.x * 2.0);
    
    if (random.x > 0.8) {
      float orbit = uTime * (0.2 + random.y * 0.3);
      pos.x += sin(orbit) * 3.0 * random.x;
      pos.z += cos(orbit) * 2.0 * random.y;
    }
    
    float wave = sin(uTime * 0.5 + pos.x * 0.2 + pos.z * 0.2) * uWave;
    pos.y += wave * random.y;
    
    float rotation = uTime * 0.05;
    mat2 rot = mat2(
      cos(rotation), -sin(rotation),
      sin(rotation), cos(rotation)
    );
    pos.xz = rot * pos.xz;
    
    pos.x += sin(uTime * random.x + pos.y) * 0.2 * parallaxStrength;
    pos.z += cos(uTime * random.y + pos.x) * 0.1 * parallaxStrength;
    
    pos.y = mod(pos.y + uTime * (0.5 + random.x * 0.5) * speedMultiplier, 20.0) - 10.0;
    
    vTwinkle = (sin(uTime * (2.0 + random.x * 3.0)) * 0.5 + 0.5) * uPulse;
    
    vTrail = random.y > 0.8 ? 1.0 : 0.0;
    
    float size = mix(2.0, 8.0, random.y) * (1.0 + vTwinkle * 0.5);
    gl_PointSize = size * mix(0.5, 1.5, depth);
    
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vRandom;
  varying float vTwinkle;
  varying float vTrail;
  varying float vFade;
  uniform float uColorShift;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - 0.5);
    
    if(d > 0.5) discard;
    
    vec3 color1 = vec3(0.95, 0.95 - uColorShift * 0.1, 1.0);
    vec3 color2 = vec3(1.0, 0.85 + uColorShift * 0.15, 0.7 + uColorShift * 0.2);
    vec3 color3 = vec3(0.85, 0.9 + uColorShift * 0.1, 1.0);
    vec3 color4 = vec3(0.9, 0.7 + uColorShift * 0.2, 1.0 - uColorShift * 0.1);
    vec3 color5 = vec3(0.7 + uColorShift * 0.1, 0.9, 1.0);
    
    vec3 finalColor = mix(
      mix(
        mix(color1, color2, vRandom.x),
        mix(color4, color5, vRandom.y),
        vRandom.x
      ),
      color3,
      vRandom.y
    );
    
    float alpha = smoothstep(0.5, 0.0, d);
    alpha *= mix(0.3, 1.0, vTwinkle);
    alpha *= vFade;
    
    if (vTrail > 0.0) {
      alpha *= 1.2;
      finalColor += vec3(0.2) * (1.0 - d);
    }
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export function StarryBackground({
    className,
    starCount = 400,
    speed = 1.0
}: StarryBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const renderer = new Renderer({
            alpha: true,
            depth: false,
            dpr: Math.min(window.devicePixelRatio, 2)
        });
        const gl = renderer.gl;
        container.appendChild(gl.canvas);
        gl.clearColor(0, 0, 0, 0);

        const camera = new Camera(gl);
        camera.position.z = 15;

        const positions = new Float32Array(starCount * 3);
        const randoms = new Float32Array(starCount * 2);

        for (let i = 0; i < starCount; i++) {
            positions.set([
                (Math.random() - 0.5) * 20,  // x
                (Math.random() - 0.5) * 20,  // y
                (Math.random() - 0.5) * 20   // z
            ], i * 3);

            randoms.set([
                Math.random(),  // velocity
                Math.random()   // size
            ], i * 2);
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: positions },
            random: { size: 2, data: randoms }
        });

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                uTime: { value: 0 },
                uPulse: { value: 1.0 },
                uColorShift: { value: 0.0 },
                uWave: { value: 0.0 }
            },
            transparent: true,
            depthTest: false,
        });

        const stars = new Mesh(gl, {
            mode: gl.POINTS,
            geometry,
            program
        });

        const resize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.perspective({
                aspect: gl.canvas.width / gl.canvas.height
            });
        };
        window.addEventListener('resize', resize);
        resize();

        let animationFrame: number;
        const animate = (t: number) => {
            animationFrame = requestAnimationFrame(animate);
            const time = t * 0.001 * speed;
            program.uniforms.uTime.value = time;

            program.uniforms.uColorShift.value = Math.sin(time * 0.1) * 0.5 + 0.5;
            program.uniforms.uPulse.value = 0.8 + Math.sin(time * 0.2) * 0.2;

            program.uniforms.uWave.value = Math.sin(time * 0.3) * 0.5;

            camera.position.x = Math.sin(time * 0.1) * 2;
            camera.position.z = 15 + Math.cos(time * 0.1) * 2;
            camera.lookAt([0, 0, 0]);

            renderer.render({ scene: stars, camera });
        };

        animationFrame = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
            if (container.contains(gl.canvas)) {
                container.removeChild(gl.canvas);
            }
        };
    }, [starCount, speed]);

    return (
        <div
            ref={containerRef}
            className={cn("fixed inset-0 -z-10", className)}
        />
    );
}