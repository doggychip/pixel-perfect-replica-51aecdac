import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

type Phase = "idle" | "approach" | "explode" | "merge";

// ─── Nebula Cloud ──────────────────────────────────────────
// A dense instanced-mesh cloud of particles forming a nebula around a center
function NebulaCloud({
  center, color, count, phase, factors, activeFactor,
  onHover, onClick,
}: {
  center: [number, number, number]; color: string; count: number;
  phase: Phase; factors: string[]; activeFactor: string | null;
  onHover: (f: string | null) => void; onClick: (f: string) => void;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate particle seeds — clustered around factor positions
  const particles = useMemo(() => {
    const pts: { x: number; y: number; z: number; speed: number; offset: number; size: number; factorIdx: number }[] = [];
    const factorPositions = factors.map((f, i) => {
      let hash = 0;
      for (let c = 0; c < f.length; c++) hash = ((hash << 5) - hash + f.charCodeAt(c)) | 0;
      const norm = (v: number) => ((Math.abs(v) % 1000) / 1000) * 2 - 1;
      return { x: norm(hash) * 1.2, y: norm(hash >> 8) * 1.2, z: norm(hash >> 16) * 1.2 };
    });

    // Core factor particles (larger, brighter)
    factorPositions.forEach((fp, fi) => {
      pts.push({ x: fp.x, y: fp.y, z: fp.z, speed: 0.3 + Math.random() * 0.3, offset: Math.random() * Math.PI * 2, size: 0.06 + Math.random() * 0.03, factorIdx: fi });
    });

    // Surrounding nebula particles clustered near factors
    const nebulaCount = count - factors.length;
    for (let i = 0; i < nebulaCount; i++) {
      const fi = Math.floor(Math.random() * factorPositions.length);
      const fp = factorPositions[fi];
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 0.1 + Math.random() * 0.6; // cluster radius
      pts.push({
        x: fp.x + r * Math.sin(phi) * Math.cos(theta),
        y: fp.y + r * Math.sin(phi) * Math.sin(theta),
        z: fp.z + r * Math.cos(phi),
        speed: 0.2 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        size: 0.01 + Math.random() * 0.025,
        factorIdx: fi,
      });
    }
    return pts;
  }, [factors, count]);

  // Color variations
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const highlightColor = useMemo(() => new THREE.Color("#f59e0b"), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let cx = center[0], cy = center[1], cz = center[2];

      // Phase offsets
      let spread = 1;
      if (phase === "approach") { cx *= 0.4; cy *= 0.4; cz *= 0.4; spread = 0.7; }
      else if (phase === "explode") { spread = 2.5; }
      else if (phase === "merge") { cx *= 0.15; cy *= 0.15; cz *= 0.15; spread = 0.4; }

      // Gentle organic motion
      const sx = Math.sin(t * p.speed + p.offset) * 0.08;
      const sy = Math.cos(t * p.speed * 0.7 + p.offset * 1.3) * 0.08;
      const sz = Math.sin(t * p.speed * 0.5 + p.offset * 0.7) * 0.05;

      dummy.position.set(
        p.x * spread + cx + sx,
        p.y * spread + cy + sy,
        p.z * spread + cz + sz,
      );

      // Breathing size
      const breathe = 1 + Math.sin(t * 1.5 + i * 0.3) * 0.2;
      dummy.scale.setScalar(p.size * breathe);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color — highlight active factor's particles
      const isActive = activeFactor !== null && factors[p.factorIdx] === activeFactor;
      const c = isActive ? highlightColor : baseColor;
      meshRef.current.setColorAt(i, c);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  // Hit-test spheres for factor particles (first N = factors.length)
  return (
    <group>
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={0.8}
          transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Invisible hit-test spheres for each factor */}
      {factors.map((f, i) => {
        const p = particles[i]; // first N particles are the factor cores
        if (!p) return null;
        return (
          <mesh key={f} position={[p.x + center[0], p.y + center[1], p.z + center[2]]} visible={false}
            onPointerEnter={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; onHover(f); }}
            onPointerLeave={(e) => { e.stopPropagation(); document.body.style.cursor = "auto"; onHover(null); }}
            onClick={(e) => { e.stopPropagation(); onClick(f); }}
          >
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Tooltip ───────────────────────────────────────────────
function Tooltip3D({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div className="bg-background/90 border border-border rounded-md px-2.5 py-1.5 shadow-lg backdrop-blur-sm whitespace-nowrap">
        <p className="text-[11px] font-medium text-foreground">{text}</p>
      </div>
    </Html>
  );
}

// ─── Connecting Arcs ───────────────────────────────────────
function ConnectingArcs({ factorsA, factorsB, centerA, centerB, activeFactor, phase }: {
  factorsA: string[]; factorsB: string[];
  centerA: [number, number, number]; centerB: [number, number, number];
  activeFactor: string | null; phase: Phase;
}) {
  const connections = useMemo(() => {
    const hash = (s: string) => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      return h;
    };
    const norm = (v: number) => ((Math.abs(v) % 1000) / 1000) * 2 - 1;
    const getPos = (f: string, center: [number, number, number]): [number, number, number] => {
      const h = hash(f);
      return [norm(h) * 1.2 + center[0], norm(h >> 8) * 1.2 + center[1], norm(h >> 16) * 1.2 + center[2]];
    };

    const conns: { from: [number, number, number]; to: [number, number, number]; fA: string; fB: string }[] = [];
    const usedB = new Set<number>();
    for (const fA of factorsA) {
      const posA = getPos(fA, centerA);
      let bestDist = Infinity, bestIdx = 0;
      for (let j = 0; j < factorsB.length; j++) {
        if (usedB.has(j)) continue;
        const posB = getPos(factorsB[j], centerB);
        const d = (posA[0] - posB[0]) ** 2 + (posA[1] - posB[1]) ** 2 + (posA[2] - posB[2]) ** 2;
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      usedB.add(bestIdx);
      conns.push({ from: posA, to: getPos(factorsB[bestIdx], centerB), fA, fB: factorsB[bestIdx] });
    }
    return conns;
  }, [factorsA, factorsB, centerA, centerB]);

  if (phase === "explode" || connections.length === 0) return null;

  return (
    <group>
      {connections.map((c, i) => {
        const isHl = activeFactor && (c.fA === activeFactor || c.fB === activeFactor);
        const mid: [number, number, number] = [(c.from[0] + c.to[0]) / 2, (c.from[1] + c.to[1]) / 2 + 0.5, (c.from[2] + c.to[2]) / 2];
        return (
          <Line key={i} points={[c.from, mid, c.to]}
            color={isHl ? "#f59e0b" : "#6366f1"}
            lineWidth={isHl ? 2.5 : 0.8}
            transparent opacity={isHl ? 0.9 : (phase === "merge" ? 0.35 : 0.12)}
          />
        );
      })}
    </group>
  );
}

// ─── Theory Label ──────────────────────────────────────────
function TheoryLabel({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8) * 0.08;
  });
  return (
    <group ref={ref} position={position}>
      <Text fontSize={0.18} color={color} anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000000">
        {text}
      </Text>
    </group>
  );
}

// ─── Collision Fireworks ───────────────────────────────────
function CollisionFireworks({ active }: { active: boolean }) {
  const COUNT = 80;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() =>
    Array.from({ length: COUNT }, () => {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      return {
        dir: new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(speed),
        pos: new THREE.Vector3(), life: 0, maxLife: 1 + Math.random() * 1.5, colorMix: Math.random(),
      };
    }), []);

  const cA = useMemo(() => new THREE.Color("#3b82f6"), []);
  const cB = useMemo(() => new THREE.Color("#a855f7"), []);
  const cC = useMemo(() => new THREE.Color("#ef4444"), []);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (active && !wasActive.current) { particles.forEach(p => { p.pos.set(0, 0, 0); p.life = 0; }); wasActive.current = true; }
    if (!active) wasActive.current = false;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      if (active || p.life < p.maxLife) {
        p.life += delta; p.pos.addScaledVector(p.dir, delta * 0.8); p.pos.y -= delta * 0.3;
        const fade = Math.max(0, 1 - p.life / p.maxLife);
        dummy.position.copy(p.pos); dummy.scale.setScalar(0.04 * fade); dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        const c = new THREE.Color();
        if (p.colorMix < 0.5) c.lerpColors(cA, cB, p.colorMix * 2); else c.lerpColors(cB, cC, (p.colorMix - 0.5) * 2);
        meshRef.current.setColorAt(i, c);
      } else { dummy.scale.setScalar(0); dummy.updateMatrix(); meshRef.current.setMatrixAt(i, dummy.matrix); }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.5} transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

// ─── Scene ─────────────────────────────────────────────────
function Scene({
  theoryA, theoryB, phase, hoveredFactor, setHoveredFactor, clickedFactor, setClickedFactor,
}: {
  theoryA: CollisionTheory | null; theoryB: CollisionTheory | null; phase: Phase;
  hoveredFactor: string | null; setHoveredFactor: (f: string | null) => void;
  clickedFactor: string | null; setClickedFactor: (f: string) => void;
}) {
  const offsetA: [number, number, number] = phase === "idle" ? [-2.2, 0, 0] : [-0.8, 0, 0];
  const offsetB: [number, number, number] = phase === "idle" ? [2.2, 0, 0] : [0.8, 0, 0];
  const activeFactor = clickedFactor || hoveredFactor;

  // Compute particle count per theory (~200-300 per cloud)
  const countA = theoryA ? Math.max(200, theoryA.factors.length * 40) : 0;
  const countB = theoryB ? Math.max(200, theoryB.factors.length * 40) : 0;

  // Tooltip position
  const tooltipInfo = useMemo(() => {
    if (!activeFactor) return null;
    const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return h; };
    const norm = (v: number) => ((Math.abs(v) % 1000) / 1000) * 2 - 1;

    // Check theory A factors
    if (theoryA?.factors.includes(activeFactor)) {
      const h = hash(activeFactor);
      return { text: activeFactor, pos: [norm(h) * 1.2 + offsetA[0], norm(h >> 8) * 1.2 + offsetA[1] + 0.35, norm(h >> 16) * 1.2 + offsetA[2]] as [number, number, number] };
    }
    if (theoryB?.factors.includes(activeFactor)) {
      const h = hash(activeFactor);
      return { text: activeFactor, pos: [norm(h) * 1.2 + offsetB[0], norm(h >> 8) * 1.2 + offsetB[1] + 0.35, norm(h >> 16) * 1.2 + offsetB[2]] as [number, number, number] };
    }
    return null;
  }, [activeFactor, theoryA, theoryB, offsetA, offsetB]);

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#6366f1" />

      <Stars radius={60} depth={50} count={2000} factor={3} saturation={0.1} fade speed={0.3} />

      {/* Theory A — Blue Nebula */}
      {theoryA && (
        <>
          <TheoryLabel text={theoryA.name} position={[offsetA[0], 2.0, 0]} color="#60a5fa" />
          <NebulaCloud center={offsetA} color="#3b82f6" count={countA} phase={phase}
            factors={theoryA.factors} activeFactor={activeFactor}
            onHover={setHoveredFactor} onClick={setClickedFactor}
          />
        </>
      )}

      {/* Theory B — Red Nebula */}
      {theoryB && (
        <>
          <TheoryLabel text={theoryB.name} position={[offsetB[0], 2.0, 0]} color="#f87171" />
          <NebulaCloud center={offsetB} color="#ef4444" count={countB} phase={phase}
            factors={theoryB.factors} activeFactor={activeFactor}
            onHover={setHoveredFactor} onClick={setClickedFactor}
          />
        </>
      )}

      {/* Connecting arcs */}
      {theoryA && theoryB && (
        <ConnectingArcs
          factorsA={theoryA.factors} factorsB={theoryB.factors}
          centerA={offsetA} centerB={offsetB}
          activeFactor={activeFactor} phase={phase}
        />
      )}

      {/* Tooltip */}
      {tooltipInfo && <Tooltip3D text={tooltipInfo.text} position={tooltipInfo.pos} />}

      {/* Merge glow */}
      {phase === "merge" && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={2} transparent opacity={0.2} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      <CollisionFireworks active={phase === "explode"} />

      <OrbitControls enablePan={false} enableZoom minDistance={4} maxDistance={12} autoRotate autoRotateSpeed={0.3} />
    </>
  );
}

// ─── Exported Wrapper ──────────────────────────────────────
export default function TheoryParticles3D({
  theoryA, theoryB, isColliding,
}: {
  theoryA: CollisionTheory | null; theoryB: CollisionTheory | null; isColliding: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);
  const [clickedFactor, setClickedFactor] = useState<string | null>(null);

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

  const handleClickFactor = useCallback((f: string) => {
    setClickedFactor(prev => prev === f ? null : f);
  }, []);

  if (!theoryA && !theoryB) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border border-border/30 flex items-center justify-center mx-auto mb-3">
            <div className="w-3 h-3 rounded-full bg-muted-foreground/20" />
          </div>
          <p className="text-xs text-muted-foreground/40">Select theories to see particle visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden bg-black/30 border border-border/30 relative">
      <Canvas camera={{ position: [0, 1.5, 6], fov: 50 }} style={{ background: "transparent" }}>
        <Scene
          theoryA={theoryA} theoryB={theoryB} phase={phase}
          hoveredFactor={hoveredFactor} setHoveredFactor={setHoveredFactor}
          clickedFactor={clickedFactor} setClickedFactor={handleClickFactor}
        />
      </Canvas>

      {/* Legend */}
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
