import { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";
import ParticleSwarm from "./collision-3d/ParticleSwarm";
import { SparkBurst, ShockwaveRings, CentralFlash, EnergyRipples } from "./collision-3d/CollisionFX";
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

// ─── Camera Shake ───────────────────────────────────────────
function CameraShake({ intensity }: { intensity: number }) {
  const { camera } = useThree();
  const basePos = useRef(new THREE.Vector3(0, 1.5, 8));

  useFrame(({ clock }) => {
    if (intensity <= 0) {
      camera.position.copy(basePos.current);
      return;
    }
    const t = clock.getElapsedTime();
    const shake = intensity * 0.15;
    camera.position.set(
      basePos.current.x + Math.sin(t * 35) * shake,
      basePos.current.y + Math.cos(t * 28) * shake,
      basePos.current.z + Math.sin(t * 40) * shake * 0.5
    );
  });

  return null;
}

// ─── Nebula Background ──────────────────────────────────────
function NebulaBackground() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const COUNT = 40;

  const clouds = useMemo(() =>
    Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        -10 - Math.random() * 15
      ),
      size: 1.5 + Math.random() * 4,
      color: new THREE.Color().setHSL(
        Math.random() < 0.5 ? 0.55 + Math.random() * 0.15 : 0.8 + Math.random() * 0.1,
        0.3,
        0.05 + Math.random() * 0.03
      ),
      drift: 0.1 + Math.random() * 0.2,
    })), []
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const c = clouds[i];
      dummy.position.set(
        c.pos.x + Math.sin(t * c.drift) * 0.5,
        c.pos.y + Math.cos(t * c.drift * 0.7) * 0.3,
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
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

// ─── Scene Orchestrator ─────────────────────────────────────
function Scene({ theoryA, theoryB, isColliding, hasResult, emergentName }: TheoryParticles3DProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [phaseProgress, setPhaseProgress] = useState(0);
  const phaseStartRef = useRef(0);
  const prevCollidingRef = useRef(false);

  // Phase transitions triggered by isColliding
  useEffect(() => {
    if (isColliding && !prevCollidingRef.current) {
      setPhase("beam");
      phaseStartRef.current = 0;
    }
    prevCollidingRef.current = isColliding;
  }, [isColliding]);

  // When result arrives, jump to emerge if still in explode
  useEffect(() => {
    if (hasResult && phase !== "emerge" && phase !== "idle") {
      // Stay in current animation, will transition naturally
    } else if (hasResult && phase === "idle") {
      setPhase("emerge");
      phaseStartRef.current = 0;
    }
  }, [hasResult]);

  // Reset when no result and not colliding
  useEffect(() => {
    if (!hasResult && !isColliding && phase !== "idle") {
      setPhase("idle");
      phaseStartRef.current = 0;
      setPhaseProgress(0);
    }
  }, [hasResult, isColliding]);

  // Phase timing
  useFrame(({ clock }) => {
    if (phase === "idle") return;

    if (phaseStartRef.current === 0) phaseStartRef.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - phaseStartRef.current;

    const durations: Record<Phase, number> = {
      idle: 0,
      beam: 2.0,
      collide: 1.2,
      explode: 1.5,
      emerge: 3.0,
    };

    const duration = durations[phase];
    setPhaseProgress(Math.min(elapsed / duration, 1));

    if (elapsed >= duration) {
      const transitions: Partial<Record<Phase, Phase>> = {
        beam: "collide",
        collide: "explode",
        explode: "emerge",
      };
      const next = transitions[phase];
      if (next) {
        setPhase(next);
        phaseStartRef.current = clock.getElapsedTime();
        setPhaseProgress(0);
      }
    }
  });

  const shakeIntensity = phase === "collide" ? phaseProgress : phase === "explode" ? Math.max(0, 1 - phaseProgress) * 0.7 : 0;
  const showSwarms = phase !== "emerge" || phaseProgress < 0.5;
  const showFX = phase === "explode" || phase === "collide";
  const showEmergent = phase === "emerge";
  const showRipples = phase === "emerge" || (phase === "explode" && phaseProgress > 0.5);

  return (
    <>
      <ambientLight intensity={0.15} />
      <Stars radius={80} depth={60} count={2000} factor={3} saturation={0.15} fade speed={0.3} />
      <NebulaBackground />
      <OrbitControls enablePan={false} enableZoom minDistance={4} maxDistance={16} />
      <CameraShake intensity={shakeIntensity} />

      {theoryA && showSwarms && (
        <ParticleSwarm
          theory={theoryA}
          side="left"
          phase={phase}
          phaseProgress={phaseProgress}
          collisionPoint={COLLISION_CENTER}
        />
      )}

      {theoryB && showSwarms && (
        <ParticleSwarm
          theory={theoryB}
          side="right"
          phase={phase}
          phaseProgress={phaseProgress}
          collisionPoint={COLLISION_CENTER}
        />
      )}

      {/* Collision effects */}
      {phase === "collide" && (
        <CentralFlash progress={phaseProgress} center={COLLISION_CENTER} />
      )}

      {showFX && (
        <>
          <SparkBurst progress={phaseProgress} center={COLLISION_CENTER} />
          <ShockwaveRings progress={phaseProgress} center={COLLISION_CENTER} />
        </>
      )}

      {showRipples && (
        <EnergyRipples center={COLLISION_CENTER} intensity={phase === "emerge" ? 1 : phaseProgress * 0.5} />
      )}

      {/* Emergent hybrid cloud */}
      {showEmergent && theoryA && theoryB && (
        <EmergentCloud
          theoryA={theoryA}
          theoryB={theoryB}
          progress={phaseProgress}
          center={COLLISION_CENTER}
          emergentName={emergentName}
        />
      )}
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────
export default function TheoryParticles3D(props: TheoryParticles3DProps) {
  return (
    <div className="w-full h-full min-h-[300px] relative">
      <HUD
        theoryA={props.theoryA}
        theoryB={props.theoryB}
        phase={props.isColliding ? "beam" : props.hasResult ? "emerge" : "idle"}
        phaseProgress={0}
      />
      <Canvas
        camera={{ position: [0, 1.5, 8], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
