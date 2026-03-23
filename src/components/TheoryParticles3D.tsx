import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Line, Html, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Helpers ───────────────────────────────────────────────
type MotionPattern = "orbit" | "pulse" | "wave" | "spiral" | "jitter";
type Phase = "idle" | "approach" | "explode" | "merge";

function factorMotion(factor: string): MotionPattern {
  const f = factor.toLowerCase();
  if (/state|space|field|landscape|wavefunction|vacuum/.test(f)) return "orbit";
  if (/probability|amplitude|weight|load|calibration|precision/.test(f)) return "pulse";
  if (/collapse|measurement|observation|emergence|decoherence/.test(f)) return "wave";
  if (/correlation|coupling|entangle|non-local|connection|social/.test(f)) return "spiral";
  return "jitter";
}

function factorToCoords(factor: string, _index: number, _total: number) {
  let hash = 0;
  for (let i = 0; i < factor.length; i++) hash = ((hash << 5) - hash + factor.charCodeAt(i)) | 0;
  const norm = (v: number) => ((v % 1000) / 1000);
  return {
    x: norm(Math.abs(hash)) * 2 - 1,
    y: norm(Math.abs(hash >> 8)) * 2 - 1,
    z: norm(Math.abs(hash >> 16)) * 2 - 1,
    weight: 0.5 + norm(Math.abs(hash >> 4)) * 0.8,
    motion: factorMotion(factor),
  };
}

