import { agentTypeBadgeClass, agentTypeLabel, statusDotClass } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Play, Search, Beaker, Shield } from "lucide-react";

export const roleIcons: Record<string, React.ReactNode> = {
  scanner: <Search className="w-4 h-4" />,
  trader: <Play className="w-4 h-4" />,
  researcher: <Beaker className="w-4 h-4" />,
  sentinel: <Shield className="w-4 h-4" />,
};

export interface Agent {
  id: string;
  name: string;
  role: string;
  status?: string;
  realm?: string;
  tokens?: number;
  score?: number;
  generation?: number;
  alive?: boolean;
  instruments?: string[];
  domains?: string[];
  [key: string]: unknown;
}

interface AgentCardProps {
  agent: Agent;
  onRun: (id: string) => void;
  isRunning: boolean;
}

export function AgentCard({ agent, onRun, isRunning }: AgentCardProps) {
  const isDead = agent.alive === false;

  return (
    <div
      className={`rounded-lg border border-border bg-card/50 p-5 space-y-3 transition-colors ${isDead ? "opacity-50 grayscale" : "hover:bg-accent/30"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center text-muted-foreground">
            {roleIcons[agent.role] ?? <Bot className="w-4 h-4" />}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{agent.name}</p>
            {agent.realm && (
              <p className="text-xs text-muted-foreground">{agent.realm}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isDead ? "bg-destructive" : statusDotClass(agent.status ?? "active")}`} />
          <Badge variant="outline" className={`text-[10px] font-medium ${agentTypeBadgeClass(agent.role)}`}>
            {agentTypeLabel(agent.role)}
          </Badge>
        </div>
      </div>

      {agent.score != null && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Score</span>
            <span className="font-mono font-medium">{agent.score.toFixed(1)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(0, agent.score))}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs flex-wrap">
        {agent.tokens != null && (
          <div>
            <span className="text-muted-foreground">Tokens</span>
            <p className="font-mono font-medium">{agent.tokens.toLocaleString()}</p>
          </div>
        )}
        {agent.generation != null && (
          <div>
            <span className="text-muted-foreground">Gen</span>
            <p className="font-mono font-medium">{agent.generation}</p>
          </div>
        )}
        {agent.instruments && agent.instruments.length > 0 && (
          <div>
            <span className="text-muted-foreground">Instruments</span>
            <p className="font-mono font-medium text-xs">{agent.instruments.join(", ")}</p>
          </div>
        )}
      </div>

      {!isDead && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => onRun(agent.id)}
          disabled={isRunning}
        >
          <Play className="w-3 h-3 mr-1" />
          Run
        </Button>
      )}
    </div>
  );
}
