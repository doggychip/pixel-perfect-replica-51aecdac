import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Motion pattern detection ────────────────────────────────
type MotionPattern = "orbital" | "wave" | "chaotic" | "pulsing" | "spiral";

function detectMotionPattern(factors: string[]): MotionPattern {
  const joined = factors.join(" ").toLowerCase();
  if (/orbit|field|rotat|spin|angular|entangl/.test(joined)) return "orbital";
  if (/wave|oscillat|frequen|interference|vibrat|resonan/.test(joined)) return "wave";
  if (/chaos|strange|bifurcat|fractal|attractor|nonlinear|turbul/.test(joined)) return "chaotic";
  if (/puls|rhythm|heartbeat|sync|feedback|oscillat|neural|firing/.test(joined)) return "pulsing";
  if (/spiral|vortex|topolog|loop|curl|manifold|twist/.test(joined)) return "spiral";
  return "wave";
}

function applyMotion(pattern: MotionPattern, p: { pos: THREE.Vector3; speed: number; offset: number; radius: number }, t: number) {
  let dx = 0, dy = 0, dz = 0;
  switch (pattern) {
    case "orbital": {
      const angle = t * p.speed + p.offset;
      dx = Math.cos(angle) * p.radius * 0.4;
      dy = Math.sin(angle * 0.6 + p.offset) * 0.3;
      dz = Math.sin(angle) * p.radius * 0.4;
      break;
    }
    case "wave": {
      dx = Math.sin(t * p.speed + p.offset) * 0.4;
      dy = Math.sin(t * p.speed * 1.3 + p.pos.x * 2) * 0.35;
      dz = Math.cos(t * p.speed * 0.5 + p.offset) * 0.2;
      break;
    }
    case "chaotic": {
      const s = t * p.speed;
      dx = Math.sin(s * 1.7 + p.offset) * 0.5 + Math.sin(s * 3.1) * 0.15;
      dy = Math.cos(s * 2.3 + p.offset * 1.4) * 0.4 + Math.cos(s * 4.7) * 0.1;
      dz = Math.sin(s * 1.1 + p.offset * 0.7) * 0.35 + Math.sin(s * 5.3) * 0.08;
      break;
    }
    case "pulsing": {
      const pulse = 1 + Math.sin(t * 1.5) * 0.35;
      dx = p.pos.x * (pulse - 1) * 0.6;
      dy = p.pos.y * (pulse - 1) * 0.6 + Math.sin(t * p.speed + p.offset) * 0.1;
      dz = p.pos.z * (pulse - 1) * 0.6;
      break;
    }
    case "spiral": {
      const angle = t * p.speed * 0.8 + p.offset;
      dx = Math.cos(angle) * p.radius * 0.3;
      dy = Math.sin(t * 0.3 + p.offset) * 0.8;
      dz = Math.sin(angle) * p.radius * 0.3;
      break;
    }
  }
  return { dx, dy, dz };
}

type ParticleData = { pos: THREE.Vector3; speed: number; offset: number; radius: number };

