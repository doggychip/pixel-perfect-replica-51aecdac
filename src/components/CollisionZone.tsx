import { useState } from "react";
import { type Theory, DOMAIN_COLORS, COLLISION_MODES } from "@/data/theories";
import { type CollisionResult } from "@/types/collision";
import { Button } from "@/components/ui/button";
import { Zap, Settings } from "lucide-react";

interface Props {
  selected: Theory[];
  apiKey: string;
  onApiKeyChange: (key: string) => void;
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
  apiKey,
  onApiKeyChange,
  onResult,
  isColliding,
  setIsColliding,
  currentResult,
}: Props) {
  const [mode, setMode] = useState("Fuse");
  const [showApiInput, setShowApiInput] = useState(false);

  const theoryA = selected[0] || null;
  const theoryB = selected[1] || null;
  const canCollide = theoryA && theoryB && apiKey.trim().length > 0 && !isColliding;

  const handleCollide = async () => {
    if (!canCollide || !theoryA || !theoryB) return;
    setIsColliding(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a cross-disciplinary synthesis engine. Given two theories from different domains, find deep structural connections and generate a novel framework.

THEORY A: ${theoryA.name} (${theoryA.domain})
Core: ${theoryA.core}
Key factors: ${theoryA.factors.join(", ")}

THEORY B: ${theoryB.name} (${theoryB.domain})
Core: ${theoryB.core}
Key factors: ${theoryB.factors.join(", ")}

COLLISION MODE: ${mode}

Respond ONLY in JSON (no markdown, no backticks):
{
  "framework_name": "A creative name for the new framework (English + Chinese)",
  "core_insight": "2-3 sentences describing the novel insight from this collision",
  "structural_similarities": ["list of 3-4 deep structural parallels found"],
  "novel_connections": ["list of 2-3 genuinely surprising cross-domain links"],
  "practical_applications": ["list of 2-3 concrete business/product applications"],
  "quality_score": 7,
  "reasoning": "1 sentence on why this collision is or isn't productive"
}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const parsed = JSON.parse(text);

      const result: CollisionResult = {
        id: crypto.randomUUID(),
        theoryA: { name: theoryA.name, chinese: theoryA.chinese, domain: theoryA.domain },
        theoryB: { name: theoryB.name, chinese: theoryB.chinese, domain: theoryB.domain },
        mode,
        ...parsed,
        timestamp: Date.now(),
      };

      onResult(result);
    } catch (err) {
      console.error("Collision failed:", err);
    } finally {
      setIsColliding(false);
    }
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
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text">
          Collision Zone
        </h2>
        <button onClick={() => setShowApiInput(!showApiInput)} className="text-muted-foreground hover:text-primary transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {showApiInput && (
        <div className="mb-3">
          <input
            type="password"
            placeholder="Anthropic API Key"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="w-full bg-secondary border border-border rounded px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      )}

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
          <div className={`w-16 h-16 rounded-full animate-collide-left ${theoryA ? `bg-${DOMAIN_COLORS[theoryA.domain]}/60` : "bg-primary/60"}`} style={{ boxShadow: `0 0 30px hsl(var(--${theoryA ? DOMAIN_COLORS[theoryA.domain] : "primary"}) / 0.5)` }} />
          <div className={`w-16 h-16 rounded-full animate-collide-right ${theoryB ? `bg-${DOMAIN_COLORS[theoryB.domain]}/60` : "bg-accent/60"}`} style={{ boxShadow: `0 0 30px hsl(var(--${theoryB ? DOMAIN_COLORS[theoryB.domain] : "accent"}) / 0.5)` }} />
          <div className="absolute w-24 h-24 rounded-full bg-primary/30 animate-flash" style={{ boxShadow: "0 0 60px hsl(var(--primary) / 0.8)" }} />
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
            Select 2 theories and collide them<br />
            <span className="text-xs text-muted-foreground/60">Click ⚙ to set your API key</span>
          </p>
        </div>
      )}
    </div>
  );
}
