import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Helpers ───────────────────────────────────────────────
// Map a factor string to pseudo-numeric dimensions for scatter placement
function factorToCoords(factor: string, index: number, total: number): { x: number; y: number; z: number; weight: number } {
  // Hash the factor name for deterministic placement
  let hash = 0;
  for (let i = 0; i < factor.length; i++) hash = ((hash << 5) - hash + factor.charCodeAt(i)) | 0;
  const norm = (v: number) => ((v % 1000) / 1000); // 0..1
  const complexity = norm(Math.abs(hash)) * 2 - 1;        // X axis
  const abstraction = norm(Math.abs(hash >> 8)) * 2 - 1;  // Y axis
  const breadth = norm(Math.abs(hash >> 16)) * 2 - 1;     // Z axis
  const weight = 0.5 + norm(Math.abs(hash >> 4)) * 0.8;   // size weight 0.5..1.3
  return { x: complexity, y: abstraction, z: breadth, weight };
}

type Phase = "idle" | "approach" | "explode" | "merge";

// ─── 3D Axes with labels ───────────────────────────────────
function Axes() {
  const axisLength = 2.8;
  const labelOffset = 0.35;
  const axes: { dir: [number, number, number]; label: string; color: string }[] = [
    { dir: [1, 0, 0], label: "Complexity", color: "#64748b" },
    { dir: [0, 1, 0], label: "Abstraction", color: "#64748b" },
    { dir: [0, 0, 1], label: "Domain Breadth", color: "#64748b" },
  ];

  return (
    <group>
      {axes.map(({ dir, label, color }) => {
        const end: [number, number, number] = [dir[0] * axisLength, dir[1] * axisLength, dir[2] * axisLength];
        const negEnd: [number, number, number] = [-dir[0] * axisLength, -dir[1] * axisLength, -dir[2] * axisLength];
        const labelPos: [number, number, number] = [
          dir[0] * (axisLength + labelOffset),
          dir[1] * (axisLength + labelOffset),
          dir[2] * (axisLength + labelOffset),
        ];
        return (
          <group key={label}>
            <Line points={[negEnd, end]} color={color} lineWidth={1} transparent opacity={0.3} />
            {/* Tick marks */}
            {[-2, -1, 1, 2].map(v => {
              const pos: [number, number, number] = [dir[0] * v, dir[1] * v, dir[2] * v];
              return (
                <mesh key={v} position={pos}>
                  <sphereGeometry args={[0.02, 6, 6]} />
                  <meshBasicMaterial color={color} transparent opacity={0.4} />
                </mesh>
              );
            })}
            <Text position={labelPos} fontSize={0.15} color={color} anchorX="center" anchorY="middle">
              {label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// ─── Factor Dot (single interactive dot) ───────────────────
function FactorDot({
  position,
  color,
  size,
  factor,
  opacity,
  highlighted,
  onHover,
  onClick,
  phase,
  targetPosition,
}: {
  position: [number, number, number];
  color: string;
  size: number;
  factor: string;
  opacity: number;
  highlighted: boolean;
  onHover: (factor: string | null) => void;
  onClick: (factor: string) => void;
  phase: Phase;
  targetPosition: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...position));
  const glowIntensity = highlighted ? 2.0 : 0.6;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    let target: THREE.Vector3;
    if (phase === "idle") {
      target = new THREE.Vector3(
        position[0] + Math.sin(t * 0.5 + size * 10) * 0.08,
        position[1] + Math.cos(t * 0.4 + size * 7) * 0.08,
        position[2] + Math.sin(t * 0.3 + size * 5) * 0.06,
      );
    } else if (phase === "approach") {
      target = new THREE.Vector3(...targetPosition).multiplyScalar(0.4);
    } else if (phase === "explode") {
      target = new THREE.Vector3(...position).multiplyScalar(2.5);
    } else {
      // merge
      target = new THREE.Vector3(
        targetPosition[0] * 0.15 + Math.sin(t * 2 + size * 10) * 0.15,
        targetPosition[1] * 0.15 + Math.cos(t * 2 + size * 7) * 0.15,
        targetPosition[2] * 0.15,
      );
    }

    currentPos.current.lerp(target, 0.04);
    meshRef.current.position.copy(currentPos.current);

    const pulseScale = highlighted ? size * (1.2 + Math.sin(t * 4) * 0.15) : size;
    meshRef.current.scale.setScalar(pulseScale);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={(e) => { e.stopPropagation(); onHover(factor); }}
      onPointerLeave={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onClick(factor); }}
    >
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glowIntensity}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

// ─── Tooltip overlay (HTML in 3D) ──────────────────────────
function Tooltip3D({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div className="bg-background/90 border border-border rounded-md px-2.5 py-1.5 shadow-lg backdrop-blur-sm whitespace-nowrap">
        <p className="text-[11px] font-medium text-foreground">{text}</p>
      </div>
    </Html>
  );
}

// ─── Connecting arcs between theory dots ───────────────────
function ConnectingArcs({
  dotsA,
  dotsB,
  highlightedFactor,
  phase,
}: {
  dotsA: { pos: [number, number, number]; factor: string }[];
  dotsB: { pos: [number, number, number]; factor: string }[];
  highlightedFactor: string | null;
  phase: Phase;
}) {
  // Create connections: pair each dot in A with the closest dot in B
  const connections = useMemo(() => {
    if (dotsA.length === 0 || dotsB.length === 0) return [];
    const conns: { from: [number, number, number]; to: [number, number, number]; factorA: string; factorB: string }[] = [];
    const usedB = new Set<number>();
    for (const a of dotsA) {
      let bestDist = Infinity;
      let bestIdx = 0;
      for (let j = 0; j < dotsB.length; j++) {
        if (usedB.has(j)) continue;
        const dx = a.pos[0] - dotsB[j].pos[0];
        const dy = a.pos[1] - dotsB[j].pos[1];
        const dz = a.pos[2] - dotsB[j].pos[2];
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) { bestDist = dist; bestIdx = j; }
      }
      usedB.add(bestIdx);
      if (dotsB[bestIdx]) {
        conns.push({ from: a.pos, to: dotsB[bestIdx].pos, factorA: a.factor, factorB: dotsB[bestIdx].factor });
      }
    }
    return conns;
  }, [dotsA, dotsB]);

  if (phase === "explode" || connections.length === 0) return null;

  return (
    <group>
      {connections.map((c, i) => {
        const isHighlighted = highlightedFactor && (c.factorA === highlightedFactor || c.factorB === highlightedFactor);
        // Create a curved arc via midpoint
        const mid: [number, number, number] = [
          (c.from[0] + c.to[0]) / 2,
          (c.from[1] + c.to[1]) / 2 + 0.6,
          (c.from[2] + c.to[2]) / 2,
        ];
        return (
          <Line
            key={i}
            points={[c.from, mid, c.to]}
            color={isHighlighted ? "#f59e0b" : "#6366f1"}
            lineWidth={isHighlighted ? 2 : 0.8}
            transparent
            opacity={isHighlighted ? 0.9 : (phase === "merge" ? 0.4 : 0.15)}
          />
        );
      })}
    </group>
  );
}

// ─── Ambient particles (background filler) ─────────────────
function AmbientParticles({ count, color, center, phase }: { count: number; color: string; center: [number, number, number]; phase: Phase }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 1.0 + Math.random() * 0.8;
      p.push([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)]);
    }
    return p;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const bp = positions[i];
      let x = bp[0] + Math.sin(t * 0.3 + i) * 0.1;
      let y = bp[1] + Math.cos(t * 0.25 + i) * 0.1;
      let z = bp[2];

      if (phase === "approach") {
        x *= 0.5; y *= 0.5; z *= 0.5;
      } else if (phase === "merge") {
        x *= 0.2; y *= 0.2; z *= 0.2;
      }

      dummy.position.set(x + center[0], y + center[1], z + center[2]);
      dummy.scale.setScalar(0.025);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.35} />
    </instancedMesh>
  );
}

