import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

type Phase = "idle" | "beam" | "collide" | "emerge";

interface SwarmParticle {
  basePos: THREE.Vector3;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  size: number;
  factorIdx: number;
}

function classifyMotion(factor: string): number {
  const f = factor.toLowerCase();
  if (f.includes("wave") || f.includes("field") || f.includes("interference") || f.includes("synchron") || f.includes("oscillat")) return 0;
  if (f.includes("state") || f.includes("orbit") || f.includes("stabil") || f.includes("attract") || f.includes("fixed")) return 1;
  if (f.includes("chaos") || f.includes("butterfly") || f.includes("bifurcat") || f.includes("fractal") || f.includes("turbul")) return 2;
  if (f.includes("pulse") || f.includes("broadcast") || f.includes("correlat") || f.includes("feedback") || f.includes("co-activ")) return 3;
  if (f.includes("spiral") || f.includes("entropy") || f.includes("self-org") || f.includes("gradient") || f.includes("vortex")) return 4;
  return 5;
}

export default function ParticleSwarm({
  theory,
  side,
  phase,
  phaseProgress,
  collisionPoint,
}: {
  theory: CollisionTheory;
  side: "left" | "right";
  phase: Phase;
  phaseProgress: number;
  collisionPoint: THREE.Vector3;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const domainColor = useMemo(
    () => new THREE.Color(DOMAIN_COLORS[theory.domain as DomainKey] ?? "#3b82f6"),
    [theory.domain]
  );

  const nodePos = useMemo(
    () => new THREE.Vector3(side === "left" ? -3.1 : 3.1, 0, 0),
    [side]
  );

  const COUNT = Math.min(260, 120 + theory.factors.length * 35);

  const particles = useMemo(() => {
    const pts: SwarmParticle[] = [];
    const perFactor = Math.floor(COUNT / Math.max(theory.factors.length, 1));

    theory.factors.forEach((_, fi) => {
      const coreAngle = (fi / theory.factors.length) * Math.PI * 2;
      for (let j = 0; j < perFactor; j++) {
        const r = 0.6 + Math.random() * 1.4;
        const isLarge = Math.random() < 0.2;
        pts.push({
          basePos: new THREE.Vector3(
            Math.cos(coreAngle + (Math.random() - 0.5) * 1.8) * r,
            (Math.random() - 0.5) * r * 0.9,
            Math.sin(coreAngle + (Math.random() - 0.5) * 1.8) * r
          ),
          orbitRadius: 0.08 + Math.random() * 0.2,
          orbitSpeed: 0.5 + Math.random() * 1.8,
          orbitPhase: Math.random() * Math.PI * 2,
          size: isLarge ? 0.06 + Math.random() * 0.04 : 0.028 + Math.random() * 0.022,
          factorIdx: fi,
        });
      }
    });
    return pts;
  }, [theory, COUNT]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      const opacity = phase === "emerge" ? Math.max(0.15, 1 - phaseProgress) : 1;
      glowRef.current.scale.setScalar(0.32 * pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.95 * opacity;
    }

    if (haloRef.current) {
      const haloPulse = 1 + Math.sin(t * 1.3) * 0.06;
      haloRef.current.scale.setScalar(1.6 * haloPulse);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.16;
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const motion = classifyMotion(theory.factors[p.factorIdx] || "");
      const st = t * p.orbitSpeed + p.orbitPhase;

      let x = nodePos.x + p.basePos.x;
      let y = nodePos.y + p.basePos.y;
      let z = nodePos.z + p.basePos.z;

      switch (motion) {
        case 0:
          y += Math.sin(st * 2.0 + x * 2) * 0.18;
          x += Math.cos(st * 0.7) * 0.08;
          break;
        case 1:
          x += Math.cos(st * 1.3) * p.orbitRadius * 1.8;
          z += Math.sin(st * 1.3) * p.orbitRadius * 1.8;
          break;
        case 2:
          x += Math.sin(st * 3.7 + i * 0.37) * 0.14;
          y += Math.cos(st * 2.9 + i * 0.53) * 0.14;
          z += Math.sin(st * 4.1 + i * 0.71) * 0.1;
          break;
        case 3: {
          const pulse = 1 + Math.sin(st * 2.5) * 0.22;
          x = nodePos.x + p.basePos.x * pulse;
          y = nodePos.y + p.basePos.y * pulse;
          z = nodePos.z + p.basePos.z * pulse;
          break;
        }
        case 4: {
          const sa = st * 1.5;
          x += Math.cos(sa) * p.orbitRadius * 1.6;
          y += Math.sin(sa * 0.3) * 0.1;
          z += Math.sin(sa) * p.orbitRadius * 1.6;
          break;
        }
        default:
          x += Math.sin(st * 6 + i) * 0.03;
          y += Math.cos(st * 5 + i * 0.7) * 0.03;
      }

      if (phase === "beam") {
        const beamT = Math.min(phaseProgress * 1.5, 1);
        const particleDelay = (i / particles.length) * 0.55;
        const individualT = Math.max(0, Math.min(1, (beamT - particleDelay) / Math.max(0.2, 1 - particleDelay)));

        if (individualT > 0) {
          const curveOffset = Math.sin(individualT * Math.PI) * (side === "left" ? -0.5 : 0.5);
          x = x + (collisionPoint.x - x) * individualT;
          y = y + (collisionPoint.y - y) * individualT + curveOffset * 0.32;
          z = z + (collisionPoint.z - z) * individualT;
        }
      } else if (phase === "collide") {
        // Particles converge smoothly to center for merging
        const converge = phaseProgress;
        x = x * (1 - converge) + collisionPoint.x * converge;
        y = y * (1 - converge) + collisionPoint.y * converge;
        z = z * (1 - converge) + collisionPoint.z * converge;
      } else if (phase === "emerge") {
        const fadeOut = Math.min(phaseProgress * 2, 1);
        const shrink = 1 - fadeOut;
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(Math.max(0.001, p.size * shrink));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      dummy.position.set(x, y, z);
      let scale = p.size;
      if (phase === "collide") scale *= 1 + phaseProgress * 0.6;
      if (phase === "explode") scale *= Math.max(0.28, 1 - phaseProgress * 0.6);
      dummy.scale.setScalar(Math.max(0.001, scale));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const showLabels = phase === "idle";

  return (
    <group>
      {/* Outer halo - large and soft */}
      <mesh ref={haloRef} position={nodePos}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshBasicMaterial color={domainColor} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Core glowing sphere - domain colored */}
      <mesh ref={glowRef} position={nodePos}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial color={domainColor} transparent opacity={0.95} />
      </mesh>

      {/* Second glow layer with domain color */}
      <mesh position={nodePos}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshBasicMaterial color={domainColor} transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Particle swarm - explicit theory color to avoid black instanced vertex colors */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={domainColor} transparent opacity={0.95} depthWrite={false} />
      </instancedMesh>

      {showLabels && (
        <Html position={[nodePos.x, nodePos.y - 2.2, nodePos.z]} center>
          <div className="text-center pointer-events-none select-none">
            <div
              className="text-sm font-bold px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 backdrop-blur-sm"
              style={{ color: `#${domainColor.getHexString()}`, textShadow: `0 0 10px #${domainColor.getHexString()}60` }}
            >
              {theory.name}
            </div>
            <div className="text-[10px] text-white/45 mt-1 font-mono">
              {particles.length} particles · {theory.factors.length} factors
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
