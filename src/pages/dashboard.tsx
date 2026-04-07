import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { fetchAgents } from "@/lib/agents-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot, Activity, ArrowRight, TrendingUp, AlertTriangle, Zap,
  CheckCircle2, XCircle, Loader2, Package,
} from "lucide-react";

const API = "https://zhihuiti-oracle.zeabur.app";

export default function DashboardPage() {
  const statusQ = useQuery<any>({
    queryKey: ["dash-status"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/status`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 10_000,
    retry: 1,
  });

  const agentsQ = useQuery<any[]>({
    queryKey: ["dash-agents"],
    queryFn: fetchAgents,
    refetchInterval: 10_000,
    retry: 1,
  });

  const evolutionQ = useQuery<any>({
    queryKey: ["dash-evolution"],
    queryFn: async () => {
      const res = await fetch(`${API}/api/evolution`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 30_000,
    retry: 1,
  });

  const status = statusQ.data;
  const agents = agentsQ.data ?? [];
  const evolution = evolutionQ.data;

  const activeAgents = agents.filter((a: any) => a.status === "alive").length;
  const recentGoals: any[] = (evolution?.recent_goals ?? []).slice(0, 5);

  const offline = statusQ.isError && agentsQ.isError;

  const statCards = [
    {
      label: "Total Agents",
      value: statusQ.isLoading ? null : (status?.agent_count ?? agents.length),
      icon: Bot,
      color: "text-cyan-400",
    },
    {
      label: "Active Agents",
      value: agentsQ.isLoading ? null : activeAgents,
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Total Trades",
      value: statusQ.isLoading ? null : (status?.economy?.transactions ?? 0),
      icon: TrendingUp,
      color: "text-purple-400",
    },
    {
      label: "Products",
      value: statusQ.isLoading ? null : (status?.memory?.total_tasks ?? 0),
      icon: Package,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="grid-pattern min-h-screen">
      <div className="p-6 lg:p-10 max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Oracle Platform
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Big Brain <span className="text-cyan-400">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live overview of your Oracle agents and system metrics.
          </p>
        </div>

        {/* Offline */}
        {offline && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h3 className="font-semibold text-amber-300 mb-1">Backend Offline</h3>
            <p className="text-sm text-muted-foreground">Cannot reach Oracle API. Auto-retrying every 10s.</p>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((stat, i) => (
            <Card key={i} className="bg-card/50 border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                {stat.value === null ? (
                  <Skeleton className="h-7 w-16" />
                ) : (
                  <div className="font-mono text-2xl font-semibold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Agent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-semibold">Recent Agent Activity</h2>
            </div>
            <Link href="/agents">
              <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium">
                All Agents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {evolutionQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentGoals.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card/50 p-8 text-center">
              <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent goals yet.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {recentGoals.map((goal: any, i: number) => {
                const done = goal.status === "completed";
                const failed = goal.status === "failed";
                return (
                  <div key={i} className="rounded-lg border border-card-border bg-card/50 p-3 flex items-center gap-3 hover:bg-accent/20 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-500/10 text-emerald-400" : failed ? "bg-red-500/10 text-red-400" : "bg-cyan-500/10 text-cyan-400"}`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : failed ? <XCircle className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{goal.goal ?? goal.text ?? "—"}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-medium ${done ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : failed ? "text-red-400 border-red-400/30 bg-red-400/10" : "text-cyan-400 border-cyan-400/30 bg-cyan-400/10"}`}>
                      {goal.status ?? "pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Agents Preview */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h2 className="text-base font-semibold">Oracle Agents</h2>
            </div>
            <Link href="/agents">
              <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium">
                All Agents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

          {agentsQ.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card/50 p-8 text-center">
              <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No agents yet.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {agents.slice(0, 6).map((agent: any) => (
                <div key={agent.id} className="rounded-lg border border-card-border bg-card/50 p-3 flex items-center gap-3 hover:bg-accent/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/agents/${agent.id}`}>
                      <span className="font-medium hover:text-cyan-400 transition-colors cursor-pointer truncate text-sm">
                        {agent.name}
                      </span>
                    </Link>
                    <p className="text-xs text-muted-foreground capitalize">{agent.role} · {agent.realm}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${agent.status === "alive" ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-red-400 border-red-400/30 bg-red-400/10"}`}>
                    {agent.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
