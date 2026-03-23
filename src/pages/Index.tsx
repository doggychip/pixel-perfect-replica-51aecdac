import { useState, useCallback } from "react";
import { type Theory } from "@/data/theories";
import { type CollisionResult } from "@/types/collision";
import { TheoryLibrary } from "@/components/TheoryLibrary";
import { CollisionZone } from "@/components/CollisionZone";
import { CollisionHistory } from "@/components/CollisionHistory";

const Index = () => {
  const [selected, setSelected] = useState<Theory[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [history, setHistory] = useState<CollisionResult[]>([]);
  const [currentResult, setCurrentResult] = useState<CollisionResult | null>(null);
  const [isColliding, setIsColliding] = useState(false);

  const handleSelect = useCallback((theory: Theory) => {
    setSelected((prev) => {
      const exists = prev.find((t) => t.id === theory.id);
      if (exists) return prev.filter((t) => t.id !== theory.id);
      if (prev.length >= 2) return [prev[1], theory];
      return [...prev, theory];
    });
  }, []);

  const handleResult = useCallback((result: CollisionResult) => {
    setCurrentResult(result);
    setHistory((prev) => [result, ...prev]);
  }, []);

  const handleHistorySelect = useCallback((result: CollisionResult) => {
    setCurrentResult(result);
  }, []);

  const handleChainCollide = useCallback((result: CollisionResult) => {
    // Create a synthetic theory from the collision result
    const syntheticTheory: Theory = {
      id: -Date.now(),
      name: result.framework_name.split("(")[0].trim(),
      chinese: result.framework_name.includes("(") ? result.framework_name.split("(")[1]?.replace(")", "") || "" : "",
      domain: result.theoryA.domain as Theory["domain"],
      core: result.core_insight,
      factors: result.structural_similarities.slice(0, 3),
    };
    setSelected([syntheticTheory]);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-3 flex items-center justify-between shrink-0 glass">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-lg font-bold text-primary neon-text tracking-wider">
            COLLISION ENGINE
          </h1>
          <span className="text-xs text-muted-foreground font-mono">智力合成引擎</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span>{selected.length}/2 selected</span>
          <span className="text-border">|</span>
          <span>{history.length} collisions</span>
        </div>
      </header>

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[320px] border-r border-border/50 p-4 overflow-hidden flex flex-col shrink-0">
          <TheoryLibrary selected={selected} onSelect={handleSelect} />
        </div>

        {/* Center Panel */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col min-w-0">
          <CollisionZone
            selected={selected}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            onResult={handleResult}
            isColliding={isColliding}
            setIsColliding={setIsColliding}
            currentResult={currentResult}
          />
        </div>

        {/* Right Panel */}
        <div className="w-[280px] border-l border-border/50 p-4 overflow-hidden flex flex-col shrink-0">
          <CollisionHistory
            history={history}
            onSelect={handleHistorySelect}
            onChainCollide={handleChainCollide}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
