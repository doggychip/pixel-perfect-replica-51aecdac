import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scoreColor } from "./utils";
import type { PositionedAgent } from "./types";

export default function AgentPillar({ pos, index }: { pos: PositionedAgent; index: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const { x, z, height, score, alive, agent } = pos;
  const color = useMemo(() => scoreColor(score), [score]);
  const budget = agent.budget ?? 100;
  const thickness = Math.max(0.08, Math.min(0.35, budget / 1000));

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.scale.y = 1 + Math.sin(t * 1.5 + index) * 0.04;
    if (glowRef.current) {
      const pulse = alive ? 0.4 + Math.sin(t * 2 + index * 0.7) * 0.25 : 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[thickness, height, thickness]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={alive ? 0.6 : 0.1}
          transparent
          opacity={alive ? 0.9 : 0.35}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={glowRef} position={[0, height + 0.1, 0]}>
        <sphereGeometry args={[thickness * 1.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[thickness * 0.8, thickness * 1.6, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
