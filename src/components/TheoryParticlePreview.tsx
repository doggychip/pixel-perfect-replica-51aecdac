import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

// Motion type from factor keyword
function getMotionType(factor: string): number {
  const f = factor.toLowerCase();
  if (f.includes("wave") || f.includes("field") || f.includes("flow") || f.includes("interference") || f.includes("synchron")) return 0;
  if (f.includes("state") || f.includes("orbit") || f.includes("stabil") || f.includes("attract")) return 1;
  if (f.includes("pulse") || f.includes("oscil") || f.includes("vibr") || f.includes("broadcast") || f.includes("correlat")) return 2;
  if (f.includes("spiral") || f.includes("vortex") || f.includes("helix") || f.includes("entropy") || f.includes("self-org")) return 3;
  if (f.includes("chaos") || f.includes("butterfly") || f.includes("bifurcat") || f.includes("perturb")) return 4;
  return 5;
}

function ParticleCloud({ theory, color }: { theory: CollisionTheory; color: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const threeColor = useMemo(() => new THREE.Color(color), [color]);

  const particles = useMemo(() => {
    const count = Math.min(400, 80 + theory.factors.length * 60);
    const pts: { x: number; y: number; z: number; speed: number; motion: number; phase: number }[] = [];
    const perFactor = Math.floor(count / Math.max(theory.factors.length, 1));

    theory.factors.forEach((f, fi) => {
      const motion = getMotionType(f);
      const coreAngle = (fi / theory.factors.length) * Math.PI * 2;
      const cx = Math.cos(coreAngle) * 0.6;
      const cz = Math.sin(coreAngle) * 0.6;

      for (let j = 0; j < perFactor; j++) {
        pts.push({
          x: cx + (Math.random() - 0.5) * 0.8,
          y: (Math.random() - 0.5) * 0.8,
          z: cz + (Math.random() - 0.5) * 0.8,
          speed: 0.3 + Math.random() * 0.7,
          motion,
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

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let x = p.x, y = p.y, z = p.z;
      const st = t * p.speed + p.phase;

      switch (p.motion) {
        case 0: y += Math.sin(st * 1.5 + i) * 0.12; x += Math.cos(st * 0.6) * 0.04; break;
        case 1: x += Math.cos(st * 1.2) * 0.1; z += Math.sin(st * 1.2) * 0.1; break;
        case 2: { const sc = 1 + Math.sin(st * 2) * 0.08; x *= sc; y *= sc; z *= sc; } break;
        case 3: { const sa = st * 1.3; x += Math.cos(sa) * 0.08; y += Math.sin(sa * 0.5) * 0.06; z += Math.sin(sa) * 0.08; } break;
        case 4: x += Math.sin(st * 3.5 + i * 0.37) * 0.06; y += Math.cos(st * 2.9 + i * 0.53) * 0.06; break;
        default: x += Math.sin(st * 5 + i) * 0.02; y += Math.cos(st * 4 + i * 0.7) * 0.02;
      }

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.025);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Slight brightness variation
      const brightness = 0.8 + Math.sin(t * 2 + i * 0.3) * 0.2;
      tempColor.copy(threeColor).multiplyScalar(brightness);
      meshRef.current.setColorAt(i, tempColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} vertexColors />
    </instancedMesh>
  );
}

function Scene({ theory, color }: { theory: CollisionTheory; color: string }) {
  return (
    <>
      <ambientLight intensity={0.2} />
      <ParticleCloud theory={theory} color={color} />
    </>
  );
}

export default function TheoryParticlePreview({
  theory,
  side,
}: {
  theory: CollisionTheory;
  side: "left" | "right";
}) {
  const color = side === "left" ? "#3b82f6" : "#ef4444";

  return (
    <div className="w-full h-full min-h-[120px]">
      <Canvas
        dpr={[1, 1.2]}
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Scene theory={theory} color={color} />
      </Canvas>
    </div>
  );
}
