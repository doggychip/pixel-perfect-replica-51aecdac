import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";
import { getGlowTexture } from "./glowTexture";

// Emergent palette: electric blue, warm amber, white-hot, plus parent remnants
const EMERGENT_COLORS = [
  "#3366ff", "#ffaa00", "#ffffff", "#00ffff", "#ff00ff",
  "#66ccff", "#ffcc33", "#ff66cc", "#33ffaa",
];

interface EPData {
  dir: THREE.Vector3;
  speed: number;
  size: number;
  brightness: number;
  colorIdx: number;
  brownianSeed: number;
  pulseSpeed: number;
  pulsePhase: number;
  flashTimer: number; // when this particle "flashes"
}

export default function EmergentCloud({
  theoryA,
  theoryB,
  progress,
  center,
  emergentName,
}: {
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  progress: number;
  center: THREE.Vector3;
  emergentName?: string;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  // 20% fewer than combined parent count
  const parentCount = Math.min(300, 140 + theoryA.factors.length * 30) +
                      Math.min(300, 140 + theoryB.factors.length * 30);
  const COUNT = Math.floor(parentCount * 0.8);

  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const tier = Math.random();
      const size = tier < 0.5 ? 0.04 + Math.random() * 0.04
                 : tier < 0.85 ? 0.1 + Math.random() * 0.08
                 : 0.2 + Math.random() * 0.15;
      return {
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ),
        speed: 0.4 + Math.random() * 1.2,
        size,
        brightness: 0.6 + Math.random() * 0.4,
        colorIdx: Math.floor(Math.random() * EMERGENT_COLORS.length),
        brownianSeed: Math.random() * 1000,
        pulseSpeed: 1.2 + Math.random() * 2.0,
        pulsePhase: Math.random() * Math.PI * 2,
        flashTimer: 3 + Math.random() * 8, // flash every N seconds
      } as EPData;
    });
  }, [COUNT]);

  const { positions, colors, sizes, brightness } = useMemo(() => ({
    positions: new Float32Array(COUNT * 3),
    colors: new Float32Array(COUNT * 3),
    sizes: new Float32Array(COUNT),
    brightness: new Float32Array(COUNT),
  }), [COUNT]);

  const glowTex = useMemo(() => getGlowTexture(), []);

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
    const appearFade = Math.min(progress * 2.5, 1);

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const i3 = i * 3;

      // Energetic Brownian motion (faster than idle)
      const bx = Math.sin(t * 0.6 + p.brownianSeed) * 0.25 + Math.sin(t * 1.2 + p.brownianSeed * 2) * 0.12;
      const by = Math.cos(t * 0.5 + p.brownianSeed * 1.3) * 0.2 + Math.sin(t * 0.9 + p.brownianSeed * 3) * 0.1;
      const bz = Math.sin(t * 0.7 + p.brownianSeed * 0.7) * 0.18 + Math.cos(t * 1.1 + p.brownianSeed * 1.7) * 0.1;

      const expandR = progress * 1.8 * p.speed;
      const x = center.x + p.dir.x * expandR + bx;
      const y = center.y + p.dir.y * expandR + by;
      const z = center.z + p.dir.z * expandR + bz;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Pulsing with occasional flashes
      let scale = p.size * appearFade * (0.8 + 0.4 * Math.sin(t * p.pulseSpeed + p.pulsePhase));

      // Interaction flash
      const flashCycle = t % p.flashTimer;
      const isFlashing = flashCycle < 0.15;
      let bright = p.brightness;
      if (isFlashing) {
        scale *= 1.8;
        bright = 1.0;
      }

      sizes[i] = Math.max(0.001, scale);
      brightness[i] = bright;

      const c = new THREE.Color(EMERGENT_COLORS[p.colorIdx]);
      if (isFlashing) c.lerp(new THREE.Color("#ffffff"), 0.7);
      colors[i3] = c.r;
      colors[i3 + 1] = c.g;
      colors[i3 + 2] = c.b;
    }

    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aBrightness.needsUpdate = true;
  });

  const brightnessInit = useMemo(() => {
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
          <bufferAttribute attach="attributes-aBrightness" args={[brightnessInit, 1]} count={COUNT} />
        </bufferGeometry>
      </points>

      {progress > 0.3 && (
        <Html position={[center.x, center.y - 2.8, center.z]} center>
          <div className="text-center pointer-events-none select-none animate-pulse">
            <div
              className="text-sm font-bold px-4 py-2 rounded-lg bg-black/80 border border-white/20 backdrop-blur-sm"
              style={{
                color: "#ffaa00",
                textShadow: "0 0 15px #ffaa0080",
                boxShadow: "0 0 20px #ffaa0020",
              }}
            >
              ✨ EMERGENT THEORY: {emergentName || "New Framework"}
            </div>
            <div className="text-[9px] text-white/30 mt-1 font-mono">
              {COUNT} particles · collision energy
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
