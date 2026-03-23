import { type CollisionResult } from "@/types/collision";
import { Clock, Zap, Link } from "lucide-react";

interface Props {
  history: CollisionResult[];
  onSelect: (r: CollisionResult) => void;
  onChainCollide: (r: CollisionResult) => void;
}

export function CollisionHistory({ history, onSelect, onChainCollide }: Props) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text mb-3 px-1">
        History
      </h2>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Clock className="w-10 h-10 text-muted-foreground/30" />
          <p className="text-muted-foreground text-xs font-mono text-center">
            No collisions yet.<br />Results will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {history.map((r) => (
            <div
              key={r.id}
              className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-all cursor-pointer bg-card/30 hover:bg-card/50 group"
              onClick={() => onSelect(r)}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-display font-bold text-primary/90 group-hover:text-primary transition-colors leading-tight">
                  {r.framework_name}
                </h4>
                <span className="text-xs font-mono text-primary/60 shrink-0 ml-2">{r.quality_score}/10</span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mb-2 flex items-center gap-1">
                {r.theoryA.name} <Zap className="w-2.5 h-2.5 text-primary/50" /> {r.theoryB.name}
              </p>
              <button
                className="text-[10px] text-primary/60 hover:text-primary font-mono flex items-center gap-1 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onChainCollide(r);
                }}
              >
                <Link className="w-3 h-3" /> Chain Collide
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
