import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Plus, Play, AlertTriangle, Search, FlaskConical, Shield, TrendingUp } from "lucide-react";
import { useState } from "react";
import { agentTypeBadgeClass, agentTypeLabel } from "@/lib/format";
import CreateAgentDialog from "@/components/agents/CreateAgentDialog";
import RunLogDialog from "@/components/agents/RunLogDialog";

const API = "https://zhihuiti-oracle.zeabur.app/api/oracle";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  scanner: <Search className="w-4 h-4" />,
  trader: <TrendingUp className="w-4 h-4" />,
  researcher: <FlaskConical className="w-4 h-4" />,
  sentinel: <Shield className="w-4 h-4" />,
};

export default function AgentsPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", role: "scanner", instruments: "", domains: "" });
  const [error, setError] = useState("");
  const [runLog, setRunLog] = useState<{ agentName: string; log: any } | null>(null);

  const { data: agents, isLoading, isError } = useQuery<any[]>({
    queryKey: ["oracle-agents"],
    queryFn: async () => {
      const res = await fetch(`${API}/agents`);
      if (!res.ok) throw new Error("Backend offline");
      const json = await res.json();
      return Array.isArray(json) ? json : json.agents ?? json.data ?? [];
    },
    refetchInterval: 30_000,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = { name: form.name, role: form.role };
      if (form.instruments.trim()) body.instruments = form.instruments.split(",").map(s => s.trim()).filter(Boolean);
      if (form.domains.trim()) body.domains = form.domains.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${API}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create agent");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["oracle-agents"] });
      setCreateOpen(false);
      setForm({ name: "", role: "scanner", instruments: "", domains: "" });
      setError("");
    },
    onError: (err: any) => setError(err.message ?? "Failed to create agent"),
  });

  const runMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`${API}/agents/${id}/run`, { method: "POST" });
      if (!res.ok) throw new Error("Run failed");
      const data = await res.json();
      setRunLog({ agentName: name, log: data });
      return data;
    },
  });

  return (
    <div className="p-6 lg:p-10 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and monitor your Oracle agents</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Agent
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <h3 className="font-semibold mb-1 text-amber-300">Backend Offline</h3>
          <p className="text-sm text-muted-foreground mb-1">Cannot reach the Oracle API. Auto-retrying every 30s.</p>
          <p className="text-xs text-muted-foreground font-mono">{API}/agents</p>
        </div>
      ) : !agents || agents.length === 0 ? (
        <div className="rounded-lg border border-card-border bg-card/50 p-12 text-center">
          <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No agents yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first agent to get started.</p>
          <Button onClick={() => setCreateOpen(true)} className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Agent
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {agents.map((agent: any) => (
            <div key={agent.id ?? agent._id} className="rounded-lg border border-card-border bg-card/50 p-4 flex items-center gap-4 hover:bg-accent/20 transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${agentTypeBadgeClass(agent.role)}`}>
                {ROLE_ICONS[agent.role] ?? <Bot className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{agent.name}</span>
                  <Badge variant="outline" className={`text-[10px] font-medium ${agentTypeBadgeClass(agent.role)}`}>
                    {agentTypeLabel(agent.role)}
                  </Badge>
                </div>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {agent.instruments?.length > 0 && (
                    <span>📊 {agent.instruments.join(", ")}</span>
                  )}
                  {agent.domains?.length > 0 && (
                    <span>🏷️ {agent.domains.join(", ")}</span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                onClick={() => runMutation.mutate({ id: agent.id ?? agent._id, name: agent.name })}
                disabled={runMutation.isPending}
              >
                <Play className="w-3 h-3 mr-1" />
                Run
              </Button>
            </div>
          ))}
        </div>
      )}

      <CreateAgentDialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) setError(""); }}
        form={form}
        setForm={setForm}
        onSubmit={() => createMutation.mutate()}
        isPending={createMutation.isPending}
        error={error}
      />

      <RunLogDialog
        open={!!runLog}
        onOpenChange={(o) => { if (!o) setRunLog(null); }}
        agentName={runLog?.agentName ?? ""}
        log={runLog?.log}
        isPending={runMutation.isPending}
      />
    </div>
  );
}
