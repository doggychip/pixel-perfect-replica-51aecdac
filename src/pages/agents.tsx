import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bot, AlertTriangle, Send, Loader2, CheckCircle2, XCircle,
  Banknote, Landmark, Receipt, Award, FlaskConical, Zap, Building2,
  Dna, ClipboardCheck, RefreshCw,
} from "lucide-react";
import { useState, useRef, lazy, Suspense } from "react";

const AgentHeatmap3D = lazy(() => import("@/components/agents/AgentHeatmap3D"));

const API = "https://zhihuiti-oracle.zeabur.app";

// ─── Realm helpers ───
const REALM_BADGE: Record<string, { emoji: string; label: string; cls: string }> = {
  research: { emoji: "🔬", label: "Research", cls: "text-violet-400 border-violet-400/30 bg-violet-400/10" },
  execution: { emoji: "⚡", label: "Execution", cls: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  central: { emoji: "🏛", label: "Central", cls: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" },
};

function realmBadge(realm: string) {
  const r = REALM_BADGE[realm] ?? { emoji: "❓", label: realm, cls: "text-muted-foreground border-muted bg-muted/10" };
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${r.cls}`}>
      {r.emoji} {r.label}
    </Badge>
  );
}

// ─── Goal Polling Component ───
function GoalPoller({ goalId }: { goalId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["goal-poll", goalId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/goals/${goalId}`);
      if (!res.ok) throw new Error("Failed to poll goal");
      return res.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 3000;
    },
    retry: 2,
  });

  if (isLoading) return <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Polling…</span>;
  if (!data) return null;

  const done = data.status === "completed";
  const failed = data.status === "failed";

  return (
    <div className={`rounded-lg border p-3 text-sm ${done ? "border-emerald-500/30 bg-emerald-500/5" : failed ? "border-red-500/30 bg-red-500/5" : "border-cyan-500/30 bg-cyan-500/5"}`}>
      <div className="flex items-center gap-2 mb-1">
        {done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : failed ? <XCircle className="w-4 h-4 text-red-400" /> : <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
        <span className="font-medium">{data.status}</span>
        <span className="text-xs text-muted-foreground ml-auto">ID: {goalId.slice(0, 8)}</span>
      </div>
      {data.result && <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-1 max-h-40 overflow-auto">{typeof data.result === "string" ? data.result : JSON.stringify(data.result, null, 2)}</pre>}
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, sub, cls }: { icon: any; label: string; value: string | number; sub?: string; cls?: string }) {
  return (
    <Card className="bg-card/60 border-card-border">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cls ?? "bg-cyan-500/10 text-cyan-400"}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold leading-tight">{value}</p>
          {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function AgentsPage() {
  const qc = useQueryClient();
  const [goalText, setGoalText] = useState("");
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──
  const statusQ = useQuery({
    queryKey: ["zhihuiti-status"],
    queryFn: async () => { const r = await fetch(`${API}/api/status`); if (!r.ok) throw new Error(); return r.json(); },
    refetchInterval: 10_000,
    retry: 1,
  });

  const agentsQ = useQuery<any[]>({
    queryKey: ["zhihuiti-agents"],
    queryFn: async () => {
      const r = await fetch(`${API}/api/agents`);
      if (!r.ok) throw new Error();
      const j = await r.json();
      return Array.isArray(j) ? j : j.agents ?? j.data ?? [];
    },
    refetchInterval: 10_000,
    retry: 1,
  });

  const dataQ = useQuery({
    queryKey: ["zhihuiti-data"],
    queryFn: async () => { const r = await fetch(`${API}/api/data`); if (!r.ok) throw new Error(); return r.json(); },
    refetchInterval: 10_000,
    retry: 1,
  });

  // ── Goal mutation ──
  const goalMut = useMutation({
    mutationFn: async (goal: string) => {
      const r = await fetch(`${API}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      if (!r.ok) throw new Error("Goal submission failed");
      return r.json();
    },
    onSuccess: (data) => {
      setActiveGoalId(data.goal_id ?? data.id);
      setGoalText("");
    },
  });

  const status = statusQ.data;
  const agents = agentsQ.data;
  const dashData = dataQ.data;
  const economy = dashData?.economy ?? status?.economy;
  const realms = dashData?.realms;
  const bloodline = dashData?.bloodline;
  const inspection = dashData?.inspection;
  const goalHistory = dashData?.goal_history ?? [];

  const offline = statusQ.isError && agentsQ.isError;

  return (
    <div className="p-6 lg:p-10 max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time agent system from zhihuiti backend</p>
        </div>
        <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" onClick={() => { qc.invalidateQueries({ queryKey: ["zhihuiti-status"] }); qc.invalidateQueries({ queryKey: ["zhihuiti-agents"] }); qc.invalidateQueries({ queryKey: ["zhihuiti-data"] }); }}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Offline banner */}
      {offline && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="font-semibold text-amber-300 mb-1">Backend Offline</h3>
          <p className="text-sm text-muted-foreground">Cannot reach {API}. Auto-retrying every 10s.</p>
        </div>
      )}

      {/* 1. System Status Bar */}
      {status && (
        <Card className="bg-card/60 border-card-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-muted-foreground">Mode:</span>
                <span className="font-medium">{status.mode ?? "unknown"}</span>
              </div>
              {status.llm_backend && (
                <div><span className="text-muted-foreground">LLM:</span> <span className="font-medium">{status.llm_backend}</span></div>
              )}
              {status.model && (
                <div><span className="text-muted-foreground">Model:</span> <span className="font-medium">{status.model}</span></div>
              )}
              {status.agent_count != null && (
                <div><span className="text-muted-foreground">Agents:</span> <span className="font-medium">{status.agent_count}</span></div>
              )}
              {economy && (
                <>
                  <div><span className="text-muted-foreground">Money Supply:</span> <span className="font-medium">{Number(economy.money_supply ?? 0).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Treasury:</span> <span className="font-medium">{Number(economy.treasury_balance ?? economy.treasury ?? 0).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Taxes:</span> <span className="font-medium">{Number(economy.taxes_collected ?? 0).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Rewards:</span> <span className="font-medium">{Number(economy.rewards_paid ?? 0).toLocaleString()}</span></div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Agent Table */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Agent Registry</h2>
        {agentsQ.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
        ) : !agents || agents.length === 0 ? (
          <Card className="bg-card/50 border-card-border p-8 text-center">
            <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No agents registered.</p>
          </Card>
        ) : (
          <Card className="bg-card/60 border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs">Realm</TableHead>
                  <TableHead className="text-xs text-right">Gen</TableHead>
                  <TableHead className="text-xs text-right">Budget</TableHead>
                  <TableHead className="text-xs text-right">Avg Score</TableHead>
                  <TableHead className="text-xs text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a: any) => {
                  const id = a.id ?? a._id ?? "";
                  const alive = a.status === "alive" || a.status === "active";
                  return (
                    <TableRow key={id} className="border-card-border hover:bg-accent/10">
                      <TableCell className="font-mono text-xs">{String(id).slice(0, 8)}</TableCell>
                      <TableCell className="text-xs capitalize">{a.role ?? "—"}</TableCell>
                      <TableCell>{realmBadge(a.realm ?? a.domains?.[0] ?? "unknown")}</TableCell>
                      <TableCell className="text-right text-xs">{a.generation ?? "—"}</TableCell>
                      <TableCell className="text-right text-xs">{a.budget != null ? Number(a.budget).toLocaleString() : "—"}</TableCell>
                      <TableCell className="text-right text-xs">{a.avg_score != null ? Number(a.avg_score).toFixed(2) : a.score != null ? Number(a.score).toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] ${alive ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-red-400 border-red-400/30 bg-red-400/10"}`}>
                          {alive ? "Alive" : "Dead"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      {/* 3. Goal Submission */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Submit Goal</h2>
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Enter a goal for the agent system…"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && goalText.trim()) goalMut.mutate(goalText.trim()); }}
            className="flex-1 bg-card/60 border-card-border"
          />
          <Button
            onClick={() => goalText.trim() && goalMut.mutate(goalText.trim())}
            disabled={goalMut.isPending || !goalText.trim()}
            className="bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold"
          >
            {goalMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="ml-1.5">Submit</span>
          </Button>
        </div>
        {goalMut.isError && <p className="text-xs text-red-400">Failed to submit goal.</p>}
        {activeGoalId && <GoalPoller goalId={activeGoalId} />}
      </section>

      {/* 4. Goal History */}
      {goalHistory.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Goal History</h2>
          <Card className="bg-card/60 border-card-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-card-border">
                  <TableHead className="text-xs">Goal</TableHead>
                  <TableHead className="text-xs text-right">Tasks</TableHead>
                  <TableHead className="text-xs text-right">Avg Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...goalHistory].reverse().map((g: any, i: number) => (
                  <TableRow key={i} className="border-card-border hover:bg-accent/10">
                    <TableCell className="text-xs max-w-[400px] truncate">{g.goal ?? g.text ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs">{g.task_count ?? g.tasks ?? "—"}</TableCell>
                    <TableCell className="text-right text-xs">{g.avg_score != null ? Number(g.avg_score).toFixed(2) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}

      {/* 5. Economy Dashboard */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Economy Dashboard</h2>

        {/* Economy cards */}
        {economy && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Economy</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard icon={Banknote} label="Money Supply" value={Number(economy.money_supply ?? 0).toLocaleString()} cls="bg-emerald-500/10 text-emerald-400" />
              <StatCard icon={Banknote} label="Minted" value={Number(economy.minted ?? 0).toLocaleString()} cls="bg-cyan-500/10 text-cyan-400" />
              <StatCard icon={Banknote} label="Burned" value={Number(economy.burned ?? 0).toLocaleString()} cls="bg-red-500/10 text-red-400" />
              <StatCard icon={Landmark} label="Treasury" value={Number(economy.treasury_balance ?? economy.treasury ?? 0).toLocaleString()} cls="bg-amber-500/10 text-amber-400" />
              <StatCard icon={Receipt} label="Tax Rate" value={economy.tax_rate != null ? `${(Number(economy.tax_rate) * 100).toFixed(1)}%` : "—"} cls="bg-violet-500/10 text-violet-400" />
            </div>
          </div>
        )}

        {/* Realms */}
        {realms && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">Realms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(realms).map(([key, val]: [string, any]) => {
                const r = REALM_BADGE[key] ?? { emoji: "❓", label: key, cls: "" };
                return (
                  <Card key={key} className="bg-card/60 border-card-border">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-sm flex items-center gap-1.5">{r.emoji} {r.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 grid grid-cols-2 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Active</span><span className="text-right font-medium">{val.agents_active ?? val.active ?? "—"}</span>
                      <span className="text-muted-foreground">Frozen</span><span className="text-right font-medium">{val.frozen ?? "—"}</span>
                      <span className="text-muted-foreground">Bankrupt</span><span className="text-right font-medium">{val.bankrupt ?? "—"}</span>
                      <span className="text-muted-foreground">Budget</span><span className="text-right font-medium">{val.budget != null ? Number(val.budget).toLocaleString() : "—"}</span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Bloodline */}
        {bloodline && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">Bloodline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Dna} label="Total Genes" value={bloodline.total_genes ?? "—"} cls="bg-pink-500/10 text-pink-400" />
              <StatCard icon={Dna} label="Alive Genes" value={bloodline.alive_genes ?? "—"} cls="bg-emerald-500/10 text-emerald-400" />
              <StatCard icon={Dna} label="Max Generation" value={bloodline.max_generation ?? "—"} cls="bg-cyan-500/10 text-cyan-400" />
              <StatCard icon={Dna} label="Avg Score" value={bloodline.avg_score != null ? Number(bloodline.avg_score).toFixed(2) : "—"} cls="bg-amber-500/10 text-amber-400" />
            </div>
          </div>
        )}

        {/* Inspection */}
        {inspection && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">Inspection</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={ClipboardCheck} label="Total" value={inspection.total ?? "—"} cls="bg-cyan-500/10 text-cyan-400" />
              <StatCard icon={CheckCircle2} label="Accepted" value={inspection.accepted ?? "—"} cls="bg-emerald-500/10 text-emerald-400" />
              <StatCard icon={XCircle} label="Rejected" value={inspection.rejected ?? "—"} cls="bg-red-500/10 text-red-400" />
              <StatCard icon={Award} label="Accept Rate" value={inspection.acceptance_rate != null ? `${(Number(inspection.acceptance_rate) * 100).toFixed(1)}%` : "—"} cls="bg-violet-500/10 text-violet-400" />
            </div>
          </div>
        )}

        {/* Fallback if no dashboard data */}
        {!economy && !realms && !bloodline && !inspection && !dataQ.isLoading && (
          <Card className="bg-card/50 border-card-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Economy data not available from /api/data endpoint.</p>
          </Card>
        )}
        {dataQ.isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        )}
      </section>
    </div>
  );
}
