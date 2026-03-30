import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentTypeBadgeClass, agentTypeLabel, statusDotClass } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, Plus, Play, RefreshCw, AlertTriangle, Search, Beaker, Shield } from "lucide-react";
import { useState } from "react";

const API_BASE = "https://zhihuiti-oracle.zeabur.app/api/oracle";

const AGENT_ROLES = ["scanner", "trader", "researcher", "sentinel"] as const;

const roleIcons: Record<string, React.ReactNode> = {
  scanner: <Search className="w-4 h-4" />,
  trader: <Play className="w-4 h-4" />,
  researcher: <Beaker className="w-4 h-4" />,
  sentinel: <Shield className="w-4 h-4" />,
};

interface Agent {
  id: string;
  name: string;
  role: string;
  status?: string;
  realm?: string;
  tokens?: number;
  score?: number;
  generation?: number;
  alive?: boolean;
  [key: string]: unknown;
}

function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["zhihuiti-agents"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/agents`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      return Array.isArray(data) ? data : data.agents ?? [];
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 2,
  });
}

export default function AgentsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "scanner" });
  const [error, setError] = useState("");

  const { data: agents, isLoading, isError, error: fetchError, refetch } = useAgents();

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, role: form.role }),
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zhihuiti-agents"] });
      setCreateOpen(false);
      setForm({ name: "", role: "scanner" });
      setError("");
    },
    onError: (err: any) => setError(err.message ?? "Failed to create agent"),
  });

  const runMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/agents/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zhihuiti-agents"] }),
  });

  const sorted = [...(agents ?? [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="p-6 lg:p-10 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor your AI agents</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-destructive mb-1">Backend Offline</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {fetchError?.message || "Unable to reach the agents API."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sorted.length === 0 && (
        <div className="rounded-lg border border-border bg-card/50 p-12 text-center">
          <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No agents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first agent to get started.</p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Agent
          </Button>
        </div>
      )}

      {/* Agent cards */}
      {!isLoading && !isError && sorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((agent) => {
            const isDead = agent.alive === false;
            return (
              <div
                key={agent.id}
                className={`rounded-lg border border-border bg-card/50 p-5 space-y-3 transition-colors ${isDead ? "opacity-50 grayscale" : "hover:bg-accent/30"}`}
              >
                {/* Top row: icon + name + status */}
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

                {/* Score bar */}
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

                {/* Stats row */}
                <div className="flex gap-4 text-xs">
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
                </div>

                {/* Run button */}
                {!isDead && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => runMutation.mutate(agent.id)}
                    disabled={runMutation.isPending}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {error && (
              <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="My Agent"
                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Role *</label>
              <div className="grid grid-cols-2 gap-2">
                {AGENT_ROLES.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-sm transition-colors ${
                      form.role === role
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-accent/50"
                    }`}
                  >
                    {roleIcons[role]}
                    <span className="font-medium">{agentTypeLabel(role)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setCreateOpen(false); setError(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => createMutation.mutate()}
                disabled={!form.name || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create Agent"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
