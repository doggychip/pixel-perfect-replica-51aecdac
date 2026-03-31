import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { formatCurrency, pnlColor, agentTypeBadgeClass, agentTypeLabel, formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Activity, ArrowRight, TrendingUp, Search, FlaskConical, Shield, AlertTriangle, Zap } from "lucide-react";

const API = "https://zhihuiti-oracle.zeabur.app/api/oracle";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  scanner: <Search className="w-4 h-4" />,
  trader: <TrendingUp className="w-4 h-4" />,
  researcher: <FlaskConical className="w-4 h-4" />,
  sentinel: <Shield className="w-4 h-4" />,
};

export default function DashboardPage() {
  const { data: agents, isLoading: agentsLoading, isError: agentsError } = useQuery<any[]>({
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

  const { data: cryptoData, isLoading: cryptoLoading } = useQuery<any>({
    queryKey: ["oracle-crypto"],
    queryFn: async () => {
      const res = await fetch(`${API}/crypto`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 15_000,
    retry: 1,
  });

  const prices: any[] = cryptoData?.results ?? [];
  const agentList = agents ?? [];

  // Derived stats
  const roleCount = agentList.reduce((acc: Record<string, number>, a: any) => {
    acc[a.role] = (acc[a.role] ?? 0) + 1;
    return acc;
  }, {});

  const trendingUp = prices.filter((p: any) => p.regime === "trending_up").length;
  const trendingDown = prices.filter((p: any) => p.regime === "trending_down").length;

  const statCards = [
    {
      label: "Total Agents",
      value: agentsLoading ? null : agentList.length,
      icon: Bot,
      color: "text-cyan-400",
    },
    {
      label: "Agent Roles",
      value: agentsLoading ? null : Object.keys(roleCount).length,
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      label: "Instruments Tracked",
      value: cryptoLoading ? null : prices.length,
      icon: Zap,
      color: "text-purple-400",
    },
    {
      label: "Trending Up",
      value: cryptoLoading ? null : trendingUp,
      icon: TrendingUp,
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
            Live overview of your Oracle agents and market instruments.
          </p>
        </div>

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

        {/* Live Prices */}
        {prices.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE PRICES
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {prices.map((p: any) => (
                <div key={p.instrument} className="flex-shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg bg-card/50 border border-card-border">
                  <span className="text-xs font-medium text-foreground">{p.instrument.replace("_USDT", "")}</span>
                  <span className="font-mono text-xs text-foreground">{formatCurrency(p.price)}</span>
                  <span className={`font-mono text-xs ${(p.change_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(p.change_pct ?? 0) >= 0 ? "+" : ""}{((p.change_pct ?? 0) * 100).toFixed(2)}%
                  </span>
                  <Badge variant="outline" className={`text-[9px] ${p.regime === "trending_up" ? "text-emerald-400 border-emerald-400/30" : p.regime === "trending_down" ? "text-red-400 border-red-400/30" : "text-muted-foreground border-muted"}`}>
                    {p.regime?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Agents List */}
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

          {agentsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : agentsError ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h3 className="font-semibold text-amber-300 mb-1">Backend Offline</h3>
              <p className="text-sm text-muted-foreground">Cannot reach Oracle API. Auto-retrying every 30s.</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">{API}/agents</p>
            </div>
          ) : agentList.length === 0 ? (
            <div className="rounded-lg border border-card-border bg-card/50 p-8 text-center">
              <Bot className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No agents yet.</p>
              <Link href="/agents">
                <button className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                  Create your first agent →
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-2">
              {agentList.slice(0, 8).map((agent: any) => (
                <div key={agent.id ?? agent._id} className="rounded-lg border border-card-border bg-card/50 p-3 flex items-center gap-3 hover:bg-accent/20 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${agentTypeBadgeClass(agent.role)}`}>
                    {ROLE_ICONS[agent.role] ?? <Bot className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/agents/${agent.id ?? agent._id}`}>
                        <span className="font-medium hover:text-cyan-400 transition-colors cursor-pointer truncate">
                          {agent.name}
                        </span>
                      </Link>
                      <Badge variant="outline" className={`text-[10px] font-medium ${agentTypeBadgeClass(agent.role)}`}>
                        {agentTypeLabel(agent.role)}
                      </Badge>
                    </div>
                    {agent.instruments?.length > 0 && (
                      <span className="text-xs text-muted-foreground">📊 {agent.instruments.join(", ")}</span>
                    )}
                  </div>
                  {agent.createdAt && (
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(agent.createdAt)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
