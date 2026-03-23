import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

// ─── Floating label above particle cloud ─────────────────────
function TheoryLabel({
  theory,
  side,
  isColliding,
}: {
  theory: CollisionTheory;
  side: "left" | "right";
  isColliding: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colorHex = DOMAIN_COLORS[theory.domain as DomainKey] ?? "#888888";
  const baseX = side === "left" ? -2.5 : 2.5;

  useFrame((state) => {
    if (!groupRef.current) return;
    const targetX = isColliding ? 0 : baseX;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.03;
    // Gentle float
    groupRef.current.position.y = 1.8 + Math.sin(state.clock.elapsedTime * 0.8 + (side === "left" ? 0 : Math.PI)) * 0.08;
  });

  return (
    <group ref={groupRef} position={[baseX, 1.8, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.22}
          color={colorHex}
          anchorX="center"
          anchorY="bottom"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2"
          maxWidth={3}
          textAlign="center"
        >
          {theory.name}
        </Text>
        <Text
          fontSize={0.14}
          color={colorHex}
          anchorX="center"
          anchorY="top"
          position={[0, -0.08, 0]}
          fillOpacity={0.5}
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.woff2"
        >
          {theory.nameCn}
        </Text>
      </Billboard>
    </group>
  );
}

// ─── Factor-based motion pattern classification ─────────────
// Each factor keyword maps to a motion archetype that shapes particle behavior
type MotionPattern = "orbital" | "wave" | "chaotic" | "pulsing" | "spiral" | "lattice";

const FACTOR_MOTION_MAP: Record<string, MotionPattern> = {
  // Orbital — stable, circular, predictable
  "state space": "orbital", "probability amplitude": "orbital", "basin of attraction": "orbital",
  "stability": "orbital", "contraction": "orbital", "continuity": "orbital",
  "structural connectivity": "orbital", "functional connectivity": "orbital",
  "local-global relationship": "orbital", "charts": "orbital", "smooth structure": "orbital",
  "local triviality": "orbital", "connection": "orbital", "parallel transport": "orbital",
  
  // Wave — sinusoidal, flowing, interference
  "complementarity": "wave", "observation context": "wave", "interference": "wave",
  "frequency bands": "wave", "synchronization": "wave", "phase coupling": "wave",
  "prediction error": "wave", "generative model": "wave", "precision weighting": "wave",
  "top-down predictions": "wave", "bottom-up errors": "wave", "hierarchical inference": "wave",
  "cycles": "wave", "boundaries": "wave", "filtration": "wave",
  
  // Chaotic — turbulent, unpredictable, butterfly-like
  "butterfly effect": "chaotic", "strange attractors": "chaotic", "fractal boundaries": "chaotic",
  "power laws": "chaotic", "avalanches": "chaotic", "sandpile model": "chaotic",
  "bifurcation": "chaotic", "perturbation": "chaotic", "algorithmic randomness": "chaotic",
  "critical point": "chaotic", "symmetry breaking": "chaotic",
  
  // Pulsing — rhythmic expansion/contraction
  "measurement collapse": "pulsing", "non-locality": "pulsing", "correlation": "pulsing",
  "co-activation": "pulsing", "long-term potentiation": "pulsing", "synaptic plasticity": "pulsing",
  "broadcasting": "pulsing", "access": "pulsing", "workspace ignition": "pulsing",
  "integration": "pulsing", "differentiation": "pulsing", "causal power": "pulsing",
  "positive feedback": "pulsing", "negative feedback": "pulsing",
  
  // Spiral — helical paths, DNA-like
  "information leakage": "spiral", "classical emergence": "spiral", "environment coupling": "spiral",
  "entropy export": "spiral", "self-organization": "spiral", "energy flow": "spiral",
  "operational closure": "spiral", "structural coupling": "spiral", "self-production": "spiral",
  "winding numbers": "spiral", "knot invariants": "spiral", "linking number": "spiral",
  "invariants": "spiral", "topological order": "spiral",
  
  // Lattice — grid-like, structured, crystalline
  "probability distribution": "lattice", "surprise": "lattice", "compression": "lattice",
  "redundancy": "lattice", "noise tolerance": "lattice", "capacity bounds": "lattice",
  "compressibility": "lattice", "minimal description": "lattice",
  "network topology": "lattice", "Betti numbers": "lattice", "persistence diagram": "lattice",
  "critical points": "lattice", "index": "lattice", "gradient flow": "lattice",
};

function classifyFactors(factors: string[]): MotionPattern[] {
  return factors.map(f => FACTOR_MOTION_MAP[f] ?? "orbital");
}

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
  
  // More factors = more particles (base 80, +60 per factor)
  const factorCount = theory.factors.length;
  const count = Math.min(400, 80 + factorCount * 60);
  const motionPatterns = useMemo(() => classifyFactors(theory.factors), [theory.factors]);
  
  const colorHex = DOMAIN_COLORS[theory.domain as DomainKey] ?? "#888888";
  const baseX = side === "left" ? -2.5 : 2.5;

  const { positions, velocities, sizes, patternAssign } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const pa = new Uint8Array(count); // which factor/pattern each particle belongs to
    
    for (let i = 0; i < count; i++) {
      // Assign particle to a factor group
      pa[i] = i % factorCount;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 0.5 + Math.random() * 0.9;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      vel[i * 3] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.015;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
      sz[i] = 2 + Math.random() * 4;
    }
    return { positions: pos, velocities: vel, sizes: sz, patternAssign: pa };
  }, [theory.id, count, factorCount]);

  const color = useMemo(() => new THREE.Color(colorHex), [colorHex]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;

    // Move group toward center when colliding
    const targetX = isColliding ? 0 : baseX;
    meshRef.current.position.x += (targetX - meshRef.current.position.x) * 0.03;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const x = positions[ix];
      const y = positions[ix + 1];
      const z = positions[ix + 2];
      const pattern = motionPatterns[patternAssign[i]] ?? "orbital";
      const seed = i * 0.1;

      let nx: number, ny: number, nz: number;

      switch (pattern) {
        case "orbital": {
          // Smooth circular orbits
          const a = t * 0.4 + seed;
          const c = Math.cos(a * 0.02);
          const s = Math.sin(a * 0.02);
          nx = x * c - z * s;
          ny = y + velocities[ix + 1] * Math.cos(t * 0.5 + i);
          nz = x * s + z * c;
          break;
        }
        case "wave": {
          // Sinusoidal wave motion — particles ripple up/down
          const waveFreq = 1.5 + (patternAssign[i] % 3) * 0.5;
          const waveAmp = 0.15;
          nx = x + velocities[ix] * Math.sin(t * 0.8 + seed);
          ny = y + waveAmp * Math.sin(t * waveFreq + x * 3);
          nz = z + velocities[ix + 2] * Math.cos(t * 0.6 + seed);
          break;
        }
        case "chaotic": {
          // Lorenz-inspired turbulent jitter
          const jx = Math.sin(t * 2.3 + seed * 7) * 0.12;
          const jy = Math.cos(t * 1.7 + seed * 11) * 0.12;
          const jz = Math.sin(t * 3.1 + seed * 13) * 0.12;
          nx = x + jx + velocities[ix] * Math.sin(t * 1.5 + i);
          ny = y + jy + velocities[ix + 1] * Math.cos(t * 2.1 + i);
          nz = z + jz + velocities[ix + 2] * Math.sin(t * 1.8 + i);
          break;
        }
        case "pulsing": {
          // Rhythmic expand/contract from center
          const pulseRate = 1.2 + (patternAssign[i] % 2) * 0.6;
          const pulseScale = 1 + 0.25 * Math.sin(t * pulseRate + seed);
          nx = x * pulseScale;
          ny = y * pulseScale;
          nz = z * pulseScale;
          break;
        }
        case "spiral": {
          // Helical ascending/descending paths
          const spiralT = t * 0.6 + seed;
          const spiralR = Math.sqrt(x * x + z * z);
          nx = spiralR * Math.cos(spiralT * 0.5 + Math.atan2(z, x));
          ny = y + 0.08 * Math.sin(spiralT * 1.5);
          nz = spiralR * Math.sin(spiralT * 0.5 + Math.atan2(z, x));
          break;
        }
        case "lattice": {
          // Subtle structured vibration — grid-locked with tremor
          const gridSnap = 0.3;
          const gx = Math.round(x / gridSnap) * gridSnap;
          const gy = Math.round(y / gridSnap) * gridSnap;
          const gz = Math.round(z / gridSnap) * gridSnap;
          const tremor = 0.04;
          nx = gx + tremor * Math.sin(t * 3 + seed * 5);
          ny = gy + tremor * Math.cos(t * 2.5 + seed * 7);
          nz = gz + tremor * Math.sin(t * 2.8 + seed * 3);
          break;
        }
      }

      // Global breathing
      const breathe = 1 + 0.06 * Math.sin(t * 0.4 + i * 0.03);
      nx *= breathe;
      ny *= breathe;
      nz *= breathe;

      // Collision compression
      if (isColliding) {
        nx *= 0.96;
        ny *= 0.96;
        nz *= 0.96;
      }

      posAttr.setXYZ(i, nx, ny, nz);
    }
    posAttr.needsUpdate = true;

    // Pulse opacity
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
    <primitive object={new THREE.Line(points, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }))} ref={ref} />
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
