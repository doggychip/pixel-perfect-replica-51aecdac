import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import AgentPillar from "./heatmap/AgentPillar";
import Ground from "./heatmap/Ground";
import RealmLabels from "./heatmap/RealmLabels";
import ParticleTrails from "./heatmap/ParticleTrails";
import { computeAgentPositions } from "./heatmap/utils";
import type { AgentData } from "./heatmap/types";

export type { AgentData };

export default function AgentHeatmap3D({ agents }: { agents: AgentData[] }) {
  const positions = useMemo(() => computeAgentPositions(agents), [agents]);

  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden border border-border bg-[#060d14]">
      <Canvas
        camera={{ position: [8, 6, 8], fov: 50 }}
        dpr={[1, 1.25]}
        gl={{ powerPreference: "high-performance", antialias: true }}
      >
        <color attach="background" args={["#060d14"]} />
        <fog attach="fog" args={["#060d14", 12, 22]} />

        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 8, 5]} intensity={0.4} color="#88ccee" />
        <pointLight position={[-4, 4, -4]} intensity={0.3} color="#a78bfa" />
        <pointLight position={[4, 4, -4]} intensity={0.3} color="#fbbf24" />
        <pointLight position={[0, 4, 4]} intensity={0.3} color="#22d3ee" />

        <Ground />
        <RealmLabels />

        {positions.map((pos, i) => (
          <AgentPillar key={pos.agent.id ?? i} pos={pos} index={i} />
        ))}

        <ParticleTrails positions={positions} />

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
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
