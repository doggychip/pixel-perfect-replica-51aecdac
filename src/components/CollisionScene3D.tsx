import { useRef, useMemo, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Billboard, Text, OrbitControls, Stars, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Axes: Complexity / Abstraction / Domain Breadth ─────────
const AXIS_LENGTH = 4.5;
const AXIS_COLOR = "#334155";
const LABEL_COLOR = "#64748b";

function Axes() {
  return (
    <group>
      {/* X axis — Complexity */}
      <Line points={[[-AXIS_LENGTH, 0, 0], [AXIS_LENGTH, 0, 0]]} color={AXIS_COLOR} lineWidth={1} transparent opacity={0.4} />
      <Billboard position={[AXIS_LENGTH + 0.4, 0, 0]}>
        <Text fontSize={0.18} color={LABEL_COLOR} anchorX="left">Complexity →</Text>
      </Billboard>
      {/* Y axis — Abstraction */}
      <Line points={[[0, -AXIS_LENGTH, 0], [0, AXIS_LENGTH, 0]]} color={AXIS_COLOR} lineWidth={1} transparent opacity={0.4} />
      <Billboard position={[0, AXIS_LENGTH + 0.3, 0]}>
        <Text fontSize={0.18} color={LABEL_COLOR} anchorY="bottom">Abstraction ↑</Text>
      </Billboard>
      {/* Z axis — Domain Breadth (subtle) */}
      <Line points={[[0, 0, -AXIS_LENGTH * 0.6], [0, 0, AXIS_LENGTH * 0.6]]} color={AXIS_COLOR} lineWidth={1} transparent opacity={0.25} />
      <Billboard position={[0, 0, AXIS_LENGTH * 0.6 + 0.4]}>
        <Text fontSize={0.14} color={LABEL_COLOR}>Breadth</Text>
      </Billboard>
      {/* Tick marks on X & Y */}
      {[-3, -1.5, 1.5, 3].map(v => (
        <group key={`tx${v}`}>
          <Line points={[[v, -0.08, 0], [v, 0.08, 0]]} color={AXIS_COLOR} lineWidth={1} transparent opacity={0.3} />
        </group>
      ))}
      {[-3, -1.5, 1.5, 3].map(v => (
        <group key={`ty${v}`}>
          <Line points={[[-0.08, v, 0], [0.08, v, 0]]} color={AXIS_COLOR} lineWidth={1} transparent opacity={0.3} />
        </group>
      ))}
    </group>
  );
}

// ─── Deterministic factor positioning ────────────────────────
// Each factor gets a stable position based on its name hash, mapped to axes
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function factorToPosition(factor: string, offset: [number, number, number], spread: number): THREE.Vector3 {
  const h = hashStr(factor);
  const complexity = ((h % 1000) / 500 - 1) * spread;       // X
  const abstraction = (((h >> 10) % 1000) / 500 - 1) * spread; // Y
  const breadth = (((h >> 20) % 1000) / 500 - 1) * spread * 0.5; // Z
  return new THREE.Vector3(
    complexity + offset[0],
    abstraction + offset[1],
    breadth + offset[2],
  );
}

// ─── Importance weight from factor name ──────────────────────
function factorImportance(factor: string): number {
  const h = hashStr(factor);
  return 0.4 + (h % 60) / 100; // 0.4 to 1.0
}

// ─── Factor Dot (with hover tooltip, size encoding) ──────────
function FactorDot({
  factor,
  position,
  color,
  importance,
  visible,
  highlighted,
  dimmed,
  onSelect,
  theoryKey,
  factorIndex,
}: {
  factor: string;
  position: THREE.Vector3;
  color: string;
  importance: number;
  visible: boolean;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (key: string, idx: number) => void;
  theoryKey: "A" | "B";
  factorIndex: number;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const baseSize = 0.06 + importance * 0.12;
  const active = highlighted || hovered;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = active ? 1.6 : 1 + Math.sin(t * 2 + hashStr(factor)) * 0.05;
    meshRef.current.scale.setScalar(pulse);
  });

  if (!visible) return null;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(theoryKey, factorIndex); }}
      >
        <sphereGeometry args={[baseSize, 12, 8]} />
        <meshBasicMaterial
          color={highlighted ? "#facc15" : color}
          transparent
          opacity={dimmed ? 0.12 : (0.3 + importance * 0.6)}
        />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[baseSize * 1.2, baseSize * 1.5, 16]} />
        <meshBasicMaterial color={highlighted ? "#facc15" : color} transparent opacity={active ? 0.5 : dimmed ? 0.02 : 0.08} side={THREE.DoubleSide} />
      </mesh>
      {/* Highlight outer ring */}
      {highlighted && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 1.8, baseSize * 2.2, 24]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Tooltip on hover or highlight */}
      {(hovered || highlighted) && (
        <Html distanceFactor={8} center style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: `1px solid ${highlighted ? "#facc15" : color}40`,
            borderRadius: 6,
            padding: "4px 10px",
            whiteSpace: "nowrap",
            fontSize: 11,
            color: "#e2e8f0",
            boxShadow: `0 0 12px ${highlighted ? "#facc15" : color}30`,
          }}>
            <span style={{ color: highlighted ? "#facc15" : color, fontWeight: 600 }}>{factor}</span>
            <span style={{ color: "#94a3b8", marginLeft: 6, fontSize: 10 }}>
              w={importance.toFixed(2)}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Connecting Lines between shared/related concepts ────────
