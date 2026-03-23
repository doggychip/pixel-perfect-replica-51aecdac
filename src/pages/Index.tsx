import { useState, useCallback } from "react";
import { type Theory } from "@/data/theories";
import { type CollisionResult } from "@/types/collision";
import { TheoryLibrary } from "@/components/TheoryLibrary";
import { CollisionZone } from "@/components/CollisionZone";
import { CollisionHistory } from "@/components/CollisionHistory";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selected, setSelected] = useState<Theory[]>([]);
  const [history, setHistory] = useState<CollisionResult[]>([]);
  const [currentResult, setCurrentResult] = useState<CollisionResult | null>(null);
  const [isColliding, setIsColliding] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

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
      <header className="border-b border-border/50 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 glass">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-base md:text-lg font-bold text-primary neon-text tracking-wider">
            COLLISION ENGINE
          </h1>
          <span className="text-xs text-muted-foreground font-mono hidden sm:inline">智力合成引擎</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span>{selected.length}/2</span>
            <span className="text-border">|</span>
            <span>{history.length} runs</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowApiKey(true)} className="text-muted-foreground hover:text-primary">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr_260px] overflow-hidden">
        {/* Left Panel */}
        <div className="border-r border-border/50 p-4 overflow-hidden flex flex-col min-h-0 hidden md:flex">
          <TheoryLibrary selected={selected} onSelect={handleSelect} />
        </div>

        {/* Center Panel */}
        <div className="flex-1 p-4 overflow-hidden flex flex-col min-w-0 min-h-0">
          {/* Mobile theory selector */}
          <div className="md:hidden mb-4">
            <TheoryLibrary selected={selected} onSelect={handleSelect} />
          </div>
          <CollisionZone
            selected={selected}
            onResult={handleResult}
            isColliding={isColliding}
            setIsColliding={setIsColliding}
            currentResult={currentResult}
          />
        </div>

        {/* Right Panel */}
        <div className="border-l border-border/50 p-4 overflow-hidden flex flex-col min-h-0 hidden md:flex">
          <CollisionHistory
            history={history}
            onSelect={handleHistorySelect}
            onChainCollide={handleChainCollide}
          />
        </div>
      </div>

      <ApiKeyDialog open={showApiKey} onOpenChange={setShowApiKey} />
    </div>
  );
};

export default Index;
