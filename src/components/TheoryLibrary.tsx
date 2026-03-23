import { useState } from "react";
import { THEORIES, DOMAINS, DOMAIN_COLORS, DOMAIN_CLASSES, type CollisionTheory, type DomainKey } from "@/data/collision-theories";
import { Shuffle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  selected: CollisionTheory[];
  onSelect: (t: CollisionTheory) => void;
}

export function TheoryLibrary({ selected, onSelect }: Props) {
  const [activeDomain, setActiveDomain] = useState<DomainKey>("Quantum Physics");

  const filtered = THEORIES.filter((t) => t.domain === activeDomain);
  const classes = DOMAIN_CLASSES[activeDomain];

  const handleRandom = () => {
    const shuffled = [...THEORIES].sort(() => Math.random() - 0.5);
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
          const dc = DOMAIN_CLASSES[d];
          const isActive = d === activeDomain;
          return (
            <button
              key={d}
              onClick={() => setActiveDomain(d)}
              className={`px-2 py-1 text-[10px] font-mono rounded-full transition-all border ${
                isActive
                  ? `${dc.text} ${dc.border} ${dc.bg}`
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
                  ? `${classes.border} ${classes.bg} shadow-[0_0_15px_${DOMAIN_COLORS[activeDomain]}30]`
                  : "border-border/50 hover:border-border bg-card/30 hover:bg-card/60"
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`text-sm font-medium ${isSelected ? classes.text : "text-foreground"}`}>
                  {t.name}
                </span>
                <span className="text-xs text-muted-foreground">{t.nameCn}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2">{t.core}</p>
              <div className="flex flex-wrap gap-1">
                {t.factors.map((f) => (
                  <span key={f} className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono ${classes.bg} ${classes.text}`}>
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
            const tc = DOMAIN_CLASSES[t.domain as DomainKey];
            return (
              <div key={t.id} className={`flex items-center justify-between px-2 py-1.5 rounded border ${tc.border} ${tc.bg}`}>
                <span className={`text-xs font-medium ${tc.text}`}>{t.name}</span>
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
