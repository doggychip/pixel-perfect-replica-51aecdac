import { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap, Shuffle, ChevronRight, Star, Clock, Link2, Atom,
  Sparkles, ArrowRight, X, History, AlertTriangle,
} from "lucide-react";
import {
  THEORIES, DOMAINS, COLLISION_MODES, DOMAIN_COLORS, DOMAIN_CLASSES,
  getTheoriesByDomain,
  type CollisionTheory, type DomainKey, type CollisionMode,
} from "@/data/collision-theories";

const ParticleField = lazy(() => import("@/components/ParticleField"));

// ─── Types ───────────────────────────────────────────────────
interface CollisionResult {
  id: string;
  theoryA: CollisionTheory;
  theoryB: CollisionTheory;
  mode: CollisionMode;
  modeLabel: string;
  framework_name: string;
  core_insight: string;
  structural_similarities: string[];
  novel_connections: string[];
  practical_applications: string[];
  quality_score: number;
  reasoning: string;
  timestamp: number;
}

// CollisionAnimation removed — replaced by ParticleField 3D scene

// ─── Score Badge ─────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8
    ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
    : score >= 6
    ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
    : "text-red-400 border-red-400/30 bg-red-400/10";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono ${color}`}>
      <Star className="w-3 h-3" />
      {score}/10
    </span>
  );
}

// ─── Theory Card (selectable) ────────────────────────────────
function TheoryCard({
  theory,
  selected,
  disabled,
  onSelect,
}: {
  theory: CollisionTheory;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const dc = DOMAIN_CLASSES[theory.domain as DomainKey];
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        selected
          ? `${dc.border} ${dc.bg} shadow-[0_0_15px_rgba(255,255,255,0.05)]`
          : disabled
          ? "border-border/30 bg-card/20 opacity-50 cursor-not-allowed"
          : "border-border/50 bg-card/30 hover:bg-card/60 hover:border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${selected ? dc.text : "text-foreground"}`}>
            {theory.name}
          </span>
          <p className="text-xs text-muted-foreground">{theory.nameCn}</p>
        </div>
        {selected && (
          <span className={`text-xs font-bold ${dc.text} shrink-0 ml-2`}>
            ✓
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{theory.core}</p>
      <div className="flex flex-wrap gap-1">
        {theory.factors.map(f => (
          <span key={f} className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${dc.bg} ${dc.text}`}>
            {f}
          </span>
        ))}
      </div>
    </button>
  );
}

// ─── Result Card ─────────────────────────────────────────────
function ResultCard({ result, compact, onClick }: { result: CollisionResult; compact?: boolean; onClick?: () => void }) {
  const dcA = DOMAIN_CLASSES[result.theoryA.domain as DomainKey];
  const dcB = DOMAIN_CLASSES[result.theoryB.domain as DomainKey];

  if (compact) {
    return (
      <button onClick={onClick} className="w-full text-left p-3 rounded-lg border border-border/50 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all">
        <div className="flex items-start justify-between mb-1">
          <h4 className="text-sm font-display font-bold text-primary/90 leading-tight flex-1 min-w-0">
            {result.framework_name}
          </h4>
          <ScoreBadge score={result.quality_score} />
        </div>
        <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <span className={dcA.text}>{result.theoryA.name}</span>
          <Zap className="w-2.5 h-2.5 text-primary/50" />
          <span className={dcB.text}>{result.theoryB.name}</span>
        </p>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-primary neon-text">{result.framework_name}</h3>
          <p className="text-xs font-mono text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
            <span className={dcA.text}>{result.theoryA.name}</span>
            <Zap className="w-3 h-3 text-primary/50" />
            <span className={dcB.text}>{result.theoryB.name}</span>
            <span className="text-border">|</span>
            <span>{result.modeLabel}</span>
          </p>
        </div>
        <ScoreBadge score={result.quality_score} />
      </div>

      {/* Core Insight */}
      <div>
        <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Core Insight</h4>
        <p className="text-sm text-foreground/90 leading-relaxed">{result.core_insight}</p>
      </div>

      {/* Structural Similarities */}
      {result.structural_similarities.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Structural Similarities</h4>
          <ul className="space-y-1">
            {result.structural_similarities.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <ArrowRight className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Novel Connections */}
      {result.novel_connections.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Novel Connections</h4>
          <ul className="space-y-1">
            {result.novel_connections.map((c, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Practical Applications */}
      {result.practical_applications.length > 0 && (
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Practical Applications</h4>
          <div className="flex flex-wrap gap-1.5">
            {result.practical_applications.map((a, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {result.reasoning && (
        <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-2">{result.reasoning}</p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function CollisionEnginePage() {
  const [activeDomain, setActiveDomain] = useState<DomainKey>("Quantum Physics");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [collisionMode, setCollisionMode] = useState<CollisionMode>("fuse");
  const [isColliding, setIsColliding] = useState(false);
  const [currentResult, setCurrentResult] = useState<CollisionResult | null>(null);
  const [history, setHistory] = useState<CollisionResult[]>([]);
  const [viewingResult, setViewingResult] = useState<CollisionResult | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("zh_claude_api_key") ?? "");
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const selectedTheories = useMemo(
    () => selectedIds.map(id => THEORIES.find(t => t.id === id)!).filter(Boolean),
    [selectedIds],
  );

  const domainTheories = useMemo(
    () => getTheoriesByDomain(activeDomain),
    [activeDomain],
  );

  // Save API key
  useEffect(() => {
    if (apiKey) localStorage.setItem("zh_claude_api_key", apiKey);
  }, [apiKey]);

  const handleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
    setCurrentResult(null);
    setError("");
  }, []);

  const handleRandomPair = useCallback(() => {
    const domainKeys = [...DOMAINS];
    const d1Idx = Math.floor(Math.random() * domainKeys.length);
    let d2Idx = Math.floor(Math.random() * (domainKeys.length - 1));
    if (d2Idx >= d1Idx) d2Idx++;
    const theories1 = getTheoriesByDomain(domainKeys[d1Idx]);
    const theories2 = getTheoriesByDomain(domainKeys[d2Idx]);
    const t1 = theories1[Math.floor(Math.random() * theories1.length)];
    const t2 = theories2[Math.floor(Math.random() * theories2.length)];
    setSelectedIds([t1.id, t2.id]);
    setCurrentResult(null);
    setError("");
  }, []);

  const handleCollide = useCallback(async () => {
    if (selectedTheories.length !== 2) return;
    if (!apiKey) {
      setApiKeyOpen(true);
      return;
    }

    const [theoryA, theoryB] = selectedTheories;
    const mode = COLLISION_MODES.find(m => m.key === collisionMode)!;

    setIsColliding(true);
    setCurrentResult(null);
    setError("");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{
            role: "user",
            content: `You are a cross-disciplinary synthesis engine. Given two theories from different domains, find deep structural connections and generate a novel framework.

THEORY A: ${theoryA.name} (${theoryA.domain})
Core: ${theoryA.core}
Key factors: ${theoryA.factors.join(", ")}

THEORY B: ${theoryB.name} (${theoryB.domain})
Core: ${theoryB.core}
Key factors: ${theoryB.factors.join(", ")}

COLLISION MODE: ${mode.label} (${mode.labelCn}) — ${mode.desc}

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
          }],
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: { message: `HTTP ${res.status}` } }));
        throw new Error(errBody.error?.message ?? `API error: ${res.status}`);
      }

      const data = await res.json();
      const text = data.content?.[0]?.text ?? "";

      let jsonStr = text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      const parsed = JSON.parse(jsonStr);

      const result: CollisionResult = {
        id: crypto.randomUUID(),
        theoryA,
        theoryB,
        mode: collisionMode,
        modeLabel: mode.label,
        ...parsed,
        quality_score: Math.min(10, Math.max(1, Math.round(parsed.quality_score ?? 5))),
        timestamp: Date.now(),
      };

      setCurrentResult(result);
      setHistory(prev => [result, ...prev]);

      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: any) {
      setError(err.message ?? "Collision failed");
    } finally {
      setIsColliding(false);
    }
  }, [selectedTheories, collisionMode, apiKey]);

  const handleChainCollide = useCallback((result: CollisionResult) => {
    const virtualTheory: CollisionTheory = {
      id: -result.timestamp,
      name: result.framework_name,
      nameCn: "",
      domain: `${result.theoryA.domain} × ${result.theoryB.domain}`,
      core: result.core_insight,
      factors: result.structural_similarities.slice(0, 3),
    };
    THEORIES.push(virtualTheory);
    setSelectedIds([virtualTheory.id]);
    setCurrentResult(null);
    setError("");
  }, []);

  const modeInfo = COLLISION_MODES.find(m => m.key === collisionMode)!;
  const colorA = selectedTheories[0] ? (DOMAIN_COLORS[selectedTheories[0].domain as DomainKey] ?? "#666") : "#666";
  const colorB = selectedTheories[1] ? (DOMAIN_COLORS[selectedTheories[1].domain as DomainKey] ?? "#666") : "#666";

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 glass">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h1 className="font-display text-base md:text-lg font-bold text-primary neon-text tracking-wider">
              Theory Collision Engine
            </h1>
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">智力合成引擎</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">
            Select 2 theories from different domains, pick a collision mode, and discover novel frameworks
          </p>
        </div>
        <div>
          <Button
            variant="neon"
            size="sm"
            onClick={() => setApiKeyOpen(true)}
          >
            {apiKey ? "API Key Set" : "Set API Key"}
          </Button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr_260px] overflow-hidden">
        {/* ─── LEFT: Theory Library ─── */}
        <div className="border-r border-border/50 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-3 border-b border-border/50 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text">
                Theory Library
              </h2>
              <Button variant="neon" size="sm" onClick={handleRandomPair} className="text-[10px] gap-1">
                <Shuffle className="w-3 h-3" />
                Random Pair
              </Button>
            </div>
            {/* Domain tabs */}
            <div className="flex flex-wrap gap-1">
              {DOMAINS.map(d => {
                const dc = DOMAIN_CLASSES[d];
                const isActive = activeDomain === d;
                const count = getTheoriesByDomain(d).length;
                const hasSelected = selectedIds.some(id => THEORIES.find(t => t.id === id)?.domain === d);
                return (
                  <button
                    key={d}
                    onClick={() => setActiveDomain(d)}
                    className={`px-2 py-1 rounded text-[9px] font-medium transition-colors flex items-center gap-1 ${
                      isActive
                        ? `${dc.bg} ${dc.text} ${dc.border} border`
                        : "text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    {d.split(" ").map(w => w[0]).join("")}
                    <span className="opacity-60">{count}</span>
                    {hasSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {domainTheories.map(t => (
                <TheoryCard
                  key={t.id}
                  theory={t}
                  selected={selectedIds.includes(t.id)}
                  disabled={selectedIds.length >= 2 && !selectedIds.includes(t.id)}
                  onSelect={() => handleSelect(t.id)}
                />
              ))}
            </div>
          </ScrollArea>

          {selectedIds.length > 0 && (
            <div className="p-3 border-t border-border/50 space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Selected ({selectedIds.length}/2)
              </span>
              <div className="space-y-1">
                {selectedTheories.map(t => (
                  <div key={t.id} className="flex items-center justify-between px-2 py-1 rounded bg-card/50 border border-border/50">
                    <span className={`text-xs font-medium ${DOMAIN_CLASSES[t.domain as DomainKey]?.text ?? "text-foreground"}`}>
                      {t.name}
                    </span>
                    <button onClick={() => handleSelect(t.id)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── CENTER: Collision Zone ─── */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
          {/* Selected theories display */}
          <div className="flex gap-3 items-stretch">
            {/* Theory A */}
            <div className="flex-1">
              <Card className="h-full bg-card/40 border-border/50">
                <CardContent className="p-4">
                  {selectedTheories[0] ? (
                    <>
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${DOMAIN_CLASSES[selectedTheories[0].domain as DomainKey]?.text ?? ""}`}>
                        {selectedTheories[0].domain}
                      </span>
                      <h3 className={`font-display text-sm font-bold mt-1 ${DOMAIN_CLASSES[selectedTheories[0].domain as DomainKey]?.text ?? ""}`}>
                        {selectedTheories[0].name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedTheories[0].nameCn}</p>
                      <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{selectedTheories[0].core}</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[100px]">
                      <p className="text-sm text-muted-foreground font-mono">Select Theory A</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* VS / Collide controls */}
            <div className="flex flex-col items-center justify-center gap-2 shrink-0 w-[140px]">
              <Zap className="w-6 h-6 text-primary" />
              <select
                value={collisionMode}
                onChange={(e) => setCollisionMode(e.target.value as CollisionMode)}
                className="bg-background border border-input rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-[130px] text-center"
              >
                {COLLISION_MODES.map(m => (
                  <option key={m.key} value={m.key}>{m.label} ({m.labelCn})</option>
                ))}
              </select>
              <p className="text-[9px] text-muted-foreground text-center leading-tight">
                {modeInfo.desc}
              </p>
              <Button
                onClick={handleCollide}
                disabled={selectedTheories.length !== 2 || isColliding}
                className="w-full font-display font-bold tracking-wider uppercase transition-all active:scale-95"
                style={{
                  background: selectedTheories.length === 2
                    ? `linear-gradient(135deg, ${colorA}, ${colorB})`
                    : undefined,
                  color: selectedTheories.length === 2 ? "hsl(var(--background))" : undefined,
                  boxShadow: selectedTheories.length === 2 ? `0 0 20px ${colorA}40, 0 0 20px ${colorB}40` : undefined,
                }}
              >
                {isColliding ? "COLLIDING..." : "COLLIDE"}
              </Button>
            </div>

            {/* Theory B */}
            <div className="flex-1">
              <Card className="h-full bg-card/40 border-border/50">
                <CardContent className="p-4">
                  {selectedTheories[1] ? (
                    <>
                      <span className={`text-[10px] font-mono uppercase tracking-wider ${DOMAIN_CLASSES[selectedTheories[1].domain as DomainKey]?.text ?? ""}`}>
                        {selectedTheories[1].domain}
                      </span>
                      <h3 className={`font-display text-sm font-bold mt-1 ${DOMAIN_CLASSES[selectedTheories[1].domain as DomainKey]?.text ?? ""}`}>
                        {selectedTheories[1].name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedTheories[1].nameCn}</p>
                      <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{selectedTheories[1].core}</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[100px]">
                      <p className="text-sm text-muted-foreground font-mono">Select Theory B</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 3D Particle Visualization */}
          <Suspense fallback={<div className="w-full h-[300px] rounded-lg border border-border/30 bg-background/50 flex items-center justify-center"><Atom className="w-8 h-8 text-muted-foreground/30 animate-spin" /></div>}>
            <ParticleField
              theoryA={selectedTheories[0] ?? null}
              theoryB={selectedTheories[1] ?? null}
              isColliding={isColliding}
            />
          </Suspense>
        </div>

        {/* ─── RIGHT: History ─── */}
        <div className="border-l border-border/50 flex flex-col overflow-hidden hidden md:flex">
          <div className="p-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text">
                Collision History
              </h2>
              <Badge variant="secondary" className="text-[9px] ml-auto">{history.length}</Badge>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 gap-3">
                <Clock className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-mono text-center">No collisions yet</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {history.map(r => (
                  <div key={r.id}>
                    <ResultCard
                      result={r}
                      compact
                      onClick={() => setViewingResult(r)}
                    />
                    <button
                      onClick={() => handleChainCollide(r)}
                      className="w-full mt-1 flex items-center justify-center gap-1 text-[9px] text-muted-foreground hover:text-primary transition-colors py-1"
                    >
                      <Link2 className="w-3 h-3" />
                      Chain Collide
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* View past result dialog */}
      <Dialog open={!!viewingResult} onOpenChange={() => setViewingResult(null)}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary neon-text">Collision Result</DialogTitle>
          </DialogHeader>
          {viewingResult && <ResultCard result={viewingResult} />}
        </DialogContent>
      </Dialog>

      {/* API Key dialog */}
      <Dialog open={apiKeyOpen} onOpenChange={setApiKeyOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary neon-text">Claude API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Enter your Anthropic API key to power theory collisions. The key is stored locally in your browser only.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              onClick={() => setApiKeyOpen(false)}
              disabled={!apiKey}
              className="w-full"
            >
              Save Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
