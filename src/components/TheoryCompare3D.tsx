import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Motion pattern classification ──────────────────────────
type MotionType = "orbital" | "wave" | "chaotic" | "pulsing" | "spiral" | "lattice";

const MOTION_KEYWORDS: Record<MotionType, string[]> = {
  orbital: ["state space", "stability", "basin of attraction", "fixed point", "contraction", "continuity", "orbit", "attractor", "equilibrium", "operational closure"],
  wave: ["interference", "synchronization", "oscillation", "frequency", "phase coupling", "wavefunction", "complementarity", "observation context", "wave"],
  chaotic: ["butterfly effect", "bifurcation", "strange attractors", "fractal", "unpredictable", "perturbation", "avalanches", "turbul", "sensitivity"],
  pulsing: ["correlation", "broadcasting", "co-activation", "synaptic", "potentiation", "feedback", "workspace ignition", "redundancy", "access"],
  spiral: ["entropy", "self-organization", "energy flow", "gradient", "helical", "winding", "vortex", "entropy export", "dissipat", "variational"],
  lattice: ["compression", "probability distribution", "grid", "Betti numbers", "invariants", "charts", "structure", "topology", "lattice", "filtration"],
};

function classifyFactor(factor: string): MotionType {
  const fl = factor.toLowerCase();
  let bestMatch: MotionType = "orbital";
  let bestScore = 0;
  for (const [motion, keywords] of Object.entries(MOTION_KEYWORDS) as [MotionType, string[]][]) {
    const score = keywords.filter(k => fl.includes(k.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = motion;
    }
  }
  // Fallback: use hash-based assignment if no keyword matched
  if (bestScore === 0) {
    const hash = [...factor].reduce((a, c) => a + c.charCodeAt(0), 0);
    const motions: MotionType[] = ["orbital", "wave", "chaotic", "pulsing", "spiral", "lattice"];
    return motions[hash % motions.length];
  }
  return bestMatch;
}

const MOTION_LABELS: Record<MotionType, string> = {
  orbital: "Orbital",
  wave: "Wave",
  chaotic: "Chaotic",
  pulsing: "Pulsing",
  spiral: "Spiral",
  lattice: "Lattice",
};

const MOTION_COLORS: Record<MotionType, string> = {
  orbital: "#60a5fa",
  wave: "#34d399",
  chaotic: "#f87171",
  pulsing: "#fbbf24",
  spiral: "#a78bfa",
  lattice: "#f472b6",
};

// ─── Particle generation ────────────────────────────────────
interface Particle {
  basePos: THREE.Vector3;
  factorIdx: number;
  motion: MotionType;
  speed: number;
  phase: number;
}

function generateParticles(theory: CollisionTheory, offsetX: number): { particles: Particle[]; factorMeta: { name: string; motion: MotionType; center: THREE.Vector3 }[] } {
  const factorCount = theory.factors.length;
  const totalParticles = Math.min(400, 80 + factorCount * 60);
  const perFactor = Math.floor(totalParticles / factorCount);
  const particles: Particle[] = [];
  const factorMeta: { name: string; motion: MotionType; center: THREE.Vector3 }[] = [];

  theory.factors.forEach((factor, fi) => {
    const motion = classifyFactor(factor);
    // Distribute factor cores in a ring
    const angle = (fi / factorCount) * Math.PI * 2;
    const radius = 1.0 + factorCount * 0.15;
    const cx = Math.cos(angle) * radius + offsetX;
    const cy = (fi - factorCount / 2) * 0.3;
    const cz = Math.sin(angle) * radius;
    const center = new THREE.Vector3(cx, cy, cz);
    factorMeta.push({ name: factor, motion, center });

    for (let j = 0; j < perFactor; j++) {
      const spread = 0.4 + Math.random() * 0.5;
      particles.push({
        basePos: new THREE.Vector3(
          cx + (Math.random() - 0.5) * spread,
          cy + (Math.random() - 0.5) * spread,
          cz + (Math.random() - 0.5) * spread
        ),
        factorIdx: fi,
        motion,
        speed: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      });
    }
  });

  return { particles, factorMeta };
}

// ─── Theory Cloud Component ─────────────────────────────────
function TheoryCloud({
  theory,
  baseColor,
  offsetX,
  activeFactor,
  onFactorHover,
}: {
  theory: CollisionTheory;
  baseColor: THREE.Color;
  offsetX: number;
  activeFactor: string | null;
  onFactorHover: (f: string | null) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { particles, factorMeta } = useMemo(() => generateParticles(theory, offsetX), [theory, offsetX]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const base = p.basePos;
      let x = base.x, y = base.y, z = base.z;
      const st = t * p.speed + p.phase;

      // Apply motion pattern
      switch (p.motion) {
        case "orbital": {
          const r = 0.15;
          x += Math.cos(st * 1.2) * r;
          z += Math.sin(st * 1.2) * r;
          y += Math.sin(st * 0.6) * 0.03;
          break;
        }
        case "wave": {
          y += Math.sin(st * 2.0 + base.x * 3) * 0.18;
          x += Math.cos(st * 0.8) * 0.04;
          break;
        }
        case "chaotic": {
          // Lorenz-like jitter
          const dx = 0.1 * (Math.sin(st * 3.7 + i * 0.37) * 0.2);
          const dy = 0.1 * (Math.cos(st * 2.9 + i * 0.53) * 0.25);
          const dz = 0.1 * (Math.sin(st * 4.1 + i * 0.71) * 0.2);
          x += dx + Math.sin(st * 5 + i) * 0.06;
          y += dy + Math.cos(st * 4.3 + i * 1.3) * 0.06;
          z += dz + Math.sin(st * 3.3 + i * 0.9) * 0.06;
          break;
        }
        case "pulsing": {
          const pulse = 1 + Math.sin(st * 2.5) * 0.2;
          const center = factorMeta[p.factorIdx].center;
          x = center.x + (base.x - center.x) * pulse;
          y = center.y + (base.y - center.y) * pulse;
          z = center.z + (base.z - center.z) * pulse;
          break;
        }
        case "spiral": {
          const sa = st * 1.5;
          const sr = 0.1 + Math.sin(st * 0.5) * 0.05;
          x += Math.cos(sa) * sr;
          y += st * 0.02 % 0.3 - 0.15;
          z += Math.sin(sa) * sr;
          break;
        }
        case "lattice": {
          // Grid-locked tremor
          const gridSnap = 0.15;
          const gx = Math.round(base.x / gridSnap) * gridSnap;
          const gy = Math.round(base.y / gridSnap) * gridSnap;
          const gz = Math.round(base.z / gridSnap) * gridSnap;
          x = gx + Math.sin(st * 6 + i) * 0.02;
          y = gy + Math.cos(st * 5 + i * 0.7) * 0.02;
          z = gz + Math.sin(st * 4 + i * 1.1) * 0.02;
          break;
        }
      }

      dummy.position.set(x, y, z);
      const isHighlighted = activeFactor === theory.factors[p.factorIdx];
      dummy.scale.setScalar(isHighlighted ? 0.04 : 0.025);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color: blend base color with motion-specific tint
      const motionTint = new THREE.Color(MOTION_COLORS[p.motion]);
      tempColor.copy(baseColor).lerp(motionTint, 0.3);
      if (isHighlighted) tempColor.lerp(new THREE.Color("#ffffff"), 0.4);
      meshRef.current.setColorAt(i, tempColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {/* Factor labels */}
      {factorMeta.map(({ name, motion, center }) => (
        <group key={name} position={[center.x, center.y, center.z]}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial
              color={activeFactor === name ? "#ffffff" : MOTION_COLORS[motion]}
              transparent
              opacity={activeFactor === name ? 1 : 0.5}
            />
          </mesh>
          {activeFactor === name && (
            <mesh>
              <ringGeometry args={[0.1, 0.13, 32]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
          <Html position={[0, 0.18, 0]} center style={{ pointerEvents: "auto" }}>
            <div
              className="px-1.5 py-0.5 text-[9px] rounded bg-black/80 border border-white/10 whitespace-nowrap cursor-pointer select-none transition-colors"
              style={{ color: activeFactor === name ? "#fbbf24" : MOTION_COLORS[motion] }}
              onMouseEnter={() => onFactorHover(name)}
              onMouseLeave={() => onFactorHover(null)}
            >
              {name}
              <span className="ml-1 opacity-50 text-[8px]">{MOTION_LABELS[motion]}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* Theory name label */}
      <Html position={[offsetX, -2, 0]} center>
        <div className="text-center">
          <div className="text-xs font-bold px-2 py-1 rounded bg-black/70 border border-white/10" style={{ color: `#${baseColor.getHexString()}` }}>
            {theory.name}
          </div>
          <div className="text-[9px] text-white/40 mt-0.5">
            {particles.length} particles · {theory.factors.length} factors
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─── Scene ──────────────────────────────────────────────────
function Scene({
  theoryA,
  theoryB,
  activeFactor,
  onFactorHover,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  activeFactor: string | null;
  onFactorHover: (f: string | null) => void;
}) {
  const blueColor = useMemo(() => new THREE.Color("#3b82f6"), []);
  const redColor = useMemo(() => new THREE.Color("#ef4444"), []);

  const offsetA = theoryB ? -2.5 : 0;
  const offsetB = theoryA ? 2.5 : 0;

  return (
    <>
      <ambientLight intensity={0.2} />
      <Stars radius={60} depth={50} count={1200} factor={3} saturation={0.1} fade speed={0.3} />
      <OrbitControls enablePan={false} enableZoom={true} minDistance={3} maxDistance={15} />

      {theoryA && (
        <TheoryCloud
          theory={theoryA}
          baseColor={blueColor}
          offsetX={offsetA}
          activeFactor={activeFactor}
          onFactorHover={onFactorHover}
        />
      )}
      {theoryB && (
        <TheoryCloud
          theory={theoryB}
          baseColor={redColor}
          offsetX={offsetB}
          activeFactor={activeFactor}
          onFactorHover={onFactorHover}
        />
      )}
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────
export default function TheoryCompare3D({
  theoryA,
  theoryB,
  activeFactor,
  onFactorHover,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  activeFactor: string | null;
  onFactorHover: (f: string | null) => void;
}) {
  return (
    <div className="w-full h-full min-h-[300px]">
      <Canvas
        camera={{ position: [0, 1.5, 7], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene
          theoryA={theoryA}
          theoryB={theoryB}
          activeFactor={activeFactor}
          onFactorHover={onFactorHover}
        />
      </Canvas>
    </div>
  );
}
