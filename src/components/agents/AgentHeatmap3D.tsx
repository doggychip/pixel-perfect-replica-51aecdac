import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

// ─── Types ───
interface AgentData {
  id: string;
  role?: string;
  realm?: string;
  budget?: number;
  avg_score?: number;
  score?: number;
  status?: string;
  generation?: number;
}

// ─── Color by performance score ───
function scoreColor(score: number): THREE.Color {
  // 0 = red, 0.5 = amber, 1.0 = cyan/green
  const t = Math.max(0, Math.min(1, score));
  if (t < 0.5) {
    const s = t / 0.5;
    return new THREE.Color().setHSL(0.05 * s + 0.0, 0.85, 0.45 + s * 0.1);
  }
  const s = (t - 0.5) / 0.5;
  return new THREE.Color().setHSL(0.05 + s * 0.45, 0.8, 0.5 + s * 0.1);
}

// ─── Realm position offsets ───
const REALM_ZONES: Record<string, { cx: number; cz: number }> = {
  research: { cx: -3, cz: -1 },
  execution: { cx: 3, cz: -1 },
  central: { cx: 0, cz: 3 },
};

// ─── Single agent pillar ───
function AgentPillar({ agent, index, total }: { agent: AgentData; index: number; total: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const score = agent.avg_score ?? agent.score ?? 0.5;
  const alive = agent.status === "alive" || agent.status === "active";
  const realm = agent.realm ?? "central";
  const zone = REALM_ZONES[realm] ?? REALM_ZONES.central;

  // Spread agents within their realm zone
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 + index * 0.618;
  const radius = 1.2 + (index % 3) * 0.6;
  const x = zone.cx + Math.cos(angle) * radius;
  const z = zone.cz + Math.sin(angle) * radius;

  const height = Math.max(0.2, score * 3);
  const color = useMemo(() => scoreColor(score), [score]);
  const budget = agent.budget ?? 100;
  const thickness = Math.max(0.08, Math.min(0.35, budget / 1000));

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle breathing effect
    const breathe = 1 + Math.sin(t * 1.5 + index) * 0.04;
    meshRef.current.scale.y = breathe;
    // Glow pulse for alive agents
    if (glowRef.current) {
      const pulse = alive ? 0.4 + Math.sin(t * 2 + index * 0.7) * 0.25 : 0.1;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Main pillar */}
      <mesh ref={meshRef} position={[0, height / 2, 0]}>
        <boxGeometry args={[thickness, height, thickness]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={alive ? 0.6 : 0.1}
          transparent
          opacity={alive ? 0.9 : 0.35}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      {/* Top glow cap */}
      <mesh ref={glowRef} position={[0, height + 0.1, 0]}>
        <sphereGeometry args={[thickness * 1.5, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[thickness * 0.8, thickness * 1.6, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Ground grid ───
function Ground() {
  return (
    <group>
      <gridHelper args={[16, 24, "#1a3040", "#0d1a24"]} position={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#060d14" roughness={1} />
      </mesh>
    </group>
  );
}

// ─── Realm labels ───
function RealmLabels() {
  const labels = [
    { text: "🔬 Research", pos: [-3, 0.05, -2.8] as [number, number, number], color: "#a78bfa" },
    { text: "⚡ Execution", pos: [3, 0.05, -2.8] as [number, number, number], color: "#fbbf24" },
    { text: "🏛 Central", pos: [0, 0.05, 5] as [number, number, number], color: "#22d3ee" },
  ];
  return (
    <>
      {labels.map((l) => (
        <Text
          key={l.text}
          position={l.pos}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.35}
          color={l.color}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {l.text}
        </Text>
      ))}
    </>
  );
}

// ─── Main exported component ───
export default function AgentHeatmap3D({ agents }: { agents: AgentData[] }) {
  // Group agents by realm for positioning
  const realmGroups = useMemo(() => {
    const groups: Record<string, AgentData[]> = { research: [], execution: [], central: [] };
    agents.forEach((a) => {
      const realm = a.realm ?? "central";
      if (!groups[realm]) groups[realm] = [];
      groups[realm].push(a);
    });
    return groups;
  }, [agents]);

  // Flatten with realm-local indices
  const positioned = useMemo(() => {
    const result: { agent: AgentData; idx: number; total: number }[] = [];
    Object.values(realmGroups).forEach((group) => {
      group.forEach((agent, idx) => {
        result.push({ agent, idx, total: group.length });
      });
    });
    return result;
  }, [realmGroups]);

  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden border border-border bg-[#060d14]">
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        dpr={[1, 1.25]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <color attach="background" args={["#060d14"]} />
        <fog attach="fog" args={["#060d14", 12, 22]} />

        {/* Lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 8, 5]} intensity={0.4} color="#88ccee" />
        <pointLight position={[-4, 4, -4]} intensity={0.3} color="#a78bfa" />
        <pointLight position={[4, 4, -4]} intensity={0.3} color="#fbbf24" />
        <pointLight position={[0, 4, 4]} intensity={0.3} color="#22d3ee" />

        <Ground />
        <RealmLabels />

        {positioned.map(({ agent, idx, total }) => (
          <AgentPillar
            key={agent.id ?? idx}
            agent={agent}
            index={idx}
            total={total}
          />
        ))}

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={4}
          maxDistance={18}
          autoRotate
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
