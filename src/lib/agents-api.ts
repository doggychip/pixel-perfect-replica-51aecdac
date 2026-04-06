const AGENTS_URL = import.meta.env.DEV
  ? "http://localhost:5050/api/all-agents"
  : "https://agentscity.zeabur.app/api/all-agents";

/**
 * Map agentscity API shape → dashboard-expected shape.
 * Source: {id, role, budget, depth, avg_score, alive, config, created_at, source}
 */
function mapAgent(raw: any): any {
  return {
    id: raw.id,
    role: raw.role ?? "unknown",
    name: raw.config?.name ?? raw.role ?? `Agent ${String(raw.id).slice(0, 6)}`,
    budget: raw.budget,
    avg_score: raw.avg_score,
    score: raw.avg_score,
    generation: raw.depth ?? 0,
    status: raw.alive ? "alive" : "dead",
    realm: raw.source ?? "unknown",
    createdAt: raw.created_at,
    instruments: raw.config?.instruments ?? [],
    _raw: raw,
  };
}

export async function fetchAgents(): Promise<any[]> {
  const res = await fetch(AGENTS_URL);
  if (!res.ok) throw new Error("Agents API offline");
  const json = await res.json();
  const list = Array.isArray(json) ? json : json.agents ?? json.data ?? [];
  return list.map(mapAgent);
}