// ─── Main scene ────────────────────────────────────────────
function Scene({
  theoryA,
  theoryB,
  phase,
  hoveredFactor,
  setHoveredFactor,
  clickedFactor,
  setClickedFactor,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  phase: Phase;
  hoveredFactor: string | null;
  setHoveredFactor: (f: string | null) => void;
  clickedFactor: string | null;
  setClickedFactor: (f: string) => void;
}) {
  const offsetA: [number, number, number] = phase === "idle" ? [-2.2, 0, 0] : [-0.8, 0, 0];
  const offsetB: [number, number, number] = phase === "idle" ? [2.2, 0, 0] : [0.8, 0, 0];

  const activeFactor = clickedFactor || hoveredFactor;

  // Build factor dot data
  const dotsA = useMemo(() => {
    if (!theoryA) return [];
    return theoryA.factors.map((f, i) => {
      const c = factorToCoords(f, i, theoryA.factors.length);
      const pos: [number, number, number] = [c.x * 1.5 + offsetA[0], c.y * 1.5 + offsetA[1], c.z * 1.5 + offsetA[2]];
      return { pos, factor: f, weight: c.weight };
    });
  }, [theoryA, offsetA[0]]);

  const dotsB = useMemo(() => {
    if (!theoryB) return [];
    return theoryB.factors.map((f, i) => {
      const c = factorToCoords(f, i, theoryB.factors.length);
      const pos: [number, number, number] = [c.x * 1.5 + offsetB[0], c.y * 1.5 + offsetB[1], c.z * 1.5 + offsetB[2]];
      return { pos, factor: f, weight: c.weight };
    });
  }, [theoryB, offsetB[0]]);

  // Tooltip position for hovered dot
  const tooltipDot = useMemo(() => {
    if (!activeFactor) return null;
    const allDots = [...dotsA, ...dotsB];
    return allDots.find(d => d.factor === activeFactor) ?? null;
  }, [activeFactor, dotsA, dotsB]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#6366f1" />

      <Axes />

      {/* Theory A: blue factor dots + ambient particles */}
      {theoryA && (
        <>
          <AmbientParticles count={theoryA.factors.length * 8 + 15} color="#3b82f6" center={offsetA} phase={phase} />
          
          <TheoryLabel text={theoryA.name} position={[offsetA[0], 2.3, 0]} color="#60a5fa" />
          {dotsA.map((d, i) => (
            <FactorDot
              key={`a-${i}`}
              position={d.pos}
              targetPosition={d.pos}
              color="#3b82f6"
              size={0.06 + d.weight * 0.08}
              factor={d.factor}
              opacity={0.7 + d.weight * 0.3}
              highlighted={activeFactor === d.factor}
              onHover={setHoveredFactor}
              onClick={setClickedFactor}
              phase={phase}
            />
          ))}
        </>
      )}

      {/* Theory B: red factor dots + ambient particles */}
      {theoryB && (
        <>
          <AmbientParticles count={theoryB.factors.length * 8 + 15} color="#ef4444" center={offsetB} phase={phase} />
          <WireframeSphere center={offsetB} color="#ef4444" />
          <TheoryLabel text={theoryB.name} position={[offsetB[0], 2.3, 0]} color="#f87171" />
          {dotsB.map((d, i) => (
            <FactorDot
              key={`b-${i}`}
              position={d.pos}
              targetPosition={d.pos}
              color="#ef4444"
              size={0.06 + d.weight * 0.08}
              factor={d.factor}
              opacity={0.7 + d.weight * 0.3}
              highlighted={activeFactor === d.factor}
              onHover={setHoveredFactor}
              onClick={setClickedFactor}
              phase={phase}
            />
          ))}
        </>
      )}

      {/* Connecting arcs */}
      {theoryA && theoryB && (
        <ConnectingArcs dotsA={dotsA} dotsB={dotsB} highlightedFactor={activeFactor} phase={phase} />
      )}

      {/* Tooltip */}
      {activeFactor && tooltipDot && (
        <Tooltip3D text={activeFactor} position={[tooltipDot.pos[0], tooltipDot.pos[1] + 0.3, tooltipDot.pos[2]]} />
      )}

      {/* Merge glow */}
      {phase === "merge" && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.5} transparent opacity={0.25} />
        </mesh>
      )}

      <OrbitControls enablePan={false} enableZoom minDistance={4} maxDistance={12} autoRotate autoRotateSpeed={0.4} />
    </>
  );
}

