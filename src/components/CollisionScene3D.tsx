import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory } from "@/data/collision-theories";

// ─── Particle Cloud ──────────────────────────────────────────
function ParticleCloud({
  theory,
  position,
  color,
  colliding,
}: {
  theory: CollisionTheory;
  position: [number, number, number];
  color: string;
  colliding: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const count = Math.max(30, theory.factors.length * 14);
  const threeColor = new THREE.Color(color);

  const particles = useMemo(() => {
    const arr: { pos: THREE.Vector3; speed: number; offset: number }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 2.5
        ),
        speed: 0.3 + Math.random() * 0.7,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count]);

  const positionsAttr = useMemo(() => {
    const arr = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      arr[i * 3] = p.pos.x;
      arr[i * 3 + 1] = p.pos.y;
      arr[i * 3 + 2] = p.pos.z;
    });
    return arr;
  }, [particles, count]);

  const geoRef = useRef<THREE.BufferGeometry>(null);

  useFrame(({ clock }) => {
    if (!geoRef.current) return;
    const t = clock.getElapsedTime();
    const posArr = geoRef.current.attributes.position.array as Float32Array;

    particles.forEach((p, i) => {
      const wave = Math.sin(t * p.speed + p.offset) * 0.3;
      posArr[i * 3] = p.pos.x + wave;
      posArr[i * 3 + 1] = p.pos.y + Math.cos(t * p.speed * 0.7 + p.offset) * 0.3;
      posArr[i * 3 + 2] = p.pos.z + Math.sin(t * p.speed * 0.5 + p.offset) * 0.2;
    });
    geoRef.current.attributes.position.needsUpdate = true;

    if (groupRef.current && colliding) {
      const targetX = position[0] > 0 ? position[0] - 2 : position[0] + 2;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.04;
    } else if (groupRef.current) {
      groupRef.current.position.x += (position[0] - groupRef.current.position.x) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <points>
        <bufferGeometry ref={geoRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[positionsAttr, 3]}
            count={count}
          />
        </bufferGeometry>
        <pointsMaterial color={threeColor} size={0.13} sizeAttenuation transparent opacity={0.9} />
      </points>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.32}
          color={color}
          anchorX="center"
          anchorY="bottom"
          position={[0, 2, 0]}
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {theory.name}
        </Text>
        {theory.nameCn && (
          <Text
            fontSize={0.2}
            color={color}
            anchorX="center"
            anchorY="top"
            position={[0, 1.85, 0]}
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {theory.nameCn}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

// ─── Collision Flash ─────────────────────────────────────────
function CollisionFlash({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (active) {
      const t = (clock.getElapsedTime() * 3) % 1;
      meshRef.current.scale.setScalar(t * 3);
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

// ─── Exported Scene ──────────────────────────────────────────
export default function CollisionScene3D({
  theoryA,
  theoryB,
  colliding,
  className,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  colliding: boolean;
  className?: string;
}) {
  const colorA = "#3b82f6"; // blue
  const colorB = "#ef4444"; // red

  return (
    <div className={className ?? "w-full h-64 rounded-lg overflow-hidden border border-border/50 bg-[hsl(225,50%,4%)]"}>
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.6} />
          <Stars radius={40} depth={25} count={500} factor={2.5} fade speed={1} />
          <OrbitControls enablePan={false} maxDistance={14} minDistance={4} />
          {theoryA && (
            <ParticleCloud theory={theoryA} position={[-3, 0, 0]} color={colorA} colliding={colliding} />
          )}
          {theoryB && (
            <ParticleCloud theory={theoryB} position={[3, 0, 0]} color={colorB} colliding={colliding} />
          )}
          <CollisionFlash active={colliding} />
        </Suspense>
      </Canvas>
      {!theoryA && !theoryB && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground text-xs">Select two theories to visualize</p>
        </div>
      )}
    </div>
  );
}
