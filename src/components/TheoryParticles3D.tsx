import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Particle Cloud for a single theory ────────────────────
function ParticleCloud({
  theory,
  color,
  center,
  isColliding,
  phase,
}: {
  theory: CollisionTheory;
  color: string;
  center: [number, number, number];
  isColliding: boolean;
  phase: "idle" | "approach" | "explode" | "merge";
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = theory.factors.length * 12 + 20; // More factors = more particles

  const basePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.2 + Math.random() * 0.6;
      positions.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ]);
    }
    return positions;
  }, [count]);

  const velocities = useMemo(() => {
    return basePositions.map(() => [
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
    ] as [number, number, number]);
  }, [basePositions]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  const timeRef = useRef(0);
  const currentPositions = useRef<[number, number, number][]>(
    basePositions.map(p => [...p])
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    for (let i = 0; i < count; i++) {
      const pos = currentPositions.current[i];
      const base = basePositions[i];
      const vel = velocities[i];

      if (phase === "idle") {
        // Gentle orbit around base position
        pos[0] = base[0] + Math.sin(t * 0.5 + i * 0.3) * 0.15;
        pos[1] = base[1] + Math.cos(t * 0.4 + i * 0.2) * 0.15;
        pos[2] = base[2] + Math.sin(t * 0.3 + i * 0.5) * 0.1;
      } else if (phase === "approach") {
        // Move toward center (0,0,0)
        const targetX = base[0] * 0.3;
        const targetY = base[1] * 0.3;
        const targetZ = base[2] * 0.3;
        pos[0] += (targetX - pos[0]) * 0.03;
        pos[1] += (targetY - pos[1]) * 0.03;
        pos[2] += (targetZ - pos[2]) * 0.03;
      } else if (phase === "explode") {
        // Scatter outward
        pos[0] += vel[0] * 8;
        pos[1] += vel[1] * 8;
        pos[2] += vel[2] * 8;
      } else if (phase === "merge") {
        // Converge to center
        pos[0] *= 0.97;
        pos[1] *= 0.97;
        pos[2] *= 0.97;
        pos[0] += Math.sin(t * 2 + i) * 0.01;
        pos[1] += Math.cos(t * 2 + i) * 0.01;
      }

      dummy.position.set(
        pos[0] + center[0],
        pos[1] + center[1],
        pos[2] + center[2],
      );
      const scale = phase === "merge" ? 0.06 : 0.04 + Math.sin(t + i) * 0.01;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        color={colorObj}
        emissive={colorObj}
        emissiveIntensity={0.8}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

// ─── Floating theory label ─────────────────────────────────
function TheoryLabel({
  text,
  position,
  color,
}: {
  text: string;
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <group ref={ref} position={position}>
      <Text
        fontSize={0.22}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {text}
      </Text>
    </group>
  );
}

// ─── Wireframe sphere outline ──────────────────────────────
function WireframeSphere({
  center,
  color,
}: {
  center: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.15;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={center}>
      <sphereGeometry args={[1.8, 16, 16]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.12} />
    </mesh>
  );
}

// ─── Main scene ────────────────────────────────────────────
function Scene({
  theoryA,
  theoryB,
  phase,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  phase: "idle" | "approach" | "explode" | "merge";
}) {
  const centerA: [number, number, number] = phase === "idle" ? [-2.5, 0, 0] : [-1, 0, 0];
  const centerB: [number, number, number] = phase === "idle" ? [2.5, 0, 0] : [1, 0, 0];

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#6366f1" />

      {theoryA && (
        <>
          <ParticleCloud
            theory={theoryA}
            color="#3b82f6"
            center={centerA}
            isColliding={phase !== "idle"}
            phase={phase}
          />
          <WireframeSphere center={centerA} color="#3b82f6" />
          <TheoryLabel
            text={theoryA.name}
            position={[centerA[0], 2.3, centerA[2]]}
            color="#60a5fa"
          />
        </>
      )}

      {theoryB && (
        <>
          <ParticleCloud
            theory={theoryB}
            color="#ef4444"
            center={centerB}
            isColliding={phase !== "idle"}
            phase={phase}
          />
          <WireframeSphere center={centerB} color="#ef4444" />
          <TheoryLabel
            text={theoryB.name}
            position={[centerB[0], 2.3, centerB[2]]}
            color="#f87171"
          />
        </>
      )}

      {/* Merged glow when in merge phase */}
      {phase === "merge" && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#a855f7"
            emissiveIntensity={1.5}
            transparent
            opacity={0.25}
          />
        </mesh>
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// ─── Exported wrapper ──────────────────────────────────────
export default function TheoryParticles3D({
  theoryA,
  theoryB,
  isColliding,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  isColliding: boolean;
}) {
  const phaseRef = useRef<"idle" | "approach" | "explode" | "merge">("idle");
  const [phase, setPhase] = useState<"idle" | "approach" | "explode" | "merge">("idle");

  useEffect(() => {
    if (isColliding) {
      setPhase("approach");
      const t1 = setTimeout(() => setPhase("explode"), 1500);
      const t2 = setTimeout(() => setPhase("merge"), 2500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setPhase("idle");
    }
  }, [isColliding]);

  const hasTheories = theoryA || theoryB;

  if (!hasTheories) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border border-border/30 flex items-center justify-center mx-auto mb-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
          </div>
          <p className="text-xs text-muted-foreground/40">
            Select theories to see particle visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-black/30 border border-border/30">
      <Canvas
        camera={{ position: [0, 2, 7], fov: 50 }}
        style={{ background: "transparent" }}
      >
        <Scene theoryA={theoryA} theoryB={theoryB} phase={phase} />
      </Canvas>

      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 flex items-center gap-4 pointer-events-none">
        {theoryA && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
            <span className="text-[10px] text-blue-400/80 font-medium">{theoryA.name}</span>
          </div>
        )}
        {theoryB && (
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
            <span className="text-[10px] text-red-400/80 font-medium">{theoryB.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Need useState import
import { useState } from "react";
