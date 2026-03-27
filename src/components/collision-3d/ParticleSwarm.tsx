import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";
import { getGlowTexture } from "./glowTexture";

type Phase = "idle" | "windup" | "beam" | "collide" | "explosion" | "reform" | "emerge";

// Theory A: cyan + lime   Theory B: magenta + pink
const COLORS_A = ["#00ffff", "#66ff00", "#00ffcc", "#33ff66"];
const COLORS_B = ["#ff00ff", "#ff66cc", "#ff33aa", "#cc00ff"];

interface PData {
  basePos: THREE.Vector3;
  vel: THREE.Vector3;
  size: number;       // world units
  brightness: number; // 0.6–1.0
  colorIdx: number;
  pulseSpeed: number;
  pulsePhase: number;
  brownianSeed: number;
}

function buildParticles(count: number): PData[] {
  const pts: PData[] = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 0.4 + Math.random() * 1.6;
    // Size tiers: small 60%, medium 30%, large 10%
    const tier = Math.random();
    const size = tier < 0.6 ? 0.04 + Math.random() * 0.04
               : tier < 0.9 ? 0.1 + Math.random() * 0.06
               : 0.2 + Math.random() * 0.12;
    pts.push({
      basePos: new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * r,
        Math.sin(phi) * Math.sin(theta) * r,
        Math.cos(phi) * r
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ),
      size,
      brightness: 0.6 + Math.random() * 0.4,
      colorIdx: Math.floor(Math.random() * 4),
      pulseSpeed: 0.8 + Math.random() * 1.5,
      pulsePhase: Math.random() * Math.PI * 2,
      brownianSeed: Math.random() * 1000,
    });
  }
  return pts;
}

