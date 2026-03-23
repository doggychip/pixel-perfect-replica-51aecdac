import { useState } from "react";
import { type Theory, DOMAIN_COLORS, COLLISION_MODES } from "@/data/theories";
import { type CollisionResult } from "@/types/collision";
import { generateCollision } from "@/lib/collisionEngine";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface Props {
  selected: Theory[];
  onResult: (result: CollisionResult) => void;
  isColliding: boolean;
  setIsColliding: (v: boolean) => void;
  currentResult: CollisionResult | null;
}

const domainTextMap: Record<string, string> = {
  quantum: "text-quantum",
  cognitive: "text-cognitive",
  dynamic: "text-dynamic",
  information: "text-information",
  topology: "text-topology",
  neuroscience: "text-neuroscience",
};

const domainBorderMap: Record<string, string> = {
  quantum: "border-quantum/30",
  cognitive: "border-cognitive/30",
  dynamic: "border-dynamic/30",
  information: "border-information/30",
  topology: "border-topology/30",
  neuroscience: "border-neuroscience/30",
};

export function CollisionZone({
  selected,
  onResult,
  isColliding,
  setIsColliding,
  currentResult,
}: Props) {
  const [mode, setMode] = useState("Fuse");

  const theoryA = selected[0] || null;
  const theoryB = selected[1] || null;
  const canCollide = theoryA && theoryB && !isColliding;

  const handleCollide = async () => {
    if (!canCollide || !theoryA || !theoryB) return;
    setIsColliding(true);

    // Simulate processing delay for animation
    await new Promise((r) => setTimeout(r, 1800));

    const result = generateCollision(theoryA, theoryB, mode);
    onResult(result);
    setIsColliding(false);
  };

  const renderTheorySlot = (theory: Theory | null, label: string) => {
    if (!theory) {
      return (
        <div className="flex-1 border border-dashed border-border/50 rounded-lg p-4 flex items-center justify-center min-h-[120px]">
          <span className="text-muted-foreground text-sm font-mono">Select {label}</span>
        </div>
      );
    }
    const ck = DOMAIN_COLORS[theory.domain];
    return (
      <div className={`flex-1 border rounded-lg p-4 min-h-[120px] ${domainBorderMap[ck]} bg-card/40`}>
        <span className={`text-[10px] font-mono uppercase tracking-wider ${domainTextMap[ck]}`}>
          {theory.domain}
        </span>
        <h3 className={`font-display text-sm font-bold mt-1 ${domainTextMap[ck]}`}>{theory.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{theory.chinese}</p>
        <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{theory.core}</p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text mb-3 px-1">
        Collision Zone
      </h2>

      {/* Theory Slots */}
      <div className="flex gap-3 mb-4">
        {renderTheorySlot(theoryA, "Theory A")}
        {renderTheorySlot(theoryB, "Theory B")}
      </div>

      {/* Mode Selector */}
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm font-mono text-foreground mb-4 focus:outline-none focus:border-primary/50"
      >
        {COLLISION_MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label} — {m.desc}
          </option>
        ))}
      </select>

      {/* Collide Button */}
      <Button
        variant="collide"
        size="xl"
        onClick={handleCollide}
        disabled={!canCollide}
        className="w-full mb-4"
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
        <div className="flex items-center justify-center py-8 relative">
          <div
            className="w-16 h-16 rounded-full animate-collide-left"
            style={{
              background: `hsl(var(--${theoryA ? DOMAIN_COLORS[theoryA.domain] : "primary"}) / 0.6)`,
              boxShadow: `0 0 30px hsl(var(--${theoryA ? DOMAIN_COLORS[theoryA.domain] : "primary"}) / 0.5)`,
            }}
          />
          <div
            className="w-16 h-16 rounded-full animate-collide-right"
            style={{
              background: `hsl(var(--${theoryB ? DOMAIN_COLORS[theoryB.domain] : "accent"}) / 0.6)`,
              boxShadow: `0 0 30px hsl(var(--${theoryB ? DOMAIN_COLORS[theoryB.domain] : "accent"}) / 0.5)`,
            }}
          />
          <div
            className="absolute w-24 h-24 rounded-full animate-flash"
            style={{
              background: "hsl(var(--primary) / 0.3)",
              boxShadow: "0 0 60px hsl(var(--primary) / 0.8)",
            }}
          />
        </div>
      )}

      {/* Result Card */}
      {currentResult && !isColliding && (
        <div className="flex-1 overflow-y-auto neon-border rounded-lg p-4 bg-card/40 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-primary neon-text">{currentResult.framework_name}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                {currentResult.theoryA.name} × {currentResult.theoryB.name} · {currentResult.mode}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
              <span className="text-primary font-display font-bold text-lg">{currentResult.quality_score}</span>
              <span className="text-primary/60 text-xs">/10</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Core Insight</h4>
            <p className="text-sm text-foreground/90 leading-relaxed">{currentResult.core_insight}</p>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Structural Similarities</h4>
            <ul className="space-y-1">
              {currentResult.structural_similarities.map((s, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span> {s}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Novel Connections</h4>
            <ul className="space-y-1">
              {currentResult.novel_connections.map((c, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="text-accent mt-0.5">◆</span> {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Applications</h4>
            <ul className="space-y-1">
              {currentResult.practical_applications.map((a, i) => (
                <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="text-dynamic mt-0.5">→</span> {a}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-2">{currentResult.reasoning}</p>
        </div>
      )}

      {!currentResult && !isColliding && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-sm font-mono text-center">
            Select 2 theories and collide them
          </p>
        </div>
      )}
    </div>
  );
}
