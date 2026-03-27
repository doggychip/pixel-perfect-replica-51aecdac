import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getGlowTexture } from "./glowTexture";

// ─── Impact Flash (bright white expanding sphere) ───────────
export function ImpactFlash({ progress, center }: { progress: number; center: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const scale = 0.1 + progress * 3;
    const opacity = Math.max(0, 1 - progress * 2);
    ref.current.scale.setScalar(scale);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = opacity;
  });

  return (
    <mesh ref={ref} position={center}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={1} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ─── Shockwave Ring ─────────────────────────────────────────
export function ShockwaveRing({ progress, center }: { progress: number; center: THREE.Vector3 }) {
  const scale = progress * 5;
  const opacity = Math.max(0, (1 - progress) * 0.8);

  return (
    <mesh position={center} rotation={[Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
      <ringGeometry args={[0.85, 1, 64]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={opacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ─── Central Flash (during collide phase) ───────────────────
export function CentralFlash({ progress, center }: { progress: number; center: THREE.Vector3 }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const flash = Math.max(0, 1 - progress * 1.5);
    const scale = 0.3 + flash * 1.5 + Math.sin(t * 12) * 0.1 * flash;
    ref.current.scale.setScalar(scale);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = flash * 0.9;
  });

  return (
    <mesh ref={ref} position={center}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
}

// ─── Energy Ripples (post-collision) ────────────────────────
export function EnergyRipples({ center, intensity }: { center: THREE.Vector3; intensity: number }) {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringsRef.current) return;
    const t = clock.getElapsedTime();
    ringsRef.current.children.forEach((child, i) => {
      const ring = child as THREE.Mesh;
      const phase = (t * 0.8 + i * 0.5) % 3;
      const scale = phase * 2;
      const opacity = Math.max(0, (1 - phase / 3) * 0.3 * intensity);
      ring.scale.set(scale, scale, scale);
      (ring.material as THREE.MeshBasicMaterial).opacity = opacity;
    });
  });

  return (
    <group ref={ringsRef} position={center}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1, 64]} />
          <meshBasicMaterial color="#00fff5" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Cosmic Dust (ambient tiny white particles) ─────────────
export function CosmicDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 300;

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = 0.01 + Math.random() * 0.02;
    }
    return { positions: pos, sizes: sz };
  }, []);

  const glowTex = useMemo(() => getGlowTexture(), []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      posAttr.setY(i, posAttr.getY(i) + Math.sin(t * 0.2 + i * 0.1) * 0.0005);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTex}
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
