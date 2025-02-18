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
  
  varying vec2 vRandom;
  varying float vTwinkle;
  
  void main() {
    vRandom = random;
    vec3 pos = position;
    
    float speedMultiplier = mix(1.5, 0.5, random.y);
    
    // Añadir movimiento ondulatorio en X
    pos.x += sin(uTime * random.x + pos.y) * 0.2;
    
    pos.y = mod(pos.y + uTime * (0.5 + random.x * 0.5) * speedMultiplier, 20.0) - 10.0;
    
    vTwinkle = sin(uTime * (2.0 + random.x * 3.0)) * 0.5 + 0.5;
    
    // Tamaño variable de las estrellas
    gl_PointSize = mix(2.0, 6.0, random.y) * (1.0 + vTwinkle * 0.5);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vRandom;
  varying float vTwinkle;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - 0.5);
    
    if(d > 0.5) discard;
    
    // Crear colores para las estrellas
    vec3 color1 = vec3(0.95, 0.95, 1.0);    // Blanco azulado
    vec3 color2 = vec3(1.0, 0.85, 0.7);     // Amarillo cálido
    vec3 color3 = vec3(0.85, 0.9, 1.0);     // Azul claro
    
    vec3 finalColor = mix(
      mix(color1, color2, vRandom.x),
      color3,
      vRandom.y
    );
    
    float alpha = smoothstep(0.5, 0.0, d);
    alpha *= mix(0.3, 1.0, vTwinkle);
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
                uTime: { value: 0 }
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

        // Loop de animación
        let animationFrame: number;
        const animate = (t: number) => {
            animationFrame = requestAnimationFrame(animate);
            program.uniforms.uTime.value = t * 0.001 * speed;
            renderer.render({ scene: stars, camera });
        };

        animationFrame = requestAnimationFrame(animate);

        // Cleanup
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
            // renderer.dispose();
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