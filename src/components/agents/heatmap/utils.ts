import * as THREE from "three";
import type { AgentData, PositionedAgent } from "./types";

// ─── Realm position offsets ───
export const REALM_ZONES: Record<string, { cx: number; cz: number }> = {
  research: { cx: -3, cz: -1 },
  execution: { cx: 3, cz: -1 },
  central: { cx: 0, cz: 3 },
};

// ─── Color by performance score ───
export function scoreColor(score: number): THREE.Color {
  const t = Math.max(0, Math.min(1, score));
  if (t < 0.5) {
    const s = t / 0.5;
    return new THREE.Color().setHSL(0.05 * s, 0.85, 0.45 + s * 0.1);
  }
  const s = (t - 0.5) / 0.5;
  return new THREE.Color().setHSL(0.05 + s * 0.45, 0.8, 0.5 + s * 0.1);
}

// ─── Compute world positions for all agents ───
export function computeAgentPositions(agents: AgentData[]): PositionedAgent[] {
  const groups: Record<string, AgentData[]> = { research: [], execution: [], central: [] };
  agents.forEach((a) => {
    const realm = a.realm ?? "central";
    if (!groups[realm]) groups[realm] = [];
    groups[realm].push(a);
  });

  const result: PositionedAgent[] = [];
  Object.values(groups).forEach((group) => {
    group.forEach((agent, index) => {
      const realm = agent.realm ?? "central";
      const zone = REALM_ZONES[realm] ?? REALM_ZONES.central;
      const total = group.length;
      const angle = (index / Math.max(total, 1)) * Math.PI * 2 + index * 0.618;
      const radius = 1.2 + (index % 3) * 0.6;
      const x = zone.cx + Math.cos(angle) * radius;
      const z = zone.cz + Math.sin(angle) * radius;
      const score = agent.avg_score ?? agent.score ?? 0.5;
      const height = Math.max(0.2, score * 3);
      const alive = agent.status === "alive" || agent.status === "active";
      result.push({ agent, x, z, height, score, alive });
    });
  });
  return result;
}

// ─── Realm label colors ───
export const REALM_COLORS: Record<string, string> = {
  research: "#a78bfa",
  execution: "#fbbf24",
  central: "#22d3ee",
};