// ─── Particle Cloud ──────────────────────────────────────────
function ParticleCloud({
  theory,
  position,
  color,
  phase,
  phaseTime,
}: {
  theory: CollisionTheory;
  position: [number, number, number];
  color: string;
  phase: "idle" | "approach" | "explode" | "merge";
  phaseTime: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const factorCount = theory.factors.length;
  const count = Math.max(30, factorCount * 18);
  const spread = 1.8 + factorCount * 0.25;
  const threeColor = useMemo(() => new THREE.Color(color), [color]);
  const pattern = useMemo(() => detectMotionPattern(theory.factors), [theory.factors]);

  const particles = useMemo(() => {
    const arr: ParticleData[] = [];
    const baseRadius = spread * 0.6;
    for (let i = 0; i < count; i++) {
      // Distribute on a spherical shell with some thickness
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = baseRadius * (0.7 + Math.random() * 0.3); // shell thickness
      arr.push({
        pos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        speed: 0.2 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        radius: baseRadius,
      });
    }
    return arr;
  }, [count, spread]);

  // Explosion directions — computed once per collision
  const explodeDirs = useMemo(() => {
    return particles.map(() => {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      return dir;
    });
  }, [particles]);

  const positionsAttr = useMemo(() => {
    const arr = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.pos.x;
      arr[i * 3 + 1] = p.pos.y;
      arr[i * 3 + 2] = p.pos.z;
    });
    return arr;
  }, [particles, count]);

  const geoRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);

  useFrame(({ clock }) => {
    if (!geoRef.current || !groupRef.current) return;
    const t = clock.getElapsedTime();
    const posArr = geoRef.current.attributes.position.array as Float32Array;

    if (phase === "idle") {
      // Normal motion patterns
      particles.forEach((p, i) => {
        const { dx, dy, dz } = applyMotion(pattern, p, t);
        posArr[i * 3] = p.pos.x + dx;
        posArr[i * 3 + 1] = p.pos.y + dy;
        posArr[i * 3 + 2] = p.pos.z + dz;
      });
      groupRef.current.position.x += (position[0] - groupRef.current.position.x) * 0.05;
      if (matRef.current) {
        matRef.current.color.lerp(threeColor, 0.05);
        matRef.current.opacity += (0.9 - matRef.current.opacity) * 0.05;
      }
    } else if (phase === "approach") {
      // Rush toward center
      particles.forEach((p, i) => {
        const { dx, dy, dz } = applyMotion(pattern, p, t);
        posArr[i * 3] = p.pos.x + dx;
        posArr[i * 3 + 1] = p.pos.y + dy;
        posArr[i * 3 + 2] = p.pos.z + dz;
      });
      const targetX = position[0] > 0 ? position[0] - 2.2 : position[0] + 2.2;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.06;
    } else if (phase === "explode") {
      // Scatter outward from center
      const explodeProgress = Math.min(phaseTime / 1.2, 1); // 1.2s explosion
      const eased = 1 - Math.pow(1 - explodeProgress, 3); // ease-out cubic
      const explosionRadius = 4 + factorCount * 0.5;

      particles.forEach((p, i) => {
        const dir = explodeDirs[i];
        posArr[i * 3] = dir.x * explosionRadius * eased + Math.sin(t * 3 + p.offset) * 0.1;
        posArr[i * 3 + 1] = dir.y * explosionRadius * eased + Math.cos(t * 2 + p.offset) * 0.1;
        posArr[i * 3 + 2] = dir.z * explosionRadius * eased + Math.sin(t * 4 + p.offset) * 0.05;
      });
      // Move group to center
      groupRef.current.position.x += (0 - groupRef.current.position.x) * 0.1;
      if (matRef.current) {
        matRef.current.opacity = 0.9 - explodeProgress * 0.4;
      }
    } else if (phase === "merge") {
      // Reform into center with merged color
      const mergeProgress = Math.min(phaseTime / 1.8, 1); // 1.8s merge
      const eased = mergeProgress * mergeProgress * (3 - 2 * mergeProgress); // smoothstep
      const mergedColor = new THREE.Color("#a855f7"); // purple merge color

      particles.forEach((p, i) => {
        const dir = explodeDirs[i];
        // From scattered position back to orbital around center
        const scattered = 4 + factorCount * 0.5;
        const targetR = 1.2 + Math.sin(p.offset) * 0.5;
        const angle = t * 0.5 + p.offset;
        const targetX = Math.cos(angle) * targetR;
        const targetY = Math.sin(angle * 0.7) * targetR;
        const targetZ = Math.sin(angle * 1.3) * targetR * 0.5;

        const fromX = dir.x * scattered;
        const fromY = dir.y * scattered;
        const fromZ = dir.z * scattered;

        posArr[i * 3] = fromX + (targetX - fromX) * eased;
        posArr[i * 3 + 1] = fromY + (targetY - fromY) * eased;
        posArr[i * 3 + 2] = fromZ + (targetZ - fromZ) * eased;
      });

      groupRef.current.position.x += (0 - groupRef.current.position.x) * 0.08;
      if (matRef.current) {
        matRef.current.color.lerp(mergedColor, 0.04);
        matRef.current.opacity += (0.95 - matRef.current.opacity) * 0.04;
      }
    }

    geoRef.current.attributes.position.needsUpdate = true;
  });

  const sphereRadius = spread * 0.6;
  const sphereRef = useRef<THREE.Mesh>(null);

  // Animate sphere glow
  useFrame(({ clock }) => {
    if (!sphereRef.current) return;
    const t = clock.getElapsedTime();
    sphereRef.current.rotation.y = t * 0.15;
    sphereRef.current.rotation.x = Math.sin(t * 0.1) * 0.2;
    const pulse = 0.12 + Math.sin(t * 2) * 0.06;
    (sphereRef.current.material as THREE.MeshBasicMaterial).opacity = phase === "idle" || phase === "approach" ? pulse : 0;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Glowing wireframe sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[sphereRadius * 1.05, 24, 16]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.12} />
      </mesh>
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[positionsAttr, 3]}
            count={count}
          />
        </bufferGeometry>
        <pointsMaterial ref={matRef} color={threeColor} size={0.13} sizeAttenuation transparent opacity={0.9} />
      </points>
      {(phase === "idle" || phase === "approach") && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text fontSize={0.32} color={color} anchorX="center" anchorY="bottom" position={[0, 2, 0]} outlineWidth={0.02} outlineColor="#000000">
            {theory.name}
          </Text>
          {theory.nameCn && (
            <Text fontSize={0.2} color={color} anchorX="center" anchorY="top" position={[0, 1.85, 0]} outlineWidth={0.015} outlineColor="#000000">
              {theory.nameCn}
            </Text>
          )}
        </Billboard>
      )}
    </group>
  );
}

