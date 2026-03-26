import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

type Phase = "idle" | "beam" | "collide" | "explode" | "emerge";

interface SwarmParticle {
  basePos: THREE.Vector3;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
  orbitTilt: number;
  size: number; // 0.01-0.04 for depth variation
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
  const domainColor = useMemo(
    () => new THREE.Color(DOMAIN_COLORS[theory.domain as DomainKey] ?? "#3b82f6"),
    [theory.domain]
  );

  const nodePos = useMemo(
    () => new THREE.Vector3(side === "left" ? -3.5 : 3.5, 0, 0),
    [side]
  );

  const COUNT = Math.min(300, 80 + theory.factors.length * 50);

  const particles = useMemo(() => {
    const pts: SwarmParticle[] = [];
    const perFactor = Math.floor(COUNT / Math.max(theory.factors.length, 1));

    theory.factors.forEach((f, fi) => {
      const coreAngle = (fi / theory.factors.length) * Math.PI * 2;
      for (let j = 0; j < perFactor; j++) {
        const r = 0.4 + Math.random() * 1.2;
        const isLarge = Math.random() < 0.12;
        pts.push({
          basePos: new THREE.Vector3(
            Math.cos(coreAngle + (Math.random() - 0.5) * 1.5) * r,
            (Math.random() - 0.5) * r * 0.8,
            Math.sin(coreAngle + (Math.random() - 0.5) * 1.5) * r
          ),
          orbitRadius: 0.03 + Math.random() * 0.15,
          orbitSpeed: 0.5 + Math.random() * 2.0,
          orbitPhase: Math.random() * Math.PI * 2,
          orbitTilt: (Math.random() - 0.5) * Math.PI * 0.6,
          size: isLarge ? 0.025 + Math.random() * 0.02 : 0.008 + Math.random() * 0.012,
          factorIdx: fi,
        });
      }
    });
    return pts;
  }, [theory, COUNT]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const white = useMemo(() => new THREE.Color("#ffffff"), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // Glowing node sphere pulse
    if (glowRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      const opacity = phase === "explode" || phase === "emerge" ? Math.max(0, 1 - phaseProgress) : 1;
      glowRef.current.scale.setScalar(0.18 * pulse);
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * opacity;
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const motion = classifyMotion(theory.factors[p.factorIdx] || "");
      const st = t * p.orbitSpeed + p.orbitPhase;

      // Base position relative to node
      let x = nodePos.x + p.basePos.x;
      let y = nodePos.y + p.basePos.y;
      let z = nodePos.z + p.basePos.z;

      // Orbital motion variations
      switch (motion) {
        case 0: // wave
          y += Math.sin(st * 2.0 + x * 2) * 0.15;
          x += Math.cos(st * 0.7) * 0.05;
          break;
        case 1: // orbital
          x += Math.cos(st * 1.3) * p.orbitRadius * 2;
          z += Math.sin(st * 1.3) * p.orbitRadius * 2;
          break;
        case 2: // chaotic
          x += Math.sin(st * 3.7 + i * 0.37) * 0.1;
          y += Math.cos(st * 2.9 + i * 0.53) * 0.1;
          z += Math.sin(st * 4.1 + i * 0.71) * 0.08;
          break;
        case 3: // pulsing
          { const pulse = 1 + Math.sin(st * 2.5) * 0.2;
            x = nodePos.x + p.basePos.x * pulse;
            y = nodePos.y + p.basePos.y * pulse;
            z = nodePos.z + p.basePos.z * pulse;
          }
          break;
        case 4: // spiral
          { const sa = st * 1.5;
            x += Math.cos(sa) * p.orbitRadius * 1.5;
            y += Math.sin(sa * 0.3) * 0.08;
            z += Math.sin(sa) * p.orbitRadius * 1.5;
          }
          break;
        default: // lattice tremor
          x += Math.sin(st * 6 + i) * 0.02;
          y += Math.cos(st * 5 + i * 0.7) * 0.02;
      }

      // ─── Phase-based transforms ───
      if (phase === "beam") {
        // Particles stream toward collision point along curved paths
        const beamT = Math.min(phaseProgress * 1.5, 1);
        const particleDelay = (i / particles.length) * 0.6;
        const individualT = Math.max(0, Math.min(1, (beamT - particleDelay) / (1 - particleDelay)));
        
        if (individualT > 0) {
          // Curved beam path
          const curveOffset = Math.sin(individualT * Math.PI) * (side === "left" ? -0.5 : 0.5);
          const tx = x + (collisionPoint.x - x) * individualT;
          const ty = y + (collisionPoint.y - y) * individualT + curveOffset * 0.3;
          const tz = z + (collisionPoint.z - z) * individualT;
          x = tx;
          y = ty;
          z = tz;
        }
      } else if (phase === "collide" || phase === "explode") {
        // Converge to center then blast outward
        const converge = phase === "collide" ? phaseProgress : 1;
        const explodeForce = phase === "explode" ? phaseProgress * 4 * p.orbitSpeed : 0;
        
        x = x * (1 - converge) + collisionPoint.x * converge;
        y = y * (1 - converge) + collisionPoint.y * converge;
        z = z * (1 - converge) + collisionPoint.z * converge;
        
        if (explodeForce > 0) {
          const dir = p.basePos.clone().normalize();
          x += dir.x * explodeForce;
          y += dir.y * explodeForce;
          z += dir.z * explodeForce;
        }
      } else if (phase === "emerge") {
        // Fade out original particles
        const fadeOut = Math.min(phaseProgress * 2, 1);
        const shrink = 1 - fadeOut;
        dummy.position.set(x, y, z);
        dummy.scale.setScalar(Math.max(0.001, p.size * shrink));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        tempColor.copy(domainColor).multiplyScalar(1 - fadeOut * 0.8);
        meshRef.current.setColorAt(i, tempColor);
        continue;
      }

      dummy.position.set(x, y, z);

      // Size with phase modulation
      let scale = p.size;
      if (phase === "collide") scale *= 1 + phaseProgress * 0.5;
      if (phase === "explode") scale *= Math.max(0.2, 1 - phaseProgress * 0.7);
      dummy.scale.setScalar(Math.max(0.001, scale));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color with energy glow during collision
      tempColor.copy(domainColor);
      if (phase === "beam") {
        const energy = Math.min(phaseProgress * 2, 1);
        tempColor.lerp(white, energy * 0.3);
      }
      if (phase === "collide" || phase === "explode") {
        tempColor.lerp(white, phaseProgress * 0.6);
      }
      // Shimmer
      const shimmer = Math.sin(t * 4 + i * 0.5) * 0.1;
      tempColor.r = Math.min(1, tempColor.r + shimmer);
      tempColor.g = Math.min(1, tempColor.g + shimmer * 0.5);
      meshRef.current.setColorAt(i, tempColor);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const showLabels = phase === "idle";

  return (
    <group>
      {/* Glowing theory node sphere */}
      <mesh ref={glowRef} position={nodePos}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={domainColor}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow halo */}
      <mesh position={nodePos}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial
          color={domainColor}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Particle swarm */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          vertexColors
        />
      </instancedMesh>

      {/* Labels */}
      {showLabels && (
        <Html position={[nodePos.x, nodePos.y - 2.2, nodePos.z]} center>
          <div className="text-center pointer-events-none select-none">
            <div
              className="text-sm font-bold px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 backdrop-blur-sm"
              style={{ color: `#${domainColor.getHexString()}`, textShadow: `0 0 10px #${domainColor.getHexString()}60` }}
            >
              {theory.name}
            </div>
            <div className="text-[10px] text-white/40 mt-1 font-mono">
              {COUNT} particles · {theory.factors.length} factors
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-1.5 max-w-[200px]">
              {theory.factors.map((f) => (
                <span
                  key={f}
                  className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10"
                  style={{ color: `#${domainColor.getHexString()}` }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
