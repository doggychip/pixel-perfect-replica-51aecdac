import { useMemo } from "react";
import type { CollisionTheory } from "@/data/collision-theories";

type Phase = "idle" | "windup" | "beam" | "collide" | "explosion" | "reform" | "emerge";

const COLORS_A = "#00ffff";
const COLORS_B = "#ff00ff";

export default function HUD({
  theoryA,
  theoryB,
  phase,
  phaseProgress,
}: {
  theoryA?: CollisionTheory;
  theoryB?: CollisionTheory;
  phase: Phase;
  phaseProgress: number;
}) {
  const countA = theoryA ? Math.min(300, 140 + theoryA.factors.length * 30) : 0;
  const countB = theoryB ? Math.min(300, 140 + theoryB.factors.length * 30) : 0;
  const emergentCount = Math.floor((countA + countB) * 0.8);
  const totalParticles = phase === "emerge" ? emergentCount : countA + countB;

  const collisionEnergy = useMemo(() => {
    if (phase === "idle") return 0;
    if (phase === "windup") return Math.round(phaseProgress * 20);
    if (phase === "beam") return 20 + Math.round(phaseProgress * 30);
    if (phase === "collide") return 50 + Math.round(phaseProgress * 30);
    if (phase === "explosion") return 80 + Math.round(phaseProgress * 15);
    if (phase === "reform") return 95 + Math.round(phaseProgress * 5);
    return 100;
  }, [phase, phaseProgress]);

  const phaseLabel = {
    idle: "STANDBY",
    windup: "⚡ COMPRESSING",
    beam: "🔀 BEAM ACCELERATING",
    collide: "🌀 SPIRAL MERGE",
    explosion: "💥 IMPACT",
    reform: "🔄 REFORMING",
    emerge: "✨ EMERGENCE",
  }[phase];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      <div className="absolute top-3 left-3">
        <div className="font-mono text-[10px] space-y-1 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
          <div className="text-white/30 uppercase tracking-[0.2em] text-[8px] mb-1">Particle Collider</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS_A, boxShadow: `0 0 4px ${COLORS_A}` }} />
            <span className="text-white/50">A:</span>
            <span className="text-white/80">{countA}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS_B, boxShadow: `0 0 4px ${COLORS_B}` }} />
            <span className="text-white/50">B:</span>
            <span className="text-white/80">{countB}</span>
          </div>
          <div className="border-t border-white/5 pt-1 mt-1">
            <span className="text-white/30">TOTAL: </span>
            <span className="text-white/70">{totalParticles}</span>
            {phase === "emerge" && (
              <span className="text-red-400/60 text-[8px] ml-1">(-{countA + countB - emergentCount} annihilated)</span>
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3">
        <div className="font-mono text-[10px] bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
          <div className="text-white/30 uppercase tracking-[0.2em] text-[8px] mb-1">Collision Energy</div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${collisionEnergy}%`,
                  background: `linear-gradient(90deg, ${COLORS_A}, #fff, ${COLORS_B})`,
                  boxShadow: collisionEnergy > 50 ? "0 0 8px rgba(255,255,255,0.5)" : undefined,
                }}
              />
            </div>
            <span className="text-white/70 w-8 text-right">{collisionEnergy}%</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/5"
          style={{
            color: phase === "idle" ? "rgba(255,255,255,0.3)" : phase === "emerge" ? "#ffaa00" : "#ffffff",
            textShadow: phase !== "idle" ? "0 0 10px rgba(255,255,255,0.3)" : undefined,
          }}
        >
          {phaseLabel}
        </div>
      </div>
    </div>
  );
}
