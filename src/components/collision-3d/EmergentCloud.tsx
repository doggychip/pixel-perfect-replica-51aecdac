import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

interface EmergentParticle {
  dir: THREE.Vector3;
  speed: number;
  spiralPhase: number;
  size: number;
  isStar: boolean; // star-shaped = pulsing glow
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
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorA = useMemo(() => new THREE.Color(DOMAIN_COLORS[theoryA.domain as DomainKey] ?? "#3b82f6"), [theoryA]);
  const colorB = useMemo(() => new THREE.Color(DOMAIN_COLORS[theoryB.domain as DomainKey] ?? "#ef4444"), [theoryB]);
  const blendedColor = useMemo(() => new THREE.Color().copy(colorA).lerp(colorB, 0.5), [colorA, colorB]);

  const COUNT = 250;
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 2;
      const isStar = Math.random() < 0.15;
      return {
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi)
        ),
        speed: 0.3 + Math.random() * 0.8,
        spiralPhase: Math.random() * Math.PI * 2,
        size: isStar ? 0.025 + Math.random() * 0.02 : 0.008 + Math.random() * 0.012,
        isStar,
      } as EmergentParticle;
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const appearFade = Math.min(progress * 2, 1);

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      // Spiral outward from center
      const spiralAngle = t * p.speed + p.spiralPhase;
      const expandR = progress * 1.5 * p.speed;
      const x = center.x + p.dir.x * expandR + Math.cos(spiralAngle) * 0.15;
      const y = center.y + p.dir.y * expandR + Math.sin(spiralAngle * 0.7) * 0.1;
      const z = center.z + p.dir.z * expandR + Math.sin(spiralAngle) * 0.15;

      dummy.position.set(x, y, z);

      // Star-shaped particles pulse
      let scale = p.size * appearFade;
      if (p.isStar) {
        scale *= 1 + Math.sin(t * 6 + i) * 0.4;
      }
      dummy.scale.setScalar(Math.max(0.001, scale));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Blended color with shimmer
      tempColor.copy(blendedColor);
      if (p.isStar) {
        tempColor.lerp(new THREE.Color("#ffffff"), 0.3 + Math.sin(t * 8 + i) * 0.2);
      }
      const hueShift = Math.sin(t * 2 + i * 0.1) * 0.05;
      tempColor.r = Math.min(1, tempColor.r + hueShift);
      tempColor.b = Math.min(1, tempColor.b + hueShift);
      meshRef.current.setColorAt(i, tempColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {/* Emergent theory label */}
      {progress > 0.3 && (
        <Html position={[center.x, center.y - 2.5, center.z]} center>
          <div className="text-center pointer-events-none select-none animate-pulse">
            <div
              className="text-sm font-bold px-4 py-2 rounded-lg bg-black/80 border border-white/20 backdrop-blur-sm"
              style={{
                color: `#${blendedColor.getHexString()}`,
                textShadow: `0 0 15px #${blendedColor.getHexString()}80`,
                boxShadow: `0 0 20px #${blendedColor.getHexString()}20`,
              }}
            >
              ✨ Emergent: {emergentName || "New Framework"}
            </div>
            <div className="text-[9px] text-white/30 mt-1 font-mono">
              {COUNT} hybrid particles · blended spectrum
            </div>
          </div>
        </Html>
      )}

      {/* Glowing core for emergent cluster */}
      <mesh position={center}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial
          color={blendedColor}
          transparent
          opacity={Math.min(progress, 0.7)}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
