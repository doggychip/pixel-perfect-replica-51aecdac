import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Spark Burst ────────────────────────────────────────────
export function SparkBurst({ progress, center }: { progress: number; center: THREE.Vector3 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 200;

  const sparks = useMemo(() => {
    return Array.from({ length: COUNT }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.5 + Math.random() * 4;
      return {
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ),
        color: new THREE.Color().setHSL(
          Math.random() < 0.5 ? 0.55 + Math.random() * 0.1 : 0.08 + Math.random() * 0.05,
          1,
          0.6 + Math.random() * 0.4
        ),
        size: 0.01 + Math.random() * 0.03,
        decay: 0.5 + Math.random() * 0.5,
      };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < COUNT; i++) {
      const s = sparks[i];
      const life = Math.max(0, 1 - progress * s.decay);
      dummy.position.copy(center).addScaledVector(s.dir, progress * 0.6);
      dummy.scale.setScalar(s.size * life);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, s.color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

// ─── Shockwave Rings ────────────────────────────────────────
export function ShockwaveRings({ progress, center }: { progress: number; center: THREE.Vector3 }) {
  return (
    <group position={center}>
      {[0, 0.12, 0.25, 0.4].map((delay, i) => {
        const p = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
        const scale = p * 6;
        const opacity = Math.max(0, (1 - p) * 0.7);
        const colors = ["#ffffff", "#00fff5", "#ff00ff", "#fbbf24"];
        return (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.4, i * 0.3, i * 0.2]} scale={[scale, scale, scale]}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial
              color={colors[i]}
              transparent
              opacity={opacity}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Central Flash ──────────────────────────────────────────
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
      <meshBasicMaterial color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ─── Energy Ripples (persistent post-collision) ─────────────
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
          <meshBasicMaterial color="#00fff5" transparent opacity={0} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}