export default function ParticleSwarm({
  theory,
  side,
  phase,
  phaseProgress,
  collisionPoint,
}: {
  theory: CollisionTheory;
  side: "left" | "right";
  phase: Phase;
  phaseProgress: number;
  collisionPoint: THREE.Vector3;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const palette = side === "left" ? COLORS_A : COLORS_B;

  const nodePos = useMemo(
    () => new THREE.Vector3(side === "left" ? -3.1 : 3.1, 0, 0),
    [side]
  );

  const COUNT = Math.min(300, 140 + theory.factors.length * 30);

  const particles = useMemo(() => buildParticles(COUNT), [COUNT]);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    return { positions: pos, colors: col, sizes: sz };
  }, [COUNT]);

  const glowTex = useMemo(() => getGlowTexture(), []);

  // Custom shader material for soft glow particles
  const shaderMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: glowTex },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aBrightness;
        varying vec3 vColor;
        varying float vBrightness;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vBrightness = aBrightness;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 1.0, 128.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        varying float vBrightness;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          float alpha = tex.r * vBrightness;
          // Bright white center, colored outer glow
          vec3 finalColor = mix(vColor, vec3(1.0), tex.r * tex.r);
          gl_FragColor = vec4(finalColor * vBrightness, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
  }, [glowTex]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const t = clock.getElapsedTime();

    // Breathing: cloud expands/contracts over ~3.5s
    const breathe = 1 + Math.sin(t * 1.8) * 0.05;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const i3 = i * 3;

      // Brownian drift
      const bx = Math.sin(t * 0.3 + p.brownianSeed) * 0.15 + Math.sin(t * 0.7 + p.brownianSeed * 2) * 0.08;
      const by = Math.cos(t * 0.25 + p.brownianSeed * 1.3) * 0.12 + Math.sin(t * 0.5 + p.brownianSeed * 3) * 0.06;
      const bz = Math.sin(t * 0.35 + p.brownianSeed * 0.7) * 0.1 + Math.cos(t * 0.6 + p.brownianSeed * 1.7) * 0.07;

      let x = nodePos.x + p.basePos.x * breathe + bx;
      let y = nodePos.y + p.basePos.y * breathe + by;
      let z = nodePos.z + p.basePos.z * breathe + bz;

      // Pulsing scale
      let scale = p.size * (0.8 + 0.4 * Math.sin(t * p.pulseSpeed + p.pulsePhase));

      if (phase === "windup") {
        // Compress cloud toward center by 50%
        const compress = 1 - phaseProgress * 0.5;
        x = nodePos.x + (x - nodePos.x) * compress;
        y = nodePos.y + (y - nodePos.y) * compress;
        z = nodePos.z + (z - nodePos.z) * compress;
        // Speed up pulse
        scale *= 1 + phaseProgress * 0.3;
      } else if (phase === "beam") {
        const beamT = Math.min(phaseProgress * 1.4, 1);
        const delay = (i / COUNT) * 0.5;
        const indT = Math.max(0, Math.min(1, (beamT - delay) / Math.max(0.15, 1 - delay)));

        if (indT > 0) {
          // Spiral curve toward center
          const spiralAngle = indT * Math.PI * 2.5 * (side === "left" ? 1 : -1);
          const spiralR = (1 - indT) * 0.4;
          const targetX = collisionPoint.x + Math.cos(spiralAngle) * spiralR;
          const targetY = collisionPoint.y + Math.sin(spiralAngle) * spiralR;
          const targetZ = collisionPoint.z;

          x = x + (targetX - x) * indT;
          y = y + (targetY - y) * indT;
          z = z + (targetZ - z) * indT;

          // Stretch particles along beam
          scale *= 1 + indT * 0.5;
        }
      } else if (phase === "collide") {
        // Spiral inward vortex
        const eased = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
        const dx = x - collisionPoint.x;
        const dy = y - collisionPoint.y;
        const dz = z - collisionPoint.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const angle = Math.atan2(dz, dx);
        const spiralAngle = angle + eased * Math.PI * 4 + i * 0.02;
        const shrinkR = dist * (1 - eased);
        x = collisionPoint.x + Math.cos(spiralAngle) * shrinkR;
        y = collisionPoint.y + dy * (1 - eased);
        z = collisionPoint.z + Math.sin(spiralAngle) * shrinkR;
        scale *= 1 + phaseProgress * 0.5;
      } else if (phase === "explosion") {
        // Scatter outward from center
        const theta2 = p.brownianSeed * Math.PI * 2;
        const phi2 = Math.acos(2 * (p.brownianSeed * 7 % 1) - 1);
        const speed = 2 + p.size * 10;
        const decel = phaseProgress < 0.3 ? phaseProgress / 0.3 : 1 - (phaseProgress - 0.3) * 0.5;
        const r = speed * phaseProgress * decel;
        x = collisionPoint.x + Math.sin(phi2) * Math.cos(theta2) * r;
        y = collisionPoint.y + Math.sin(phi2) * Math.sin(theta2) * r;
        z = collisionPoint.z + Math.cos(phi2) * r;
        scale *= Math.max(0.3, 1 - phaseProgress * 0.4);
      } else if (phase === "reform") {
        // Regroup to center as new cloud
        const theta2 = p.brownianSeed * Math.PI * 2;
        const phi2 = Math.acos(2 * (p.brownianSeed * 7 % 1) - 1);
        const speed = 2 + p.size * 10;
        // Start from scattered position, converge to tight cloud
        const scatterR = speed * 0.7 * (1 - phaseProgress);
        const targetR = 0.3 + Math.random() * 0.8;
        const finalR = scatterR + targetR * phaseProgress;
        x = collisionPoint.x + Math.sin(phi2) * Math.cos(theta2) * finalR;
        y = collisionPoint.y + Math.sin(phi2) * Math.sin(theta2) * finalR;
        z = collisionPoint.z + Math.cos(phi2) * finalR;
      } else if (phase === "emerge") {
        const fadeOut = Math.min(phaseProgress * 2, 1);
        scale *= 1 - fadeOut;
      }

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Colors from palette
      const c = new THREE.Color(palette[p.colorIdx]);

      // During reform, shift colors toward emergent palette
      if (phase === "reform") {
        const emergentColors = ["#3366ff", "#ffaa00", "#ffffff"];
        const target = new THREE.Color(emergentColors[i % 3]);
        c.lerp(target, phaseProgress);
      }

      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;

      sizes[i] = Math.max(0.001, scale);
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;

    // Update brightness attribute
    const brightnessAttr = geo.attributes.aBrightness as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      brightnessAttr.setX(i, particles[i].brightness);
    }
    brightnessAttr.needsUpdate = true;
  });

  const showLabel = phase === "idle";

  // Build brightness array
  const brightnessArr = useMemo(() => {
    const arr = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) arr[i] = particles[i].brightness;
    return arr;
  }, [particles, COUNT]);

  return (
    <group>
      <points ref={pointsRef} material={shaderMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} count={COUNT} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} count={COUNT} />
          <bufferAttribute attach="attributes-aBrightness" args={[brightnessArr, 1]} count={COUNT} />
        </bufferGeometry>
      </points>

      {showLabel && (
        <Html position={[nodePos.x, nodePos.y - 2.2, nodePos.z]} center>
          <div className="text-center pointer-events-none select-none">
            <div
              className="text-sm font-bold px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 backdrop-blur-sm"
              style={{
                color: palette[0],
                textShadow: `0 0 10px ${palette[0]}60`,
              }}
            >
              {theory.name}
            </div>
            <div className="text-[10px] text-white/45 mt-1 font-mono">
              {COUNT} particles · {theory.factors.length} factors
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
