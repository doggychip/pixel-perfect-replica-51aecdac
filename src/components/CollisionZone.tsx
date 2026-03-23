import { useState } from "react";
import { type Theory, DOMAIN_COLORS, COLLISION_MODES } from "@/data/theories";
import { type CollisionResult } from "@/types/collision";
import { collideWithClaude, getApiKey } from "@/lib/claudeApi";
import { generateCollision } from "@/lib/collisionEngine";
import { Button } from "@/components/ui/button";
import { Zap, Atom, AlertTriangle, Star, ArrowRight, Sparkles } from "lucide-react";

interface Props {
  selected: Theory[];
  onResult: (result: CollisionResult) => void;
  isColliding: boolean;
  setIsColliding: (v: boolean) => void;
  currentResult: CollisionResult | null;
}

const domainHexMap: Record<string, string> = {
  quantum: "#00fff5",
  cognitive: "#a855f7",
  dynamic: "#22c55e",
  information: "#f59e0b",
  topology: "#ec4899",
  neuroscience: "#3b82f6",
};

export function CollisionZone({ selected, onResult, isColliding, setIsColliding, currentResult }: Props) {
  const [mode, setMode] = useState("Fuse");
  const [error, setError] = useState<string | null>(null);

  const theoryA = selected[0] || null;
  const theoryB = selected[1] || null;
  const canCollide = theoryA && theoryB && !isColliding;

  const modeObj = COLLISION_MODES.find((m) => m.value === mode)!;

  const colorA = theoryA ? domainHexMap[DOMAIN_COLORS[theoryA.domain]] : "#00fff5";
  const colorB = theoryB ? domainHexMap[DOMAIN_COLORS[theoryB.domain]] : "#a855f7";

  const handleCollide = async () => {
    if (!canCollide || !theoryA || !theoryB) return;
    setIsColliding(true);
    setError(null);

    const apiKey = getApiKey();
    try {
      let result: CollisionResult;
      if (apiKey) {
        result = await collideWithClaude(theoryA, theoryB, mode, modeObj.desc, apiKey);
      } else {
        await new Promise((r) => setTimeout(r, 1800));
        result = generateCollision(theoryA, theoryB, mode);
      }
      onResult(result);
    } catch (e: any) {
      setError(e.message || "Collision failed");
    } finally {
      setIsColliding(false);
    }
  };

  const scoreColor = (s: number) => (s >= 8 ? "text-dynamic" : s >= 5 ? "text-information" : "text-destructive");

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text mb-3 px-1">
        Collision Zone
      </h2>

      {/* Theory Slots with VS */}
      <div className="flex gap-3 mb-4 items-stretch">
        <TheorySlot theory={theoryA} label="Theory A" />
        
        {/* VS Area */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[140px]">
          <Zap className="w-6 h-6 text-primary" />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full bg-secondary border border-border rounded px-2 py-1.5 text-[11px] font-mono text-foreground focus:outline-none focus:border-primary/50"
          >
            {COLLISION_MODES.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <p className="text-[9px] text-muted-foreground text-center leading-tight">{modeObj.desc}</p>
        </div>

        <TheorySlot theory={theoryB} label="Theory B" />
      </div>

      {/* Collide Button */}
      <Button
        onClick={handleCollide}
        disabled={!canCollide}
        className="w-full mb-4 h-14 font-display font-bold tracking-wider uppercase text-lg rounded-lg transition-all active:scale-95 disabled:opacity-50"
        style={{
          background: canCollide
            ? `linear-gradient(135deg, ${colorA}, ${colorB})`
            : undefined,
          color: canCollide ? "hsl(var(--background))" : undefined,
          boxShadow: canCollide ? `0 0 30px ${colorA}40, 0 0 30px ${colorB}40` : undefined,
        }}
      >
        {isColliding ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⚡</span> COLLIDING...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5" /> COLLIDE
          </span>
        )}
      </Button>

      {/* Collision Animation */}
      {isColliding && (
        <div className="relative h-[120px] mb-4">
          <div
            className="absolute w-16 h-16 rounded-full animate-collision-left"
            style={{
              background: `radial-gradient(circle, ${colorA}, transparent)`,
              boxShadow: `0 0 30px ${colorA}80`,
            }}
          />
          <div
            className="absolute w-16 h-16 rounded-full animate-collision-right"
            style={{
              background: `radial-gradient(circle, ${colorB}, transparent)`,
              boxShadow: `0 0 30px ${colorB}80`,
            }}
          />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full animate-collision-flash"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-4">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Result Card */}
      {currentResult && !isColliding && (
        <div className="flex-1 overflow-y-auto neon-border rounded-lg p-4 bg-card/40 space-y-4 min-h-0">
          <div className="flex items-start justify-between">
            <h3 className="font-display text-lg font-bold text-primary neon-text">{currentResult.framework_name}</h3>
            <div className={`flex items-center gap-1 bg-card px-2 py-1 rounded ${scoreColor(currentResult.quality_score)}`}>
              <Star className="w-4 h-4" />
              <span className="font-display font-bold text-lg">{currentResult.quality_score}</span>
              <span className="text-xs opacity-60">/10</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground font-mono">
            {currentResult.theoryA.name} × {currentResult.theoryB.name} · {currentResult.mode}
          </p>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Core Insight</h4>
            <p className="text-sm text-foreground/90 leading-relaxed">{currentResult.core_insight}</p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Structural Similarities</h4>
            <ul className="space-y-1">
              {currentResult.structural_similarities.map((s, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Novel Connections</h4>
            <ul className="space-y-1">
              {currentResult.novel_connections.map((c, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" /> {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Applications</h4>
            <div className="flex flex-wrap gap-1.5">
              {currentResult.practical_applications.map((a, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-mono">
                  {a}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-2">{currentResult.reasoning}</p>
        </div>
      )}

      {!currentResult && !isColliding && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Atom className="w-12 h-12 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm font-mono text-center">
            Select 2 theories and collide them
          </p>
        </div>
      )}
    </div>
  );
}

function TheorySlot({ theory, label }: { theory: Theory | null; label: string }) {
  if (!theory) {
    return (
      <div className="flex-1 border border-dashed border-border/50 rounded-lg p-4 flex items-center justify-center min-h-[120px]">
        <span className="text-muted-foreground text-sm font-mono">Select {label}</span>
      </div>
    );
  }

  const ck = DOMAIN_COLORS[theory.domain];
  const hex = {
    quantum: "#00fff5", cognitive: "#a855f7", dynamic: "#22c55e",
    information: "#f59e0b", topology: "#ec4899", neuroscience: "#3b82f6",
  }[ck] || "#00fff5";

  return (
    <div
      className="flex-1 border rounded-lg p-4 min-h-[120px] bg-card/40"
      style={{ borderColor: `${hex}30` }}
    >
      <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: hex }}>
        {theory.domain}
      </span>
      <h3 className="font-display text-sm font-bold mt-1" style={{ color: hex }}>{theory.name}</h3>
      <p className="text-xs text-muted-foreground mt-1">{theory.chinese}</p>
      <p className="text-xs text-foreground/70 mt-2 leading-relaxed line-clamp-2">{theory.core}</p>
    </div>
  );
}
