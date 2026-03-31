import { useQuery } from "@tanstack/react-query";
import { formatCurrency, pnlColor, agentTypeBadgeClass, agentTypeLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, TrendingUp, TrendingDown, Activity, AlertTriangle, Zap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

const API = "https://zhihuiti-oracle.zeabur.app/api/oracle";

const REGIME_COLORS: Record<string, string> = {
  trending_up: "#10b981",
  trending_down: "#ef4444",
  quiet: "#6b7280",
  volatile: "#f59e0b",
};

const ROLE_COLORS: Record<string, string> = {
  scanner: "#38bdf8",
  trader: "#10b981",
  researcher: "#8b5cf6",
  sentinel: "#f59e0b",
};

export default function AnalyticsPage() {
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
  const isLoading = agentsLoading || cryptoLoading;

  // Role distribution for pie chart
  const roleDistribution = Object.entries(
    agentList.reduce((acc: Record<string, number>, a: any) => {
      acc[a.role] = (acc[a.role] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([role, count]) => ({ name: agentTypeLabel(role), value: count as number, role }));

  // Market signal chart data
  const signalChartData = prices
    .sort((a: any, b: any) => (b.signal_score ?? 0) - (a.signal_score ?? 0))
    .map((p: any) => ({
      name: p.instrument.replace("_USDT", ""),
      score: parseFloat(((p.signal_score ?? 0) * 100).toFixed(1)),
      regime: p.regime,
    }));

  // Regime breakdown
  const regimeCounts = prices.reduce((acc: Record<string, number>, p: any) => {
    acc[p.regime] = (acc[p.regime] ?? 0) + 1;
    return acc;
  }, {});

  // Top signal
  const topSignal = prices.length > 0 ? prices.reduce((best, p) => (p.signal_score ?? 0) > (best.signal_score ?? 0) ? p : best) : null;

  const statCards = [
    {
      label: "Total Agents",
      value: agentsLoading ? null : agentList.length,
      icon: Bot,
      color: "text-cyan-400",
    },
    {
      label: "Instruments",
      value: cryptoLoading ? null : prices.length,
      icon: Activity,
      color: "text-purple-400",
    },
    {
      label: "Top Signal",
      value: cryptoLoading ? null : (topSignal ? `${topSignal.instrument.replace("_USDT", "")} (${((topSignal.signal_score ?? 0) * 100).toFixed(0)}%)` : "—"),
      icon: Zap,
      color: "text-emerald-400",
    },
    {
      label: "Trending Up",
      value: cryptoLoading ? null : (regimeCounts["trending_up"] ?? 0),
      icon: TrendingUp,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Live platform analytics from Oracle API</p>
      </div>

      {agentsError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="font-semibold text-amber-300 mb-1">Backend Offline</h3>
          <p className="text-sm text-muted-foreground">Auto-retrying every 30s.</p>
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
                <Skeleton className="h-6 w-24" />
              ) : (
                <div className={`text-lg font-semibold ${stat.color}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Signal Scores Chart */}
      <Card className="bg-card/50 border-card-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Signal Scores by Instrument</CardTitle>
        </CardHeader>
        <CardContent>
          {cryptoLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : signalChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              No market data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={signalChartData} layout="vertical" margin={{ left: 16, right: 24, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={60}
                  tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: 12,
                  }}
                  formatter={(v: any) => [`${v}%`, "Signal Score"]}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {signalChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={REGIME_COLORS[entry.regime] ?? "#6b7280"}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-3">
        {/* Agent Role Distribution */}
        <Card className="bg-card/50 border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Agent Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {agentsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : roleDistribution.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No agents created yet
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={35}
                      strokeWidth={0}
                    >
                      {roleDistribution.map((entry, i) => (
                        <Cell key={i} fill={ROLE_COLORS[entry.role] ?? "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {roleDistribution.map((r) => (
                    <div key={r.role} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[r.role] ?? "#6b7280" }} />
                      <span className="text-muted-foreground">{r.name}</span>
                      <span className="font-mono font-medium">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Regime Breakdown */}
        <Card className="bg-card/50 border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Market Regime Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {cryptoLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : prices.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                No market data available
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {Object.entries(regimeCounts).map(([regime, count]) => (
                  <div key={regime}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs capitalize text-muted-foreground">{regime.replace("_", " ")}</span>
                      <span className="text-xs font-mono font-medium">{count as number}/{prices.length}</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${((count as number) / prices.length) * 100}%`,
                          backgroundColor: REGIME_COLORS[regime] ?? "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instrument Details Table */}
      {!cryptoLoading && prices.length > 0 && (
        <Card className="bg-card/50 border-card-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Instrument Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-muted-foreground text-xs">
                  <th className="text-left py-2.5 px-4 font-medium">Instrument</th>
                  <th className="text-right py-2.5 px-4 font-medium">Price</th>
                  <th className="text-right py-2.5 px-4 font-medium">Change</th>
                  <th className="text-left py-2.5 px-4 font-medium hidden md:table-cell">Regime</th>
                  <th className="text-left py-2.5 px-4 font-medium hidden lg:table-cell">Dominant Theory</th>
                  <th className="text-right py-2.5 px-4 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((p: any) => (
                  <tr key={p.instrument} className="border-b border-card-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 px-4 font-medium">{p.instrument.replace("_USDT", "")}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs">{formatCurrency(p.price)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono text-xs ${(p.change_pct ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {(p.change_pct ?? 0) >= 0 ? "+" : ""}{((p.change_pct ?? 0) * 100).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-4 hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px]" style={{ color: REGIME_COLORS[p.regime] ?? "#6b7280", borderColor: `${REGIME_COLORS[p.regime] ?? "#6b7280"}50` }}>
                        {p.regime?.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell capitalize">
                      {p.dominant_theory?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs font-medium">
                      {((p.signal_score ?? 0) * 100).toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