// ─── Wireframe sphere outline ──────────────────────────────
function WireframeSphere({ center, color }: { center: [number, number, number]; color: string }) {
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
      <meshBasicMaterial color={color} wireframe transparent opacity={0.1} />
    </mesh>
  );
}

// ─── Floating theory label ─────────────────────────────────
function TheoryLabel({ text, position, color }: { text: string; position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <Text fontSize={0.2} color={color} anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="#000000">
        {text}
      </Text>
    </group>
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
      <Canvas camera={{ position: [0, 2, 7], fov: 50 }} style={{ background: "transparent" }}>
        <Scene
          theoryA={theoryA}
          theoryB={theoryB}
          phase={phase}
          hoveredFactor={hoveredFactor}
          setHoveredFactor={setHoveredFactor}
          clickedFactor={clickedFactor}
          setClickedFactor={handleClickFactor}
        />
      </Canvas>

      {/* Legend + axis key overlay */}
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
      <div className="absolute top-3 right-3 pointer-events-none text-[9px] text-muted-foreground/50 text-right leading-relaxed">
        <p>X: Complexity</p>
        <p>Y: Abstraction</p>
        <p>Z: Domain Breadth</p>
        <p className="mt-1 text-muted-foreground/30">Dot size = importance weight</p>
      </div>
    </div>
  );
}
