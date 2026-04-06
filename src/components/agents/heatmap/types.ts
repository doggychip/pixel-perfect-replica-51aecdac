export interface AgentData {
  id: string;
  role?: string;
  realm?: string;
  budget?: number;
  avg_score?: number;
  score?: number;
  status?: string;
  generation?: number;
}

export interface PositionedAgent {
  agent: AgentData;
  x: number;
  z: number;
  height: number;
  score: number;
  alive: boolean;
}