// ─── Merged Label ────────────────────────────────────────────
function MergedLabel({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.visible = visible;
    }
  });
  if (!visible) return null;
  return (
    <group ref={ref}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text fontSize={0.28} color="#a855f7" anchorX="center" anchorY="bottom" position={[0, 2.2, 0]} outlineWidth={0.02} outlineColor="#000000">
          Synthesized Framework
        </Text>
        <Text fontSize={0.18} color="#c084fc" anchorX="center" anchorY="top" position={[0, 2.05, 0]} outlineWidth={0.015} outlineColor="#000000">
          合成框架
        </Text>
      </Billboard>
    </group>
  );
}

// ─── Collision Flash ─────────────────────────────────────────
function CollisionFlash({ phase, phaseTime }: { phase: string; phaseTime: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    if (phase === "explode" && phaseTime < 0.5) {
      const t = phaseTime / 0.5;
      meshRef.current.scale.setScalar(t * 5);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

// ─── Shockwave Ring ──────────────────────────────────────────
function ShockwaveRing({ phase, phaseTime }: { phase: string; phaseTime: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    if (phase === "explode" && phaseTime < 1.0) {
      const t = phaseTime / 1.0;
      ref.current.scale.setScalar(t * 8);
      (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.4;
      ref.current.visible = true;
    } else {
      ref.current.visible = false;
    }
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.0, 32]} />
      <meshBasicMaterial color="#a855f7" transparent opacity={0} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ─── Scene Controller ────────────────────────────────────────
function ColliderScene({
  theoryA,
  theoryB,
  colliding,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  colliding: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "approach" | "explode" | "merge">("idle");
  const phaseStartRef = useRef(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const collidingRef = useRef(false);

  useEffect(() => {
    if (colliding && !collidingRef.current) {
      collidingRef.current = true;
      setPhase("approach");
      phaseStartRef.current = performance.now();
    }
    if (!colliding && collidingRef.current) {
      collidingRef.current = false;
      // Stay in merge for a bit, then reset
      setTimeout(() => setPhase("idle"), 2000);
    }
  }, [colliding]);

  useFrame(() => {
    const elapsed = (performance.now() - phaseStartRef.current) / 1000;
    setPhaseTime(elapsed);

    if (phase === "approach" && elapsed > 1.2) {
      setPhase("explode");
      phaseStartRef.current = performance.now();
    } else if (phase === "explode" && elapsed > 1.2) {
      setPhase("merge");
      phaseStartRef.current = performance.now();
    }
  });

  const colorA = "#3b82f6";
  const colorB = "#ef4444";

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.6} />
      <Stars radius={40} depth={25} count={500} factor={2.5} fade speed={1} />
      <OrbitControls enablePan={false} maxDistance={14} minDistance={4} />
      {theoryA && (
        <ParticleCloud theory={theoryA} position={[-3, 0, 0]} color={colorA} phase={phase} phaseTime={phaseTime} />
      )}
      {theoryB && (
        <ParticleCloud theory={theoryB} position={[3, 0, 0]} color={colorB} phase={phase} phaseTime={phaseTime} />
      )}
      <CollisionFlash phase={phase} phaseTime={phaseTime} />
      <ShockwaveRing phase={phase} phaseTime={phaseTime} />
      <MergedLabel visible={phase === "merge" && phaseTime > 0.8} />
    </>
  );
}

// ─── Exported Component ──────────────────────────────────────
export default function CollisionScene3D({
  theoryA,
  theoryB,
  colliding,
  className,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  colliding: boolean;
  className?: string;
}) {
  return (
    <div className={className ?? "w-full h-64 rounded-lg overflow-hidden border border-border/50 bg-[hsl(225,50%,4%)]"}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Suspense fallback={null}>
          <ColliderScene theoryA={theoryA} theoryB={theoryB} colliding={colliding} />
        </Suspense>
      </Canvas>
      {!theoryA && !theoryB && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground text-xs">Select two theories to visualize</p>
        </div>
      )}
    </div>
  );
}
