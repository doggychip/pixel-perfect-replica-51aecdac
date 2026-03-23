export interface CollisionResult {
  id: string;
  theoryA: { name: string; chinese: string; domain: string };
  theoryB: { name: string; chinese: string; domain: string };
  mode: string;
  framework_name: string;
  core_insight: string;
  structural_similarities: string[];
  novel_connections: string[];
  practical_applications: string[];
  quality_score: number;
  reasoning: string;
  timestamp: number;
}
