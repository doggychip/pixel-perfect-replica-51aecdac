import { useState } from "react";
import { theories, DOMAINS, DOMAIN_COLORS, type Theory, type Domain } from "@/data/theories";
import { Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selected: Theory[];
  onSelect: (t: Theory) => void;
}

const domainColorMap: Record<string, string> = {
  quantum: "border-quantum text-quantum",
  cognitive: "border-cognitive text-cognitive",
  dynamic: "border-dynamic text-dynamic",
  information: "border-information text-information",
  topology: "border-topology text-topology",
  neuroscience: "border-neuroscience text-neuroscience",
};

const domainBgMap: Record<string, string> = {
  quantum: "bg-quantum/10 text-quantum",
  cognitive: "bg-cognitive/10 text-cognitive",
  dynamic: "bg-dynamic/10 text-dynamic",
  information: "bg-information/10 text-information",
  topology: "bg-topology/10 text-topology",
  neuroscience: "bg-neuroscience/10 text-neuroscience",
};

const domainSelectedMap: Record<string, string> = {
  quantum: "border-quantum bg-quantum/20 shadow-[0_0_15px_hsl(var(--quantum)/0.3)]",
  cognitive: "border-cognitive bg-cognitive/20 shadow-[0_0_15px_hsl(var(--cognitive)/0.3)]",
  dynamic: "border-dynamic bg-dynamic/20 shadow-[0_0_15px_hsl(var(--dynamic)/0.3)]",
  information: "border-information bg-information/20 shadow-[0_0_15px_hsl(var(--information)/0.3)]",
  topology: "border-topology bg-topology/20 shadow-[0_0_15px_hsl(var(--topology)/0.3)]",
  neuroscience: "border-neuroscience bg-neuroscience/20 shadow-[0_0_15px_hsl(var(--neuroscience)/0.3)]",
};

export function TheoryLibrary({ selected, onSelect }: Props) {
  const [activeDomain, setActiveDomain] = useState<Domain>("Quantum Physics");

  const filtered = theories.filter((t) => t.domain === activeDomain);
  const colorKey = DOMAIN_COLORS[activeDomain];

  const handleRandom = () => {
    const shuffled = [...theories].sort(() => Math.random() - 0.5);
    const a = shuffled[0];
    const b = shuffled.find((t) => t.domain !== a.domain)!;
    onSelect(a);
    setTimeout(() => onSelect(b), 50);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text">
          Theory Library
        </h2>
        <Button variant="neon" size="sm" onClick={handleRandom} className="text-xs gap-1.5">
          <Shuffle className="w-3 h-3" />
          Random Pair
        </Button>
      </div>

      {/* Domain Tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {DOMAINS.map((d) => {
          const ck = DOMAIN_COLORS[d];
          const isActive = d === activeDomain;
          return (
            <button
              key={d}
              onClick={() => setActiveDomain(d)}
              className={`px-2 py-1 text-[10px] font-mono rounded-full transition-all border ${
                isActive
                  ? `${domainColorMap[ck]} border-current bg-current/10`
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Theory List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {filtered.map((t) => {
          const isSelected = selected.some((s) => s.id === t.id);
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? domainSelectedMap[colorKey]
                  : "border-border/50 hover:border-border bg-card/30 hover:bg-card/60"
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-sm font-medium ${isSelected ? domainColorMap[colorKey].split(" ")[1] : "text-foreground"}`}>
                  {t.name}
                </span>
                <span className="text-xs text-muted-foreground">{t.chinese}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{t.core}</p>
              <div className="flex flex-wrap gap-1">
                {t.factors.map((f) => (
                  <span key={f} className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${domainBgMap[colorKey]}`}>
                    {f}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected theories */}
      {selected.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Selected</span>
          {selected.map((t) => {
            const ck = DOMAIN_COLORS[t.domain];
            return (
              <div key={t.id} className={`flex items-center justify-between px-2 py-1.5 rounded border ${domainColorMap[ck]} border-current/30 bg-current/5`}>
                <span className="text-xs font-medium">{t.name}</span>
                <button onClick={() => onSelect(t)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