// ─── Factor Dot with trail ─────────────────────────────────
function FactorDot({
  position, color, size, factor, opacity, highlighted,
  onHover, onClick, phase, targetPosition, motion = "jitter",
}: {
  position: [number, number, number]; color: string; size: number;
  factor: string; opacity: number; highlighted: boolean;
  onHover: (f: string | null) => void; onClick: (f: string) => void;
  phase: Phase; targetPosition: [number, number, number]; motion?: MotionPattern;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(new THREE.Vector3(...position));
  const glowIntensity = highlighted ? 2.0 : 0.6;

  const TRAIL_LENGTH = 12;
  const trailRef = useRef<THREE.InstancedMesh>(null);
  const trailPositions = useRef<THREE.Vector3[]>(
    Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3(...position))
  );
  const trailDummy = useMemo(() => new THREE.Object3D(), []);
  const frameCount = useRef(0);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    const s = size * 10;

    let target: THREE.Vector3;
    if (phase === "idle") {
      if (motion === "orbit") {
        target = new THREE.Vector3(
          position[0] + Math.cos(t * 0.6 + s) * 0.18,
          position[1] + Math.sin(t * 0.6 + s) * 0.18,
          position[2] + Math.sin(t * 0.3 + s) * 0.05,
        );
      } else if (motion === "pulse") {
        const breathe = 1 + Math.sin(t * 1.2 + s) * 0.12;
        target = new THREE.Vector3(position[0] * breathe, position[1] * breathe, position[2] * breathe);
      } else if (motion === "wave") {
        target = new THREE.Vector3(
          position[0] + Math.sin(t * 0.8 + s) * 0.05,
          position[1] + Math.sin(t * 1.5 + position[0] * 3) * 0.2,
          position[2],
        );
      } else if (motion === "spiral") {
        const angle = t * 0.7 + s;
        const r = 0.12;
        target = new THREE.Vector3(
          position[0] + Math.cos(angle) * r,
          position[1] + Math.sin(angle) * r * 0.6,
          position[2] + Math.sin(angle * 0.5) * r,
        );
      } else {
        target = new THREE.Vector3(
          position[0] + Math.sin(t * 3 + s) * 0.06,
          position[1] + Math.cos(t * 2.7 + s * 1.3) * 0.06,
          position[2] + Math.sin(t * 2.3 + s * 0.7) * 0.04,
        );
      }
    } else if (phase === "approach") {
      target = new THREE.Vector3(...targetPosition).multiplyScalar(0.4);
    } else if (phase === "explode") {
      target = new THREE.Vector3(...position).multiplyScalar(2.5);
    } else {
      target = new THREE.Vector3(
        targetPosition[0] * 0.15 + Math.sin(t * 2 + s) * 0.15,
        targetPosition[1] * 0.15 + Math.cos(t * 2 + s * 0.7) * 0.15,
        targetPosition[2] * 0.15,
      );
    }

    currentPos.current.lerp(target, 0.04);
    meshRef.current.position.copy(currentPos.current);

    // Update trail
    frameCount.current++;
    if (frameCount.current % 3 === 0) {
      trailPositions.current.pop();
      trailPositions.current.unshift(currentPos.current.clone());
    }
    if (trailRef.current) {
      for (let ti = 0; ti < TRAIL_LENGTH; ti++) {
        const tp = trailPositions.current[ti];
        trailDummy.position.copy(tp);
        const fade = 1 - ti / TRAIL_LENGTH;
        trailDummy.scale.setScalar(size * fade * 0.6);
        trailDummy.updateMatrix();
        trailRef.current.setMatrixAt(ti, trailDummy.matrix);
      }
      trailRef.current.instanceMatrix.needsUpdate = true;
    }

    const pulseScale = highlighted ? size * (1.2 + Math.sin(t * 4) * 0.15) : size;
    meshRef.current.scale.setScalar(pulseScale);
  });

  return (
    <group>
      {/* Particle trail */}
      <instancedMesh ref={trailRef} args={[undefined, undefined, TRAIL_LENGTH]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </instancedMesh>
      {/* Visible dot */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerEnter={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; onHover(factor); }}
        onPointerLeave={(e) => { e.stopPropagation(); document.body.style.cursor = "auto"; onHover(null); }}
        onClick={(e) => { e.stopPropagation(); onClick(factor); }}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glowIntensity} transparent opacity={opacity} />
      </mesh>
      {/* Hit area */}
      <mesh position={position} visible={false}
        onPointerEnter={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; onHover(factor); }}
        onPointerLeave={(e) => { e.stopPropagation(); document.body.style.cursor = "auto"; onHover(null); }}
        onClick={(e) => { e.stopPropagation(); onClick(factor); }}
      >
        <sphereGeometry args={[3, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {highlighted && (
        <mesh position={meshRef.current?.position.toArray() as [number, number, number] ?? position}>
          <ringGeometry args={[1.6, 2.2, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
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
function ConnectingArcs({
  dotsA, dotsB, highlightedFactor, phase,
}: {
  dotsA: { pos: [number, number, number]; factor: string }[];
  dotsB: { pos: [number, number, number]; factor: string }[];
  highlightedFactor: string | null; phase: Phase;
}) {
  const connections = useMemo(() => {
    if (dotsA.length === 0 || dotsB.length === 0) return [];
    const conns: { from: [number, number, number]; to: [number, number, number]; factorA: string; factorB: string }[] = [];
    const usedB = new Set<number>();
    for (const a of dotsA) {
      let bestDist = Infinity, bestIdx = 0;
      for (let j = 0; j < dotsB.length; j++) {
        if (usedB.has(j)) continue;
        const dx = a.pos[0] - dotsB[j].pos[0], dy = a.pos[1] - dotsB[j].pos[1], dz = a.pos[2] - dotsB[j].pos[2];
        const dist = dx * dx + dy * dy + dz * dz;
        if (dist < bestDist) { bestDist = dist; bestIdx = j; }
      }
      usedB.add(bestIdx);
      if (dotsB[bestIdx]) conns.push({ from: a.pos, to: dotsB[bestIdx].pos, factorA: a.factor, factorB: dotsB[bestIdx].factor });
    }
    return conns;
  }, [dotsA, dotsB]);

  if (phase === "explode" || connections.length === 0) return null;

  return (
    <group>
      {connections.map((c, i) => {
        const isHighlighted = highlightedFactor && (c.factorA === highlightedFactor || c.factorB === highlightedFactor);
        const mid: [number, number, number] = [(c.from[0] + c.to[0]) / 2, (c.from[1] + c.to[1]) / 2 + 0.6, (c.from[2] + c.to[2]) / 2];
        return (
          <Line key={i} points={[c.from, mid, c.to]}
            color={isHighlighted ? "#f59e0b" : "#6366f1"}
            lineWidth={isHighlighted ? 2 : 0.8}
            transparent opacity={isHighlighted ? 0.9 : (phase === "merge" ? 0.4 : 0.15)}
          />
        );
      })}
    </group>
  );
}

// ─── Sub-Particle Cloud per Factor ─────────────────────────
function SubParticleCloud({ center, color, count, phase }: {
  center: [number, number, number]; color: string; count: number; phase: Phase;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const offsets = useMemo(() =>
    Array.from({ length: count }, (_, i) => {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.35;
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        speed: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      };
    }), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const o = offsets[i];
      const scale = phase === "explode" ? 2.5 : phase === "approach" ? 0.6 : 1;
      dummy.position.set(
        center[0] + o.x * scale + Math.sin(t * o.speed + o.phase) * 0.05,
        center[1] + o.y * scale + Math.cos(t * o.speed * 0.8 + o.phase) * 0.05,
        center[2] + o.z * scale,
      );
      dummy.scale.setScalar(0.015 + Math.sin(t * 2 + i) * 0.005);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.4} />
    </instancedMesh>
  );
}

// ─── Collision Fireworks ───────────────────────────────────
function CollisionFireworks({ active }: { active: boolean }) {
  const COUNT = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() =>
    Array.from({ length: COUNT }, () => {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      return {
        dir: new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi)).multiplyScalar(speed),
        pos: new THREE.Vector3(0, 0, 0),
        life: 0,
        maxLife: 1 + Math.random() * 1.5,
        colorMix: Math.random(),
      };
    }), []);

  const colorA = useMemo(() => new THREE.Color("#3b82f6"), []);
  const colorB = useMemo(() => new THREE.Color("#a855f7"), []);
  const colorC = useMemo(() => new THREE.Color("#ef4444"), []);
  const wasActive = useRef(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (active && !wasActive.current) {
      particles.forEach(p => { p.pos.set(0, 0, 0); p.life = 0; });
      wasActive.current = true;
    }
    if (!active) wasActive.current = false;

    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      if (active || p.life < p.maxLife) {
        p.life += delta;
        p.pos.addScaledVector(p.dir, delta * 0.8);
        p.pos.y -= delta * 0.3;
        const fade = Math.max(0, 1 - p.life / p.maxLife);
        dummy.position.copy(p.pos);
        dummy.scale.setScalar(0.04 * fade);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        const c = new THREE.Color();
        if (p.colorMix < 0.5) c.lerpColors(colorA, colorB, p.colorMix * 2);
        else c.lerpColors(colorB, colorC, (p.colorMix - 0.5) * 2);
        meshRef.current.setColorAt(i, c);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.5} transparent opacity={0.9} />
    </instancedMesh>
  );
}

// ─── Theory Label ──────────────────────────────────────────
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

// ─── Main Scene ────────────────────────────────────────────
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

  const dotsA = useMemo(() => {
    if (!theoryA) return [];
    return theoryA.factors.map((f, i) => {
      const c = factorToCoords(f, i, theoryA.factors.length);
      const pos: [number, number, number] = [c.x * 1.5 + offsetA[0], c.y * 1.5 + offsetA[1], c.z * 1.5 + offsetA[2]];
      return { pos, factor: f, weight: c.weight, motion: c.motion };
    });
  }, [theoryA, offsetA[0]]);

  const dotsB = useMemo(() => {
    if (!theoryB) return [];
    return theoryB.factors.map((f, i) => {
      const c = factorToCoords(f, i, theoryB.factors.length);
      const pos: [number, number, number] = [c.x * 1.5 + offsetB[0], c.y * 1.5 + offsetB[1], c.z * 1.5 + offsetB[2]];
      return { pos, factor: f, weight: c.weight, motion: c.motion };
    });
  }, [theoryB, offsetB[0]]);

  const tooltipDot = useMemo(() => {
    if (!activeFactor) return null;
    return [...dotsA, ...dotsB].find(d => d.factor === activeFactor) ?? null;
  }, [activeFactor, dotsA, dotsB]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#6366f1" />

      {/* Star field background */}
      <Stars radius={50} depth={40} count={1500} factor={3} saturation={0.1} fade speed={0.5} />

      {/* Theory A */}
      {theoryA && (
        <>
          <TheoryLabel text={theoryA.name} position={[offsetA[0], 2.3, 0]} color="#60a5fa" />
          {dotsA.map((d, i) => (
            <group key={`a-${i}`}>
              <FactorDot position={d.pos} targetPosition={d.pos}
                color="#3b82f6" size={0.06 + d.weight * 0.08} factor={d.factor}
                opacity={0.7 + d.weight * 0.3} highlighted={activeFactor === d.factor}
                onHover={setHoveredFactor} onClick={setClickedFactor}
                phase={phase} motion={d.motion}
              />
              <SubParticleCloud center={d.pos} color="#3b82f6" count={15} phase={phase} />
            </group>
          ))}
        </>
      )}

      {/* Theory B */}
      {theoryB && (
        <>
          <TheoryLabel text={theoryB.name} position={[offsetB[0], 2.3, 0]} color="#f87171" />
          {dotsB.map((d, i) => (
            <group key={`b-${i}`}>
              <FactorDot position={d.pos} targetPosition={d.pos}
                color="#ef4444" size={0.06 + d.weight * 0.08} factor={d.factor}
                opacity={0.7 + d.weight * 0.3} highlighted={activeFactor === d.factor}
                onHover={setHoveredFactor} onClick={setClickedFactor}
                phase={phase} motion={d.motion}
              />
              <SubParticleCloud center={d.pos} color="#ef4444" count={8} phase={phase} />
            </group>
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

      {/* Fireworks on explode/merge */}
      <CollisionFireworks active={phase === "explode"} />

      <OrbitControls enablePan={false} enableZoom minDistance={4} maxDistance={12} autoRotate autoRotateSpeed={0.4} />
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
      <Canvas camera={{ position: [0, 2, 7], fov: 50 }} style={{ background: "transparent" }}>
        <Scene
          theoryA={theoryA} theoryB={theoryB} phase={phase}
          hoveredFactor={hoveredFactor} setHoveredFactor={setHoveredFactor}
          clickedFactor={clickedFactor} setClickedFactor={handleClickFactor}
        />
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
