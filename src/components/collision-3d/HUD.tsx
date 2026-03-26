import { useMemo } from "react";
import type { CollisionTheory, DomainKey } from "@/data/collision-theories";
import { DOMAIN_COLORS } from "@/data/collision-theories";

type Phase = "idle" | "beam" | "collide" | "emerge";

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
  const countA = theoryA ? Math.min(300, 80 + theoryA.factors.length * 50) : 0;
  const countB = theoryB ? Math.min(300, 80 + theoryB.factors.length * 50) : 0;
  const totalParticles = countA + countB + (phase === "emerge" ? 250 : 0);

  const colorA = theoryA ? DOMAIN_COLORS[theoryA.domain as DomainKey] ?? "#3b82f6" : "#333";
  const colorB = theoryB ? DOMAIN_COLORS[theoryB.domain as DomainKey] ?? "#ef4444" : "#333";

  const collisionEnergy = useMemo(() => {
    if (phase === "idle") return 0;
    if (phase === "beam") return Math.round(phaseProgress * 40);
    if (phase === "collide") return 40 + Math.round(phaseProgress * 55);
    if (phase === "explode") return 95 + Math.round(phaseProgress * 5);
    return 100;
  }, [phase, phaseProgress]);

  const phaseLabel = {
    idle: "STANDBY",
    beam: "⚡ BEAM ACCELERATING",
    collide: "💥 COLLISION IN PROGRESS",
    explode: "🌟 IMPACT DETECTED",
    emerge: "✨ EMERGENCE FORMING",
  }[phase];

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10">
      {/* Top-left: Particle stats */}
      <div className="absolute top-3 left-3">
        <div className="font-mono text-[10px] space-y-1 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
          <div className="text-white/30 uppercase tracking-[0.2em] text-[8px] mb-1">Particle Collider</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: colorA, boxShadow: `0 0 4px ${colorA}` }} />
            <span className="text-white/50">A:</span>
            <span className="text-white/80">{countA}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: colorB, boxShadow: `0 0 4px ${colorB}` }} />
            <span className="text-white/50">B:</span>
            <span className="text-white/80">{countB}</span>
          </div>
          <div className="border-t border-white/5 pt-1 mt-1">
            <span className="text-white/30">TOTAL: </span>
            <span className="text-white/70">{totalParticles}</span>
          </div>
        </div>
      </div>

      {/* Top-right: Collision energy */}
      <div className="absolute top-3 right-3">
        <div className="font-mono text-[10px] bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/5">
          <div className="text-white/30 uppercase tracking-[0.2em] text-[8px] mb-1">Collision Energy</div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${collisionEnergy}%`,
                  background: `linear-gradient(90deg, ${colorA}, #fff, ${colorB})`,
                  boxShadow: collisionEnergy > 50 ? `0 0 8px rgba(255,255,255,0.5)` : undefined,
                }}
              />
            </div>
            <span className="text-white/70 w-8 text-right">{collisionEnergy}%</span>
          </div>
        </div>
      </div>

      {/* Bottom-center: Phase indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.3em] px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/5"
          style={{
            color: phase === "idle" ? "rgba(255,255,255,0.3)" : phase === "emerge" ? "#fbbf24" : "#ffffff",
            textShadow: phase !== "idle" ? "0 0 10px rgba(255,255,255,0.3)" : undefined,
          }}
        >
          {phaseLabel}
        </div>
      </div>
    </div>
  );
}
