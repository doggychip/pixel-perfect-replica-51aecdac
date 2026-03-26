import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

// ─── Types ───────────────────────────────────────────────────
type Phase = "idle" | "approach" | "explode" | "merge";

interface TheoryParticles3DProps {
  theoryA?: CollisionTheory;
  theoryB?: CollisionTheory;
  isColliding: boolean;
  hasResult: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────
function hexToVec3(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function factorToPosition(factor: string, idx: number, total: number): THREE.Vector3 {
  const hash = [...factor].reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = (idx / total) * Math.PI * 2;
  const r = 1.2 + (hash % 30) * 0.04;
  return new THREE.Vector3(
    Math.cos(angle) * r,
    (hash % 20 - 10) * 0.08,
    Math.sin(angle) * r
  );
}

function getMotionType(factor: string): number {
  const f = factor.toLowerCase();
  if (f.includes("wave") || f.includes("field") || f.includes("flow")) return 0; // wave
  if (f.includes("spin") || f.includes("orbit") || f.includes("rotat")) return 1; // orbit
  if (f.includes("pulse") || f.includes("oscil") || f.includes("vibr")) return 2; // pulse
  if (f.includes("spiral") || f.includes("vortex") || f.includes("helix")) return 3; // spiral
  return 4; // jitter
}

// ─── Nebula Cloud ────────────────────────────────────────────
function NebulaCloud({
  theory,
  offset,
  phase,
  phaseProgress,
  activeFactor,
  onFactorHover,
  onFactorClick,
}: {
  theory: CollisionTheory;
  offset: THREE.Vector3;
  phase: Phase;
  phaseProgress: number;
  activeFactor: string | null;
  onFactorHover: (f: string | null) => void;
  onFactorClick: (f: string) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const color = hexToVec3(DOMAIN_COLORS[theory.domain as DomainKey] ?? "#888");

  const particles = useMemo(() => {
    const pts: { pos: THREE.Vector3; coreIdx: number; speed: number; motion: number }[] = [];
    const factorCores = theory.factors.map((f, i) => ({
      pos: factorToPosition(f, i, theory.factors.length),
      motion: getMotionType(f),
    }));

    const countPerCore = Math.floor(250 / Math.max(theory.factors.length, 1));

    factorCores.forEach((core, ci) => {
      for (let j = 0; j < countPerCore; j++) {
        const spread = 0.6 + Math.random() * 0.5;
        pts.push({
          pos: new THREE.Vector3(
            core.pos.x + (Math.random() - 0.5) * spread,
            core.pos.y + (Math.random() - 0.5) * spread,
            core.pos.z + (Math.random() - 0.5) * spread
          ),
          coreIdx: ci,
          speed: 0.3 + Math.random() * 0.7,
          motion: core.motion,
        });
      }
    });
    return pts;
  }, [theory]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const basePositions = useMemo(() => particles.map(p => p.pos.clone()), [particles]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Phase-based offset
    let phaseOffset = offset.clone();
    if (phase === "approach") {
      const lerp = Math.min(phaseProgress, 1);
      phaseOffset.multiplyScalar(1 - lerp * 0.7);
    } else if (phase === "explode") {
      phaseOffset.set(0, 0, 0);
    } else if (phase === "merge") {
      phaseOffset.set(0, 0, 0);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const base = basePositions[i];
      let x = base.x, y = base.y, z = base.z;

      // Motion patterns
      const st = t * p.speed;
      switch (p.motion) {
        case 0: // wave
          y += Math.sin(st * 1.5 + i) * 0.15;
          break;
        case 1: // orbit
          x += Math.cos(st + i * 0.1) * 0.12;
          z += Math.sin(st + i * 0.1) * 0.12;
          break;
        case 2: // pulse
          const scale = 1 + Math.sin(st * 2) * 0.1;
          x *= scale; y *= scale; z *= scale;
          break;
        case 3: // spiral
          const angle = st + i * 0.05;
          x += Math.cos(angle) * 0.1;
          y += Math.sin(angle * 0.5) * 0.08;
          z += Math.sin(angle) * 0.1;
          break;
        default: // jitter
          x += Math.sin(st * 3 + i * 7) * 0.05;
          y += Math.cos(st * 2.5 + i * 11) * 0.05;
          z += Math.sin(st * 2 + i * 13) * 0.05;
      }

      // Explode phase: particles fly outward
      if (phase === "explode") {
        const explodeForce = phaseProgress * 2.5;
        const dir = base.clone().normalize();
        x += dir.x * explodeForce * p.speed;
        y += dir.y * explodeForce * p.speed;
        z += dir.z * explodeForce * p.speed;
      }

      // Merge phase: particles converge to center
      if (phase === "merge") {
        const mergeFactor = Math.min(phaseProgress, 1) * 0.6;
        x *= (1 - mergeFactor);
        y *= (1 - mergeFactor);
        z *= (1 - mergeFactor);
      }

      dummy.position.set(x + phaseOffset.x, y + phaseOffset.y, z + phaseOffset.z);
      
      const baseScale = phase === "explode" 
        ? 0.025 * (1 - phaseProgress * 0.5) 
        : phase === "merge"
        ? 0.025 * (1 + phaseProgress * 0.3)
        : 0.025;
      dummy.scale.setScalar(baseScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Factor labels
  const factorPositions = useMemo(() => {
    return theory.factors.map((f, i) => ({
      name: f,
      pos: factorToPosition(f, i, theory.factors.length),
    }));
  }, [theory]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Factor labels */}
      {factorPositions.map(({ name, pos }) => (
        <group key={name} position={[pos.x + offset.x, pos.y + offset.y, pos.z + offset.z]}>
          {/* Highlight dot */}
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial
              color={activeFactor === name ? "#f59e0b" : color}
              transparent
              opacity={activeFactor === name ? 1 : 0.6}
            />
          </mesh>
          {activeFactor === name && (
            <mesh>
              <ringGeometry args={[0.1, 0.13, 32]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
          <Html
            position={[0, 0.15, 0]}
            center
            style={{ pointerEvents: "auto" }}
          >
            <div
              className="px-1.5 py-0.5 text-[9px] rounded bg-black/70 border border-white/10 text-white/80 whitespace-nowrap cursor-pointer select-none hover:text-amber-300 transition-colors"
              onMouseEnter={() => onFactorHover(name)}
              onMouseLeave={() => onFactorHover(null)}
              onClick={() => onFactorClick(name)}
            >
              {name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

// ─── Collision Fireworks ─────────────────────────────────────
function CollisionFireworks({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 1.5 + Math.random() * 2;
      return {
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ),
        color: new THREE.Color().setHSL(0.55 + Math.random() * 0.3, 0.9, 0.6),
      };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const fade = Math.max(0, 1 - progress);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      dummy.position.copy(p.dir).multiplyScalar(progress);
      dummy.scale.setScalar(0.04 * fade);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, p.color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 80]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}

// ─── Shockwave Ring ──────────────────────────────────────────
function ShockwaveRing({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const s = progress * 4;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - progress);
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.9, 1, 64]} />
      <meshBasicMaterial color="#fff" transparent opacity={1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ─── Connecting Arcs ─────────────────────────────────────────
function ConnectingArcs({
  theoryA,
  theoryB,
  offsetA,
  offsetB,
  activeFactor,
}: {
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  offsetA: THREE.Vector3;
  offsetB: THREE.Vector3;
  activeFactor: string | null;
}) {
  const lines = useMemo(() => {
    const result: { from: THREE.Vector3; to: THREE.Vector3; highlight: boolean }[] = [];
    theoryA.factors.forEach((fA, iA) => {
      theoryB.factors.forEach((fB, iB) => {
        // Simple similarity: share a word
        const wordsA = fA.toLowerCase().split(/\s+/);
        const wordsB = fB.toLowerCase().split(/\s+/);
        const shared = wordsA.some(w => w.length > 3 && wordsB.includes(w));
        if (shared || (iA === iB && iA < 2)) {
          const posA = factorToPosition(fA, iA, theoryA.factors.length).add(offsetA);
          const posB = factorToPosition(fB, iB, theoryB.factors.length).add(offsetB);
          result.push({
            from: posA,
            to: posB,
            highlight: activeFactor === fA || activeFactor === fB,
          });
        }
      });
    });
    return result;
  }, [theoryA, theoryB, offsetA, offsetB, activeFactor]);

  return (
    <>
      {lines.map((line, i) => {
        const mid = line.from.clone().add(line.to).multiplyScalar(0.5);
        mid.y += 0.5;
        const curve = new THREE.QuadraticBezierCurve3(line.from, mid, line.to);
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={i}>
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial
              color={line.highlight ? "#f59e0b" : "#ffffff"}
              transparent
              opacity={line.highlight ? 0.6 : 0.1}
              blending={THREE.AdditiveBlending}
            />
          </line>
        );
      })}
    </>
  );
}

// ─── Scene ───────────────────────────────────────────────────
function Scene({ theoryA, theoryB, isColliding, hasResult }: TheoryParticles3DProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [activeFactor, setActiveFactor] = useState<string | null>(null);
  const phaseStartRef = useRef(0);

  useEffect(() => {
    if (isColliding) {
      setPhase("approach");
      phaseStartRef.current = 0;
    } else if (hasResult && phase !== "idle") {
      setPhase("merge");
      phaseStartRef.current = 0;
    } else if (!isColliding && !hasResult) {
      setPhase("idle");
    }
  }, [isColliding, hasResult]);

  useFrame(({ clock }) => {
    if (phase === "idle") {
      setPhaseProgress(0);
      return;
    }

    if (phaseStartRef.current === 0) phaseStartRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - phaseStartRef.current;

    if (phase === "approach") {
      setPhaseProgress(Math.min(elapsed / 2, 1));
      if (elapsed > 2) {
        setPhase("explode");
        phaseStartRef.current = clock.getElapsedTime();
      }
    } else if (phase === "explode") {
      setPhaseProgress(Math.min(elapsed / 1.5, 1));
      if (elapsed > 1.5) {
        setPhase("merge");
        phaseStartRef.current = clock.getElapsedTime();
      }
    } else if (phase === "merge") {
      setPhaseProgress(Math.min(elapsed / 2, 1));
      if (elapsed > 3) {
        setPhase("idle");
      }
    }
  });

  const offsetA = useMemo(() => new THREE.Vector3(-2.2, 0, 0), []);
  const offsetB = useMemo(() => new THREE.Vector3(2.2, 0, 0), []);

  return (
    <>
      <ambientLight intensity={0.3} />
      <Stars radius={50} depth={40} count={1500} factor={3} saturation={0.2} fade speed={0.5} />

      {theoryA && (
        <NebulaCloud
          theory={theoryA}
          offset={offsetA}
          phase={phase}
          phaseProgress={phaseProgress}
          activeFactor={activeFactor}
          onFactorHover={setActiveFactor}
          onFactorClick={setActiveFactor}
        />
      )}

      {theoryB && (
        <NebulaCloud
          theory={theoryB}
          offset={offsetB}
          phase={phase}
          phaseProgress={phaseProgress}
          activeFactor={activeFactor}
          onFactorHover={setActiveFactor}
          onFactorClick={setActiveFactor}
        />
      )}

      {theoryA && theoryB && phase === "idle" && (
        <ConnectingArcs
          theoryA={theoryA}
          theoryB={theoryB}
          offsetA={offsetA}
          offsetB={offsetB}
          activeFactor={activeFactor}
        />
      )}

      {phase === "explode" && (
        <>
          <CollisionFireworks progress={phaseProgress} />
          <ShockwaveRing progress={phaseProgress} />
        </>
      )}
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────
export default function TheoryParticles3D(props: TheoryParticles3DProps) {
  return (
    <div className="w-full h-full min-h-[200px]">
      <Canvas
        camera={{ position: [0, 1, 6], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