function ConnectingLines({
  theoryA,
  theoryB,
  positionsA,
  positionsB,
  phase,
  phaseTime,
  highlightedFactor,
  connections,
}: {
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  positionsA: THREE.Vector3[];
  positionsB: THREE.Vector3[];
  phase: string;
  phaseTime: number;
  highlightedFactor: { key: string; idx: number } | null;
  connections: { fromIdx: number; toIdx: number; strength: number }[];
}) {
  const showLines = phase === "idle" || phase === "approach";
  const mergeShow = phase === "merge" && phaseTime > 1.0;
  if (!showLines && !mergeShow) return null;

  const baseOpacity = mergeShow ? Math.min((phaseTime - 1.0) / 1.0, 0.5) : 0.15;

  return (
    <group>
      {connections.map((c, i) => {
        if (!positionsA[c.fromIdx] || !positionsB[c.toIdx]) return null;
        const from = positionsA[c.fromIdx];
        const to = positionsB[c.toIdx];
        const mid = new THREE.Vector3(
          (from.x + to.x) / 2,
          (from.y + to.y) / 2 + 0.8,
          (from.z + to.z) / 2,
        );
        const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
        const points = curve.getPoints(16);

        const isHighlighted = highlightedFactor &&
          ((highlightedFactor.key === "A" && highlightedFactor.idx === c.fromIdx) ||
           (highlightedFactor.key === "B" && highlightedFactor.idx === c.toIdx));
        const isDimmed = highlightedFactor && !isHighlighted;

        return (
          <Line
            key={i}
            points={points}
            color={isHighlighted ? "#facc15" : mergeShow ? "#a855f7" : "#94a3b8"}
            lineWidth={isHighlighted ? 3 : 1 + c.strength}
            transparent
            opacity={isDimmed ? 0.03 : isHighlighted ? 0.8 : baseOpacity * c.strength}
          />
        );
      })}
    </group>
  );
}

