import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

// ─── Types ───────────────────────────────────────────────────
type Phase = "idle" | "approach" | "collide" | "explode" | "merge" | "unified";

interface TheoryParticles3DProps {
  theoryA?: CollisionTheory;
  theoryB?: CollisionTheory;
  isColliding: boolean;
  hasResult: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────
function factorToPosition(factor: string, idx: number, total: number): THREE.Vector3 {
  const hash = [...factor].reduce((a, c) => a + c.charCodeAt(0), 0);
  const angle = (idx / total) * Math.PI * 2;
  const r = 1.0 + (hash % 20) * 0.03;
  return new THREE.Vector3(
    Math.cos(angle) * r,
    (hash % 20 - 10) * 0.06,
    Math.sin(angle) * r
  );
}

function getMotionType(factor: string): number {
  const f = factor.toLowerCase();
  if (f.includes("wave") || f.includes("field") || f.includes("flow") || f.includes("interference") || f.includes("synchron")) return 0;
  if (f.includes("state") || f.includes("orbit") || f.includes("stabil") || f.includes("attract")) return 1;
  if (f.includes("pulse") || f.includes("oscil") || f.includes("vibr") || f.includes("broadcast") || f.includes("correlat")) return 2;
  if (f.includes("spiral") || f.includes("vortex") || f.includes("helix") || f.includes("entropy") || f.includes("self-org")) return 3;
  if (f.includes("chaos") || f.includes("butterfly") || f.includes("bifurcat") || f.includes("perturb")) return 4;
  return 5; // lattice/default
}

// ─── Merged Cloud (post-collision unified particles) ─────────
function MergedCloud({
  theoryA,
  theoryB,
  progress,
}: {
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  progress: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const colorA = useMemo(() => new THREE.Color(DOMAIN_COLORS[theoryA.domain as DomainKey] ?? "#3b82f6"), [theoryA]);
  const colorB = useMemo(() => new THREE.Color(DOMAIN_COLORS[theoryB.domain as DomainKey] ?? "#ef4444"), [theoryB]);
  const mergedColor = useMemo(() => new THREE.Color().copy(colorA).lerp(colorB, 0.5), [colorA, colorB]);

  const COUNT = 300;
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.3 + Math.random() * 1.2;
      return {
        pos: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * r,
          Math.sin(phi) * Math.sin(theta) * r,
          Math.cos(phi) * r
        ),
        speed: 0.2 + Math.random() * 0.6,
        fromA: i < COUNT / 2,
      };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const fade = Math.min(progress, 1);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      // Orbiting unified cloud
      const angle = t * p.speed * 0.5 + i * 0.1;
      const r = p.pos.length() * (0.8 + Math.sin(t * 0.3 + i) * 0.15);
      const x = p.pos.x + Math.cos(angle) * 0.08;
      const y = p.pos.y + Math.sin(t * 0.7 + i * 0.3) * 0.06;
      const z = p.pos.z + Math.sin(angle) * 0.08;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.03 * fade);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color: blend from original to merged purple
      const sourceColor = p.fromA ? colorA : colorB;
      tempColor.copy(sourceColor).lerp(mergedColor, fade * 0.6);
      // Add shimmer
      const shimmer = Math.sin(t * 3 + i * 0.5) * 0.15;
      tempColor.r = Math.min(1, tempColor.r + shimmer);
      tempColor.g = Math.min(1, tempColor.g + shimmer * 0.5);
      meshRef.current.setColorAt(i, tempColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

// ─── Nebula Cloud ────────────────────────────────────────────
function NebulaCloud({
  theory,
  side,
  phase,
  phaseProgress,
  activeFactor,
  onFactorHover,
  onFactorClick,
}: {
  theory: CollisionTheory;
  side: "left" | "right";
  phase: Phase;
  phaseProgress: number;
  activeFactor: string | null;
  onFactorHover: (f: string | null) => void;
  onFactorClick: (f: string) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const color = useMemo(() => new THREE.Color(DOMAIN_COLORS[theory.domain as DomainKey] ?? "#888"), [theory]);
  const idleOffsetX = side === "left" ? -2.2 : 2.2;

  const totalParticleCount = Math.min(400, 80 + theory.factors.length * 60);

  const particles = useMemo(() => {
    const count = Math.min(400, 80 + theory.factors.length * 60);
    const pts: { pos: THREE.Vector3; coreIdx: number; speed: number; motion: number; phase: number }[] = [];
    const factorCores = theory.factors.map((f, i) => ({
      pos: factorToPosition(f, i, theory.factors.length),
      motion: getMotionType(f),
    }));
    const countPerCore = Math.floor(count / Math.max(theory.factors.length, 1));

    factorCores.forEach((core, ci) => {
      for (let j = 0; j < countPerCore; j++) {
        const spread = 0.5 + Math.random() * 0.4;
        pts.push({
          pos: new THREE.Vector3(
            core.pos.x + (Math.random() - 0.5) * spread,
            core.pos.y + (Math.random() - 0.5) * spread,
            core.pos.z + (Math.random() - 0.5) * spread
          ),
          coreIdx: ci,
          speed: 0.3 + Math.random() * 0.7,
          motion: core.motion,
          phase: Math.random() * Math.PI * 2,
        });
      }
    });
    return pts;
  }, [theory]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Compute dynamic offset based on phase
    let offsetX = idleOffsetX;
    let cloudOpacity = 1;

    if (phase === "approach") {
      // Clouds move toward each other
      const lerp = Math.min(phaseProgress, 1);
      offsetX = idleOffsetX * (1 - lerp * 0.85);
    } else if (phase === "collide") {
      // Clouds overlap at center, particles interweave
      offsetX = idleOffsetX * 0.15 * (1 - phaseProgress * 0.5);
    } else if (phase === "explode") {
      offsetX = 0;
      cloudOpacity = Math.max(0, 1 - phaseProgress * 0.6);
    } else if (phase === "merge" || phase === "unified") {
      offsetX = 0;
      cloudOpacity = Math.max(0, 1 - phaseProgress);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const base = p.pos;
      let x = base.x, y = base.y, z = base.z;
      const st = t * p.speed + p.phase;

      // Motion patterns
      switch (p.motion) {
        case 0: // wave
          y += Math.sin(st * 1.5 + i) * 0.15;
          x += Math.cos(st * 0.6) * 0.04;
          break;
        case 1: // orbital
          x += Math.cos(st * 1.2) * 0.12;
          z += Math.sin(st * 1.2) * 0.12;
          break;
        case 2: // pulse
          { const sc = 1 + Math.sin(st * 2) * 0.1; x *= sc; y *= sc; z *= sc; }
          break;
        case 3: // spiral
          { const sa = st * 1.3; x += Math.cos(sa) * 0.1; y += Math.sin(sa * 0.5) * 0.08; z += Math.sin(sa) * 0.1; }
          break;
        case 4: // chaotic
          x += Math.sin(st * 3.5 + i * 0.37) * 0.08;
          y += Math.cos(st * 2.9 + i * 0.53) * 0.08;
          z += Math.sin(st * 4.1 + i * 0.71) * 0.06;
          break;
        default: // lattice jitter
          x += Math.sin(st * 5 + i) * 0.03;
          y += Math.cos(st * 4 + i * 0.7) * 0.03;
      }

      // Collide phase: particles swirl toward center
      if (phase === "collide") {
        const swirlAngle = t * 2 + i * 0.02;
        const pullFactor = phaseProgress * 0.5;
        x = x * (1 - pullFactor) + Math.cos(swirlAngle) * 0.3 * pullFactor;
        y = y * (1 - pullFactor) + Math.sin(swirlAngle * 0.7) * 0.2 * pullFactor;
        z = z * (1 - pullFactor) + Math.sin(swirlAngle) * 0.3 * pullFactor;
      }

      // Explode phase: particles blast outward
      if (phase === "explode") {
        const dir = base.clone().normalize();
        const force = phaseProgress * 3 * p.speed;
        x += dir.x * force;
        y += dir.y * force;
        z += dir.z * force;
      }

      // Merge/unified: particles converge into tight sphere
      if (phase === "merge" || phase === "unified") {
        const target = base.clone().normalize().multiplyScalar(0.4);
        const mf = Math.min(phaseProgress, 1);
        x = x * (1 - mf) + target.x * mf;
        y = y * (1 - mf) + target.y * mf;
        z = z * (1 - mf) + target.z * mf;
      }

      dummy.position.set(x + offsetX, y, z);

      let particleScale = 0.04;
      if (phase === "collide") particleScale = 0.045 * (1 + phaseProgress * 0.4);
      if (phase === "explode") particleScale = 0.05 * (1 - phaseProgress * 0.4);
      if (phase === "merge" || phase === "unified") particleScale = 0.04 * (1 - phaseProgress * 0.8);

      dummy.scale.setScalar(Math.max(0.001, particleScale));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color shift during collision
      tempColor.copy(color);
      if (phase === "collide" || phase === "explode") {
        tempColor.lerp(new THREE.Color("#ffffff"), phaseProgress * 0.3);
      }
      meshRef.current.setColorAt(i, tempColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Update material opacity
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.7 * cloudOpacity;
  });

  // Factor labels — only show in idle
  const factorPositions = useMemo(() => {
    return theory.factors.map((f, i) => ({
      name: f,
      pos: factorToPosition(f, i, theory.factors.length),
    }));
  }, [theory]);

  const showLabels = phase === "idle";

  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {/* Theory name + particle count label */}
      {showLabels && (
        <Html position={[idleOffsetX, -1.8, 0]} center>
          <div className="text-center pointer-events-none select-none">
            <div className="text-xs font-bold" style={{ color: `#${color.getHexString()}` }}>
              {theory.name}
            </div>
            <div className="text-[10px] text-white/50 mt-0.5">
              {totalParticleCount} particles · {theory.factors.length} factors
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-[180px]">
              {theory.factors.map((f, i) => {
                const motionLabels = ["wave", "orbital", "pulse", "spiral", "chaos", "lattice"];
                const motionType = motionLabels[getMotionType(f)] || "lattice";
                return (
                  <span key={f} className="text-[8px] px-1 py-0.5 rounded bg-white/10 text-white/60">
                    {f} <span className="text-white/30">({motionType})</span>
                  </span>
                );
              })}
            </div>
          </div>
        </Html>
      )}

      {showLabels && factorPositions.map(({ name, pos }) => (
        <group key={name} position={[pos.x + idleOffsetX, pos.y, pos.z]}>
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
              <ringGeometry args={[0.09, 0.12, 32]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
          )}
          <Html position={[0, 0.16, 0]} center style={{ pointerEvents: "auto" }}>
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

// ─── Collision Effects ───────────────────────────────────────
function CollisionSparks({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const COUNT = 120;
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1 + Math.random() * 3;
      return {
        dir: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ),
        color: new THREE.Color().setHSL(0.5 + Math.random() * 0.35, 0.9, 0.5 + Math.random() * 0.3),
        rotSpeed: (Math.random() - 0.5) * 4,
      };
    });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    const fade = Math.max(0, 1 - progress * 1.2);
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      dummy.position.copy(p.dir).multiplyScalar(progress * 0.8);
      dummy.scale.setScalar(0.035 * fade);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, p.color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

function ShockwaveRings({ progress }: { progress: number }) {
  return (
    <>
      {[0, 0.15, 0.3].map((delay, i) => {
        const p = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
        const s = p * 5;
        const opacity = Math.max(0, 1 - p) * 0.6;
        return (
          <mesh key={i} rotation={[Math.PI / 2 + i * 0.3, i * 0.5, 0]} scale={[s, s, s]}>
            <ringGeometry args={[0.85, 1, 64]} />
            <meshBasicMaterial color={i === 0 ? "#fff" : i === 1 ? "#8b5cf6" : "#06b6d4"} transparent opacity={opacity} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
          </mesh>
        );
      })}
    </>
  );
}

function EnergyCore({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 0.15 + progress * 0.4 + Math.sin(t * 8) * 0.05;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = Math.min(1, progress * 2);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#e0c3fc" transparent opacity={0} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

// ─── Connecting Arcs ─────────────────────────────────────────
function ConnectingArcs({
  theoryA,
  theoryB,
  activeFactor,
}: {
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  activeFactor: string | null;
}) {
  const offsetAx = -2.2;
  const offsetBx = 2.2;

  const lines = useMemo(() => {
    const result: { from: THREE.Vector3; to: THREE.Vector3; highlight: boolean }[] = [];
    theoryA.factors.forEach((fA, iA) => {
      theoryB.factors.forEach((fB, iB) => {
        const wordsA = fA.toLowerCase().split(/\s+/);
        const wordsB = fB.toLowerCase().split(/\s+/);
        const shared = wordsA.some(w => w.length > 3 && wordsB.includes(w));
        if (shared || (iA === iB && iA < 2)) {
          const posA = factorToPosition(fA, iA, theoryA.factors.length);
          posA.x += offsetAx;
          const posB = factorToPosition(fB, iB, theoryB.factors.length);
          posB.x += offsetBx;
          result.push({ from: posA, to: posB, highlight: activeFactor === fA || activeFactor === fB });
        }
      });
    });
    return result;
  }, [theoryA, theoryB, activeFactor]);

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
            <lineBasicMaterial color={line.highlight ? "#f59e0b" : "#ffffff"} transparent opacity={line.highlight ? 0.6 : 0.08} blending={THREE.AdditiveBlending} />
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
  const prevCollidingRef = useRef(false);

  useEffect(() => {
    if (isColliding && !prevCollidingRef.current) {
      setPhase("approach");
      phaseStartRef.current = 0;
      setActiveFactor(null);
    }
    prevCollidingRef.current = isColliding;
  }, [isColliding]);

  useEffect(() => {
    if (hasResult && (phase === "explode" || phase === "merge")) {
      // Result arrived, stay in merge/unified
    } else if (hasResult && phase === "idle") {
      // Result exists, show unified
      setPhase("unified");
      phaseStartRef.current = 0;
    } else if (!hasResult && !isColliding && phase !== "idle") {
      setPhase("idle");
      phaseStartRef.current = 0;
    }
  }, [hasResult]);

  useFrame(({ clock }) => {
    if (phase === "idle" || phase === "unified") {
      if (phase === "unified") {
        if (phaseStartRef.current === 0) phaseStartRef.current = clock.getElapsedTime();
        setPhaseProgress(Math.min((clock.getElapsedTime() - phaseStartRef.current) / 1, 1));
      }
      return;
    }

    if (phaseStartRef.current === 0) phaseStartRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - phaseStartRef.current;

    if (phase === "approach") {
      setPhaseProgress(Math.min(elapsed / 1.8, 1));
      if (elapsed > 1.8) { setPhase("collide"); phaseStartRef.current = clock.getElapsedTime(); }
    } else if (phase === "collide") {
      setPhaseProgress(Math.min(elapsed / 1.5, 1));
      if (elapsed > 1.5) { setPhase("explode"); phaseStartRef.current = clock.getElapsedTime(); }
    } else if (phase === "explode") {
      setPhaseProgress(Math.min(elapsed / 1.2, 1));
      if (elapsed > 1.2) { setPhase("merge"); phaseStartRef.current = clock.getElapsedTime(); }
    } else if (phase === "merge") {
      setPhaseProgress(Math.min(elapsed / 2, 1));
      if (elapsed > 2.5) { setPhase("unified"); phaseStartRef.current = clock.getElapsedTime(); }
    }
  });

  const showClouds = phase !== "unified";
  const showEffects = phase === "explode";
  const showMerged = phase === "merge" || phase === "unified";
  const showArcs = phase === "idle" && theoryA && theoryB;
  const showEnergyCore = phase === "collide" || phase === "explode" || phase === "merge" || phase === "unified";

  return (
    <>
      <ambientLight intensity={0.3} />
      <Stars radius={50} depth={40} count={1500} factor={3} saturation={0.2} fade speed={0.5} />
      <OrbitControls enablePan={false} enableZoom minDistance={3} maxDistance={12} />

      {theoryA && showClouds && (
        <NebulaCloud
          theory={theoryA}
          side="left"
          phase={phase}
          phaseProgress={phaseProgress}
          activeFactor={activeFactor}
          onFactorHover={setActiveFactor}
          onFactorClick={setActiveFactor}
        />
      )}

      {theoryB && showClouds && (
        <NebulaCloud
          theory={theoryB}
          side="right"
          phase={phase}
          phaseProgress={phaseProgress}
          activeFactor={activeFactor}
          onFactorHover={setActiveFactor}
          onFactorClick={setActiveFactor}
        />
      )}

      {showArcs && (
        <ConnectingArcs theoryA={theoryA!} theoryB={theoryB!} activeFactor={activeFactor} />
      )}

      {showEnergyCore && <EnergyCore progress={phaseProgress} />}

      {showEffects && (
        <>
          <CollisionSparks progress={phaseProgress} />
          <ShockwaveRings progress={phaseProgress} />
        </>
      )}

      {showMerged && theoryA && theoryB && (
        <MergedCloud theoryA={theoryA} theoryB={theoryB} progress={phaseProgress} />
      )}

      {/* Phase label */}
      {phase !== "idle" && (
        <Html position={[0, -2.2, 0]} center>
          <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest animate-pulse">
            {phase === "approach" ? "approaching..." :
             phase === "collide" ? "⚡ colliding..." :
             phase === "explode" ? "💥 impact!" :
             phase === "merge" ? "🌀 merging..." :
             "✨ unified framework"}
          </div>
        </Html>
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
