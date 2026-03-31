import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Plus, RefreshCw, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { AgentCard, type Agent } from "@/components/agents/AgentCard";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";
import { RunLogDialog } from "@/components/agents/RunLogDialog";

const API_BASE = "https://zhihuiti-oracle.zeabur.app/api/oracle";

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
  const [createError, setCreateError] = useState("");
  const [runLog, setRunLog] = useState<{ agentName: string; log: any } | null>(null);

  const { data: agents, isLoading, isError, error: fetchError, refetch } = useAgents();

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; role: string; instruments: string[]; domains: string[] }) => {
      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zhihuiti-agents"] });
      setCreateOpen(false);
      setCreateError("");
    },
    onError: (err: any) => setCreateError(err.message ?? "Failed to create agent"),
  });

  const runMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`${API_BASE}/agents/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
      const data = await res.json();
      return { name, data };
    },
    onSuccess: ({ name, data }) => {
      qc.invalidateQueries({ queryKey: ["zhihuiti-agents"] });
      setRunLog({ agentName: name, log: data.log ?? data.actions ?? data });
    },
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
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9">
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <h3 className="font-semibold text-destructive mb-1">Backend Offline</h3>
          <p className="text-sm text-muted-foreground mb-3">{fetchError?.message || "Unable to reach the agents API."}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Retry
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

      {/* Empty */}
      {!isLoading && !isError && sorted.length === 0 && (
        <div className="rounded-lg border border-border bg-card/50 p-12 text-center">
          <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No agents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first agent to get started.</p>
          <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />Create Agent
          </Button>
        </div>
      )}

      {/* Agent cards */}
      {!isLoading && !isError && sorted.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRun={(id) => runMutation.mutate({ id, name: agent.name })}
              isRunning={runMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateAgentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(data) => createMutation.mutate(data)}
        isPending={createMutation.isPending}
        error={createError}
      />

      {/* Run log dialog */}
      <RunLogDialog
        open={!!runLog}
        onOpenChange={(open) => { if (!open) setRunLog(null); }}
        agentName={runLog?.agentName ?? ""}
        log={runLog?.log ?? null}
        isLoading={runMutation.isPending}
      />
    </div>
  );
}