// ─── Particle Cloud (factor-mapped scatter plot) ─────────────
function ParticleCloud({
  theory,
  position,
  color,
  phase,
  phaseTime,
  onFactorPositions,
  theoryKey,
  highlightedFactor,
  onSelectFactor,
}: {
  theory: CollisionTheory;
  position: [number, number, number];
  color: string;
  phase: "idle" | "approach" | "explode" | "merge";
  phaseTime: number;
  onFactorPositions?: (positions: THREE.Vector3[]) => void;
  theoryKey: "A" | "B";
  highlightedFactor: { key: string; idx: number } | null;
  onSelectFactor: (key: string, idx: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const factorCount = theory.factors.length;
  const spread = 1.8 + factorCount * 0.15;

  // Factor dots: deterministic positions from factor names
  const factorPositions = useMemo(() => {
    return theory.factors.map(f => factorToPosition(f, [0, 0, 0], spread));
  }, [theory.factors, spread]);

  const factorImportances = useMemo(() => theory.factors.map(f => factorImportance(f)), [theory.factors]);

  // Ambient particles (smaller, surround the factor dots)
  const ambientCount = Math.max(20, factorCount * 10);
  const ambientParticles = useMemo(() => {
    const arr: { pos: THREE.Vector3; speed: number; offset: number }[] = [];
    const baseRadius = spread * 0.55;
    for (let i = 0; i < ambientCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = baseRadius * (0.5 + Math.random() * 0.5);
      arr.push({
        pos: new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)),
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [ambientCount, spread]);

  const ambientPositionsAttr = useMemo(() => {
    const arr = new Float32Array(ambientCount * 3);
    ambientParticles.forEach((p, i) => {
      arr[i * 3] = p.pos.x;
      arr[i * 3 + 1] = p.pos.y;
      arr[i * 3 + 2] = p.pos.z;
    });
    return arr;
  }, [ambientParticles, ambientCount]);

  const ambientGeoRef = useRef<THREE.BufferGeometry>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  // Report world positions for connecting lines
  useEffect(() => {
    if (onFactorPositions) {
      const worldPositions = factorPositions.map(fp =>
        new THREE.Vector3(fp.x + position[0], fp.y + position[1], fp.z + position[2])
      );
      onFactorPositions(worldPositions);
    }
  }, [factorPositions, position, onFactorPositions]);

  // Explosion directions
  const explodeDirs = useMemo(() => {
    return ambientParticles.map(() =>
      new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize()
    );
  }, [ambientParticles]);

  useFrame(({ clock }) => {
    if (!ambientGeoRef.current || !groupRef.current) return;
    const t = clock.getElapsedTime();
    const posArr = ambientGeoRef.current.attributes.position.array as Float32Array;

    if (phase === "idle" || phase === "approach") {
      ambientParticles.forEach((p, i) => {
        posArr[i * 3] = p.pos.x + Math.sin(t * p.speed + p.offset) * 0.15;
        posArr[i * 3 + 1] = p.pos.y + Math.cos(t * p.speed * 0.7 + p.offset) * 0.15;
        posArr[i * 3 + 2] = p.pos.z + Math.sin(t * p.speed * 0.4 + p.offset) * 0.1;
      });
      const targetX = phase === "approach"
        ? (position[0] > 0 ? position[0] - 2 : position[0] + 2)
        : position[0];
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.05;
    } else if (phase === "explode") {
      const progress = Math.min(phaseTime / 1.2, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const explosionR = 4 + factorCount * 0.4;
      ambientParticles.forEach((p, i) => {
        const dir = explodeDirs[i];
        posArr[i * 3] = dir.x * explosionR * eased + Math.sin(t * 3 + p.offset) * 0.05;
        posArr[i * 3 + 1] = dir.y * explosionR * eased;
        posArr[i * 3 + 2] = dir.z * explosionR * eased;
      });
      groupRef.current.position.x += (0 - groupRef.current.position.x) * 0.1;
    } else if (phase === "merge") {
      const progress = Math.min(phaseTime / 1.8, 1);
      const eased = progress * progress * (3 - 2 * progress);
      const explosionR = 4 + factorCount * 0.4;
      ambientParticles.forEach((p, i) => {
        const dir = explodeDirs[i];
        const angle = t * 0.5 + p.offset;
        const targetR = 1 + Math.sin(p.offset) * 0.4;
        const tx = Math.cos(angle) * targetR;
        const ty = Math.sin(angle * 0.7) * targetR;
        const tz = Math.sin(angle * 1.3) * targetR * 0.4;
        posArr[i * 3] = dir.x * explosionR * (1 - eased) + tx * eased;
        posArr[i * 3 + 1] = dir.y * explosionR * (1 - eased) + ty * eased;
        posArr[i * 3 + 2] = dir.z * explosionR * (1 - eased) + tz * eased;
      });
      groupRef.current.position.x += (0 - groupRef.current.position.x) * 0.08;
    }
    ambientGeoRef.current.attributes.position.needsUpdate = true;
  });

  const sphereRadius = spread * 0.6;
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!sphereRef.current) return;
    const t = clock.getElapsedTime();
    sphereRef.current.rotation.y = t * 0.12;
    sphereRef.current.rotation.x = Math.sin(t * 0.08) * 0.15;
    const show = phase === "idle" || phase === "approach";
    (sphereRef.current.material as THREE.MeshBasicMaterial).opacity = show ? 0.06 + Math.sin(t * 2) * 0.03 : 0;
  });

  const showDots = phase === "idle" || phase === "approach";

  return (
    <group ref={groupRef} position={position}>
      {/* Wireframe sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[sphereRadius * 1.05, 20, 14]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.06} />
      </mesh>
      {/* Ambient particles */}
      <points>
        <bufferGeometry ref={ambientGeoRef}>
          <bufferAttribute attach="attributes-position" args={[ambientPositionsAttr, 3]} count={ambientCount} />
        </bufferGeometry>
        <pointsMaterial color={threeColor} size={0.06} sizeAttenuation transparent opacity={0.5} />
      </points>
      {/* Factor dots with hover tooltips */}
      {theory.factors.map((f, i) => (
        <FactorDot
          key={f}
          factor={f}
          position={factorPositions[i]}
          color={color}
          importance={factorImportances[i]}
          visible={showDots}
        />
      ))}
      {/* Theory label */}
      {showDots && (
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <Text fontSize={0.3} color={color} anchorX="center" anchorY="bottom" position={[0, sphereRadius + 0.5, 0]} outlineWidth={0.02} outlineColor="#000000">
            {theory.name}
          </Text>
          {theory.nameCn && (
            <Text fontSize={0.18} color={color} anchorX="center" anchorY="top" position={[0, sphereRadius + 0.35, 0]} outlineWidth={0.015} outlineColor="#000000">
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
  if (!visible) return null;
  return (
    <Billboard follow lockX={false} lockY={false} lockZ={false}>
      <Text fontSize={0.28} color="#a855f7" anchorX="center" anchorY="bottom" position={[0, 2.5, 0]} outlineWidth={0.02} outlineColor="#000000">
        Synthesized Framework
      </Text>
      <Text fontSize={0.18} color="#c084fc" anchorX="center" anchorY="top" position={[0, 2.35, 0]} outlineWidth={0.015} outlineColor="#000000">
        合成框架
      </Text>
    </Billboard>
  );
}

// ─── Collision Flash & Shockwave ─────────────────────────────
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
  const [positionsA, setPositionsA] = useState<THREE.Vector3[]>([]);
  const [positionsB, setPositionsB] = useState<THREE.Vector3[]>([]);

  useEffect(() => {
    if (colliding && !collidingRef.current) {
      collidingRef.current = true;
      setPhase("approach");
      phaseStartRef.current = performance.now();
    }
    if (!colliding && collidingRef.current) {
      collidingRef.current = false;
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

  const handlePositionsA = useCallback((p: THREE.Vector3[]) => setPositionsA(p), []);
  const handlePositionsB = useCallback((p: THREE.Vector3[]) => setPositionsB(p), []);

  const colorA = "#3b82f6";
  const colorB = "#ef4444";

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.6} />
      <Stars radius={40} depth={25} count={400} factor={2} fade speed={1} />
      <OrbitControls enablePan={false} maxDistance={14} minDistance={4} />
      <Axes />
      {theoryA && (
        <ParticleCloud theory={theoryA} position={[-3, 0, 0]} color={colorA} phase={phase} phaseTime={phaseTime} onFactorPositions={handlePositionsA} />
      )}
      {theoryB && (
        <ParticleCloud theory={theoryB} position={[3, 0, 0]} color={colorB} phase={phase} phaseTime={phaseTime} onFactorPositions={handlePositionsB} />
      )}
      {theoryA && theoryB && positionsA.length > 0 && positionsB.length > 0 && (
        <ConnectingLines
          theoryA={theoryA}
          theoryB={theoryB}
          positionsA={positionsA}
          positionsB={positionsB}
          phase={phase}
          phaseTime={phaseTime}
        />
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
  resultInsight,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  colliding: boolean;
  className?: string;
  resultInsight?: string;
}) {
  return (
    <div className={className ?? "w-full h-64 rounded-lg overflow-hidden border border-border/50 bg-[hsl(225,50%,4%)]"}>
      <div className="relative w-full h-full">
        <Canvas camera={{ position: [0, 1, 9], fov: 50 }}>
          <Suspense fallback={null}>
            <ColliderScene theoryA={theoryA} theoryB={theoryB} colliding={colliding} />
          </Suspense>
        </Canvas>
        {!theoryA && !theoryB && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-xs">Select two theories to visualize</p>
          </div>
        )}
        {/* Collision result insight overlay */}
        {resultInsight && !colliding && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[hsl(225,50%,4%)] via-[hsl(225,50%,4%)/0.9] to-transparent px-5 py-4 pointer-events-none">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Core Insight</p>
            <p className="text-sm text-foreground/90 leading-relaxed line-clamp-3">{resultInsight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
