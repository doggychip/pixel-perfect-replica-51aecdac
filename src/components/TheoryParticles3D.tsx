import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";
import ParticleSwarm from "./collision-3d/ParticleSwarm";
import { CentralFlash, EnergyRipples } from "./collision-3d/CollisionFX";
import EmergentCloud from "./collision-3d/EmergentCloud";
import HUD from "./collision-3d/HUD";

type Phase = "idle" | "beam" | "collide" | "explode" | "emerge";

interface TheoryParticles3DProps {
  theoryA?: CollisionTheory;
  theoryB?: CollisionTheory;
  isColliding: boolean;
  hasResult: boolean;
  emergentName?: string;
}

const COLLISION_CENTER = new THREE.Vector3(0, 0, 0);

function CameraShake({ intensity }: { intensity: number }) {
  const { camera } = useThree();
  const basePos = useRef(new THREE.Vector3(0, 1.2, 7.4));

  useFrame(({ clock }) => {
    if (intensity <= 0) {
      camera.position.lerp(basePos.current, 0.12);
      return;
    }

    const t = clock.getElapsedTime();
    const shake = intensity * 0.1;
    camera.position.set(
      basePos.current.x + Math.sin(t * 35) * shake,
      basePos.current.y + Math.cos(t * 28) * shake,
      basePos.current.z + Math.sin(t * 40) * shake * 0.45
    );
  });

  return null;
}

function NebulaBackground() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 18;

  const clouds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 14,
          -10 - Math.random() * 12
        ),
        size: 1.8 + Math.random() * 3.2,
        color: new THREE.Color().setHSL(
          Math.random() < 0.5 ? 0.55 + Math.random() * 0.1 : 0.8 + Math.random() * 0.06,
          0.25,
          0.05 + Math.random() * 0.025
        ),
        drift: 0.08 + Math.random() * 0.12,
      })),
    []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const c = clouds[i];
      dummy.position.set(
        c.pos.x + Math.sin(t * c.drift) * 0.35,
        c.pos.y + Math.cos(t * c.drift * 0.7) * 0.2,
        c.pos.z
      );
      dummy.scale.setScalar(c.size);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, c.color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

function Scene({ theoryA, theoryB, isColliding, hasResult, emergentName, onPhaseChange }: TheoryParticles3DProps & { onPhaseChange: (phase: Phase, progress: number) => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const phaseStartRef = useRef(0);
  const prevCollidingRef = useRef(false);

  useEffect(() => {
    if (isColliding && !prevCollidingRef.current) {
      setPhase("beam");
      phaseStartRef.current = 0;
      setPhaseProgress(0);
    }
    prevCollidingRef.current = isColliding;
  }, [isColliding]);

  useEffect(() => {
    if (hasResult && phase === "idle") {
      setPhase("emerge");
      phaseStartRef.current = 0;
      setPhaseProgress(0);
    }
  }, [hasResult, phase]);

  useEffect(() => {
    if (!hasResult && !isColliding && phase !== "idle") {
      setPhase("idle");
      phaseStartRef.current = 0;
      setPhaseProgress(0);
    }
  }, [hasResult, isColliding, phase]);

  useEffect(() => {
    onPhaseChange(phase, phaseProgress);
  }, [phase, phaseProgress, onPhaseChange]);

  useFrame(({ clock }) => {
    if (phase === "idle") return;

    if (phaseStartRef.current === 0) phaseStartRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - phaseStartRef.current;

    const durations: Record<Phase, number> = {
      idle: 0,
      beam: 1.8,
      collide: 1.0,
      explode: 1.2,
      emerge: 2.6,
    };

    const duration = durations[phase];
    const nextProgress = Math.min(elapsed / duration, 1);
    setPhaseProgress((prev) => (Math.abs(prev - nextProgress) > 0.01 ? nextProgress : prev));

    if (elapsed >= duration) {
      const next = phase === "beam" ? "collide" : phase === "collide" ? "explode" : phase === "explode" ? "emerge" : null;
      if (next) {
        setPhase(next);
        phaseStartRef.current = clock.getElapsedTime();
        setPhaseProgress(0);
      }
    }
  });

  const shakeIntensity = phase === "collide" ? phaseProgress : phase === "explode" ? Math.max(0, 1 - phaseProgress) * 0.6 : 0;
  const showSwarms = phase !== "emerge" || phaseProgress < 0.45;

  return (
    <>
      <ambientLight intensity={0.2} />
      <Stars radius={70} depth={50} count={900} factor={2.2} saturation={0.15} fade speed={0.25} />
      <NebulaBackground />
      <OrbitControls enablePan={false} enableZoom minDistance={4} maxDistance={14} />
      <CameraShake intensity={shakeIntensity} />

      {theoryA && showSwarms && (
        <ParticleSwarm theory={theoryA} side="left" phase={phase} phaseProgress={phaseProgress} collisionPoint={COLLISION_CENTER} />
      )}

      {theoryB && showSwarms && (
        <ParticleSwarm theory={theoryB} side="right" phase={phase} phaseProgress={phaseProgress} collisionPoint={COLLISION_CENTER} />
      )}

      {phase === "collide" && <CentralFlash progress={phaseProgress} center={COLLISION_CENTER} />}

      {(phase === "explode" || phase === "collide") && (
        <>
          <SparkBurst progress={phaseProgress} center={COLLISION_CENTER} />
          <ShockwaveRings progress={phaseProgress} center={COLLISION_CENTER} />
        </>
      )}

      {(phase === "emerge" || (phase === "explode" && phaseProgress > 0.5)) && (
        <EnergyRipples center={COLLISION_CENTER} intensity={phase === "emerge" ? 1 : phaseProgress * 0.5} />
      )}

      {phase === "emerge" && theoryA && theoryB && (
        <EmergentCloud theoryA={theoryA} theoryB={theoryB} progress={phaseProgress} center={COLLISION_CENTER} emergentName={emergentName} />
      )}
    </>
  );
}

export default function TheoryParticles3D(props: TheoryParticles3DProps) {
  const [hudPhase, setHudPhase] = useState<Phase>("idle");
  const [hudProgress, setHudProgress] = useState(0);

  return (
    <div className="w-full h-full min-h-[300px] relative bg-black">
      <HUD theoryA={props.theoryA} theoryB={props.theoryB} phase={hudPhase} phaseProgress={hudProgress} />
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [0, 1.2, 7.4], fov: 52 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Scene {...props} onPhaseChange={(phase, progress) => {
          setHudPhase(phase);
          setHudProgress(progress);
        }} />
      </Canvas>
    </div>
  );
}
