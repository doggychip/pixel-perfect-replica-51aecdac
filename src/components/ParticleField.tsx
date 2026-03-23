import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

// ─── Single theory particle cloud ───────────────────────────
function TheoryParticles({
  theory,
  side,
  isColliding,
  otherSelected,
}: {
  theory: CollisionTheory;
  side: "left" | "right";
  isColliding: boolean;
  otherSelected: boolean;
}) {
  const meshRef = useRef<THREE.Points>(null);
  const count = 200;
  const colorHex = DOMAIN_COLORS[theory.domain as DomainKey] ?? "#888888";
  const baseX = side === "left" ? -2.5 : 2.5;

  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.6 + Math.random() * 0.8;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
      sz[i] = 2 + Math.random() * 4;
    }
    return { positions: pos, velocities: vel, sizes: sz };
  }, [theory.id]);

  const color = useMemo(() => new THREE.Color(colorHex), [colorHex]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;

    // Collision target: move toward center
    const targetX = isColliding ? 0 : baseX;
    const currentGroupX = meshRef.current.position.x;
    meshRef.current.position.x += (targetX - currentGroupX) * 0.03;

    // Gentle orbital + breathing motion
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = positions[ix];
      const y = positions[ix + 1];
      const z = positions[ix + 2];

      // Slow rotation
      const angle = t * 0.3 + i * 0.001;
      const cos = Math.cos(angle * 0.01);
      const sin = Math.sin(angle * 0.01);

      let nx = x * cos - z * sin + velocities[ix] * Math.sin(t + i);
      let ny = y + velocities[ix + 1] * Math.cos(t * 0.7 + i);
      let nz = x * sin + z * cos + velocities[ix + 2] * Math.sin(t * 1.3 + i);

      // Breathing effect
      const breathe = 1 + 0.08 * Math.sin(t * 0.5 + i * 0.05);
      nx *= breathe;
      ny *= breathe;
      nz *= breathe;

      // When colliding, compress inward
      if (isColliding) {
        const squeeze = 0.97;
        nx *= squeeze;
        ny *= squeeze;
        nz *= squeeze;
      }

      posAttr.setXYZ(i, nx, ny, nz);
    }
    posAttr.needsUpdate = true;

    // Pulse glow
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.7 + 0.2 * Math.sin(t * 2);
  });

  return (
    <points ref={meshRef} position={[baseX, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.slice()}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Collision burst particles ───────────────────────────────
function CollisionBurst({ colorA, colorB }: { colorA: string; colorB: string }) {
  const meshRef = useRef<THREE.Points>(null);
  const count = 120;

  const { positions, velocities, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cA = new THREE.Color(colorA);
    const cB = new THREE.Color(colorB);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      const speed = 0.02 + Math.random() * 0.06;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      vel[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      vel[i * 3 + 2] = speed * Math.cos(phi);
      const mix = Math.random();
      const c = cA.clone().lerp(cB, mix);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, velocities: vel, colors: col };
  }, [colorA, colorB]);

  useFrame(() => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      posAttr.array[ix] += velocities[ix];
      posAttr.array[ix + 1] += velocities[ix + 1];
      posAttr.array[ix + 2] += velocities[ix + 2];
      // Slow down
      velocities[ix] *= 0.995;
      velocities[ix + 1] *= 0.995;
      velocities[ix + 2] *= 0.995;
    }
    posAttr.needsUpdate = true;
    const mat = meshRef.current.material as THREE.PointsMaterial;
    mat.opacity = Math.max(0, mat.opacity - 0.003);
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        transparent
        opacity={1}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Ambient floating dust ──────────────────────────────────
function AmbientDust() {
  const ref = useRef<THREE.Points>(null);
  const count = 80;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      posAttr.array[ix + 1] += Math.sin(t * 0.2 + i) * 0.002;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color="#334155"
        size={0.03}
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Connection lines between selected theories ──────────────
function ConnectionLines({
  theoryA,
  theoryB,
  isColliding,
}: {
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  isColliding: boolean;
}) {
  const ref = useRef<THREE.Line>(null);
  const colorA = DOMAIN_COLORS[theoryA.domain as DomainKey] ?? "#888";
  const colorB = DOMAIN_COLORS[theoryB.domain as DomainKey] ?? "#888";

  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.LineBasicMaterial;
    mat.opacity = isColliding
      ? 0.6 + 0.3 * Math.sin(state.clock.elapsedTime * 8)
      : 0.15 + 0.1 * Math.sin(state.clock.elapsedTime * 2);
  });

  const points = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.5, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(2.5, 0, 0),
    ]);
  }, []);

  return (
    <line ref={ref as any} geometry={points}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
    </line>
  );
}

// ─── Main exported component ─────────────────────────────────
export default function ParticleField({
  theoryA,
  theoryB,
  isColliding,
}: {
  theoryA?: CollisionTheory | null;
  theoryB?: CollisionTheory | null;
  isColliding: boolean;
}) {
  const colorA = theoryA ? (DOMAIN_COLORS[theoryA.domain as DomainKey] ?? "#666") : "#666";
  const colorB = theoryB ? (DOMAIN_COLORS[theoryB.domain as DomainKey] ?? "#666") : "#666";

  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden border border-border/30 bg-background/50">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <AmbientDust />

        {theoryA && (
          <TheoryParticles
            theory={theoryA}
            side="left"
            isColliding={isColliding}
            otherSelected={!!theoryB}
          />
        )}
        {theoryB && (
          <TheoryParticles
            theory={theoryB}
            side="right"
            isColliding={isColliding}
            otherSelected={!!theoryA}
          />
        )}

        {theoryA && theoryB && (
          <ConnectionLines theoryA={theoryA} theoryB={theoryB} isColliding={isColliding} />
        )}

        {isColliding && <CollisionBurst colorA={colorA} colorB={colorB} />}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI * 0.7}
          minPolarAngle={Math.PI * 0.3}
        />
      </Canvas>
    </div>
  );
}
