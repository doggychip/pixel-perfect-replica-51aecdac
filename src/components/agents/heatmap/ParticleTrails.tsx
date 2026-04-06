import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { PositionedAgent } from "./types";
import { REALM_COLORS } from "./utils";

const PARTICLES_PER_TRAIL = 12;
const MAX_TRAILS = 20;

interface Trail {
  from: number;
  to: number;
  realm: string;
}

/** Generate pseudo-random communication trails between alive agents */
function generateTrails(positions: PositionedAgent[]): Trail[] {
  const alive = positions.map((p, i) => ({ ...p, idx: i })).filter((p) => p.alive);
  if (alive.length < 2) return [];

  const trails: Trail[] = [];

  // Cross-realm trails (task flow between realms)
  const byRealm: Record<string, number[]> = {};
  alive.forEach((a) => {
    const r = a.agent.realm ?? "central";
    if (!byRealm[r]) byRealm[r] = [];
    byRealm[r].push(a.idx);
  });
  const realms = Object.keys(byRealm);
  for (let i = 0; i < realms.length; i++) {
    for (let j = i + 1; j < realms.length; j++) {
      const groupA = byRealm[realms[i]];
      const groupB = byRealm[realms[j]];
      // Connect a few agents across realms
      const count = Math.min(2, groupA.length, groupB.length);
      for (let k = 0; k < count; k++) {
        trails.push({ from: groupA[k], to: groupB[k], realm: realms[i] });
      }
    }
  }

  // Intra-realm trails (communication within realm)
  Object.entries(byRealm).forEach(([realm, indices]) => {
    for (let i = 0; i < Math.min(3, indices.length - 1); i++) {
      trails.push({ from: indices[i], to: indices[i + 1], realm });
    }
  });

  return trails.slice(0, MAX_TRAILS);
}

export default function ParticleTrails({ positions }: { positions: PositionedAgent[] }) {
  const trails = useMemo(() => generateTrails(positions), [positions]);
  const totalParticles = trails.length * PARTICLES_PER_TRAIL;

  const positionsRef = useRef<THREE.BufferAttribute | null>(null);
  const colorsRef = useRef<THREE.BufferAttribute | null>(null);
  const sizesRef = useRef<THREE.BufferAttribute | null>(null);

  const { initPositions, initColors, initSizes } = useMemo(() => {
    const pos = new Float32Array(totalParticles * 3);
    const col = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);

    trails.forEach((trail, ti) => {
      const from = positions[trail.from];
      const to = positions[trail.to];
      const color = new THREE.Color(REALM_COLORS[trail.realm] ?? "#22d3ee");

      for (let pi = 0; pi < PARTICLES_PER_TRAIL; pi++) {
        const idx = ti * PARTICLES_PER_TRAIL + pi;
        const t = pi / PARTICLES_PER_TRAIL;
        pos[idx * 3] = from.x + (to.x - from.x) * t;
        pos[idx * 3 + 1] = from.height * 0.5 + Math.sin(t * Math.PI) * 1.5;
        pos[idx * 3 + 2] = from.z + (to.z - from.z) * t;

        col[idx * 3] = color.r;
        col[idx * 3 + 1] = color.g;
        col[idx * 3 + 2] = color.b;

        sizes[idx] = 0.06 + Math.sin(t * Math.PI) * 0.04;
      }
    });

    return { initPositions: pos, initColors: col, initSizes: sizes };
  }, [trails, positions, totalParticles]);

  useFrame(({ clock }) => {
    if (!positionsRef.current || totalParticles === 0) return;
    const t = clock.getElapsedTime();
    const posArray = positionsRef.current.array as Float32Array;
    const sizeArray = sizesRef.current!.array as Float32Array;

    trails.forEach((trail, ti) => {
      const from = positions[trail.from];
      const to = positions[trail.to];

      for (let pi = 0; pi < PARTICLES_PER_TRAIL; pi++) {
        const idx = ti * PARTICLES_PER_TRAIL + pi;
        // Animate particles flowing along the arc
        const phase = ((pi / PARTICLES_PER_TRAIL) + t * 0.3) % 1;
        const arcHeight = Math.sin(phase * Math.PI) * 1.8;

        posArray[idx * 3] = from.x + (to.x - from.x) * phase;
        posArray[idx * 3 + 1] = Math.max(from.height, to.height) * 0.3 + arcHeight;
        posArray[idx * 3 + 2] = from.z + (to.z - from.z) * phase;

        // Pulse size
        sizeArray[idx] = 0.04 + Math.sin(t * 3 + pi * 0.5) * 0.03;
      }
    });

    positionsRef.current.needsUpdate = true;
    sizesRef.current!.needsUpdate = true;
  });

  if (totalParticles === 0) return null;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          ref={positionsRef}
          attach="attributes-position"
          count={totalParticles}
          array={initPositions}
          itemSize={3}
        />
        <bufferAttribute
          ref={colorsRef}
          attach="attributes-color"
          count={totalParticles}
          array={initColors}
          itemSize={3}
        />
        <bufferAttribute
          ref={sizesRef}
          attach="attributes-size"
          count={totalParticles}
          array={initSizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
