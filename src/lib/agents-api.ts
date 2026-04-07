const AGENTS_URL = "https://zhihuiti-oracle.zeabur.app/api/agents";

/**
 * Map zhihuiti API shape → dashboard-expected shape.
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
