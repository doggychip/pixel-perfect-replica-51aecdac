import { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Atom, Zap, RotateCcw } from "lucide-react";
import {
  THEORIES, DOMAINS, DOMAIN_COLORS,
  type CollisionTheory, type DomainKey,
} from "@/data/collision-theories";

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
  const count = theory.factors.length * 12;
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
      const targetX = position[0] > 0 ? position[0] - 1.5 : position[0] + 1.5;
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
        <pointsMaterial color={threeColor} size={0.12} sizeAttenuation transparent opacity={0.85} />
      </points>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Text
          fontSize={0.35}
          color={color}
          anchorX="center"
          anchorY="bottom"
          position={[0, 2, 0]}
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {theory.name}
        </Text>
        {theory.nameZh && (
          <Text
            fontSize={0.22}
            color={color}
            anchorX="center"
            anchorY="top"
            position={[0, 1.85, 0]}
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {theory.nameZh}
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
      const scale = t * 3;
      meshRef.current.scale.setScalar(scale);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

// ─── Scene ───────────────────────────────────────────────────
function ColliderScene({
  theoryA,
  theoryB,
  colorA,
  colorB,
  colliding,
}: {
  theoryA: CollisionTheory | null;
  theoryB: CollisionTheory | null;
  colorA: string;
  colorB: string;
  colliding: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.6} />
      <Stars radius={50} depth={30} count={800} factor={3} fade speed={1} />
      <OrbitControls enablePan={false} maxDistance={15} minDistance={4} />
      {theoryA && (
        <ParticleCloud theory={theoryA} position={[-3, 0, 0]} color={colorA} colliding={colliding} />
      )}
      {theoryB && (
        <ParticleCloud theory={theoryB} position={[3, 0, 0]} color={colorB} colliding={colliding} />
      )}
      <CollisionFlash active={colliding} />
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────
export default function TheoryCollider3DPage() {
  const [theoryA, setTheoryA] = useState<CollisionTheory | null>(null);
  const [theoryB, setTheoryB] = useState<CollisionTheory | null>(null);
  const [colliding, setColliding] = useState(false);

  const colorA = theoryA ? (DOMAIN_COLORS[theoryA.domain as DomainKey] || "#06b6d4") : "#06b6d4";
  const colorB = theoryB ? (DOMAIN_COLORS[theoryB.domain as DomainKey] || "#a855f7") : "#a855f7";

  const handleCollide = () => {
    if (!theoryA || !theoryB) return;
    setColliding(true);
    setTimeout(() => setColliding(false), 3000);
  };

  const handleReset = () => {
    setTheoryA(null);
    setTheoryB(null);
    setColliding(false);
  };

  const selectTheory = (t: CollisionTheory) => {
    if (!theoryA) setTheoryA(t);
    else if (!theoryB && t.id !== theoryA.id) setTheoryB(t);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Atom className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">3D Theory Collider</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={handleCollide}
            disabled={!theoryA || !theoryB || colliding}
            className="gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" /> Collide
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Theory selector sidebar */}
        <div className="w-64 border-r border-border bg-card flex-shrink-0">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Select Two Theories</p>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="p-2 space-y-1">
              {THEORIES.map((t) => {
                const isSelected = t.id === theoryA?.id || t.id === theoryB?.id;
                const domainColor = DOMAIN_COLORS[t.domain as DomainKey] || "#888";
                return (
                  <button
                    key={t.id}
                    onClick={() => selectTheory(t)}
                    disabled={isSelected}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: domainColor }}
                      />
                      <span className="truncate">{t.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground ml-4">
                      {t.factors.length} factors
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* 3D Canvas */}
        <div className="flex-1 bg-background relative">
          {/* Selected theory badges */}
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            {theoryA && (
              <Badge variant="outline" className="bg-card/80 backdrop-blur-sm" style={{ borderColor: colorA, color: colorA }}>
                A: {theoryA.name}
              </Badge>
            )}
            {theoryB && (
              <Badge variant="outline" className="bg-card/80 backdrop-blur-sm" style={{ borderColor: colorB, color: colorB }}>
                B: {theoryB.name}
              </Badge>
            )}
          </div>

          <Canvas camera={{ position: [0, 0, 8], fov: 55 }}>
            <Suspense fallback={null}>
              <ColliderScene
                theoryA={theoryA}
                theoryB={theoryB}
                colorA={colorA}
                colorB={colorB}
                colliding={colliding}
              />
            </Suspense>
          </Canvas>

          {!theoryA && !theoryB && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">Select two theories from the sidebar to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
