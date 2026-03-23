import { type CollisionResult } from "@/types/collision";
import { Clock, Link } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  history: CollisionResult[];
  onSelect: (r: CollisionResult) => void;
  onChainCollide: (r: CollisionResult) => void;
}

export function CollisionHistory({ history, onSelect, onChainCollide }: Props) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="font-display text-xs font-bold uppercase tracking-widest text-primary neon-text mb-3 px-1">
        Collision History
      </h2>

      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-xs font-mono text-center">
            No collisions yet.<br />Results will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
              <p className="text-[10px] font-mono text-muted-foreground mb-2">
                {r.theoryA.name} × {r.theoryB.name}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(r.timestamp).toLocaleTimeString()}
                </span>
                <Button
                  variant="neon"
                  size="sm"
                  className="text-[10px] h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChainCollide(r);
                  }}
                >
                  <Link className="w-3 h-3" />
                  Chain
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
