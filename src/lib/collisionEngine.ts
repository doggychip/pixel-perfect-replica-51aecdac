import { type CollisionTheory } from "@/data/collision-theories";
import { type CollisionResult } from "@/types/collision";

// Deterministic hash for consistent results
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const frameworkPrefixes = [
  "Resonant", "Emergent", "Unified", "Recursive", "Spectral", "Entropic",
  "Coherent", "Adaptive", "Convergent", "Dialectical", "Fractal", "Holographic",
  "Symbiotic", "Catalytic", "Inverse", "Harmonic", "Quantum-Classical",
];

const frameworkSuffixes = [
  "Architecture", "Dynamics", "Framework", "Synthesis", "Topology", "Theory",
  "Principle", "Manifold", "Engine", "Protocol", "Field", "Lattice",
];

export function generateCollision(
  theoryA: CollisionTheory,
  theoryB: CollisionTheory,
  mode: string
): CollisionResult {
  const seed = simpleHash(`${theoryA.id}-${theoryB.id}-${mode}`);
  const pick = <T,>(arr: T[], offset = 0): T => arr[(seed + offset) % arr.length];

  const fwName = `${pick(frameworkPrefixes)} ${pick(frameworkSuffixes, 3)}`;
  const chineseParts = ["共振", "涌现", "统一", "递归", "光谱", "熵", "自适应", "收敛", "辩证", "分形"];
  const chineseSuffix = ["架构", "动力学", "框架", "合成", "拓扑", "理论"];
  const fwChinese = `${pick(chineseParts, 2)}${pick(chineseSuffix, 5)}`;

  const modeInsights: Record<string, string> = {
    Reinforce: `Both ${theoryA.name} and ${theoryB.name} converge on a shared structural principle: systems that maintain coherence through selective information processing. This reinforcement reveals that ${theoryA.factors[0]} and ${theoryB.factors[0]} are manifestations of the same underlying mechanism operating at different scales.`,
    Extend: `${theoryA.name} provides the missing dynamical framework that ${theoryB.name} implicitly requires. By mapping ${theoryA.factors[0]} onto ${theoryB.factors[1]}, we extend ${theoryB.name} into a predictive theory capable of handling ${theoryA.factors[2]}-like phenomena in ${theoryB.domain} contexts.`,
    Contrast: `The fundamental tension between ${theoryA.name}'s emphasis on ${theoryA.factors[0]} and ${theoryB.name}'s reliance on ${theoryB.factors[0]} reveals a deep complementarity. Where ${theoryA.name} assumes discrete states, ${theoryB.name} demands continuous flows — this contrast illuminates blind spots in both frameworks.`,
    Fuse: `Merging ${theoryA.name} with ${theoryB.name} produces a unified framework where ${theoryA.factors[0]} and ${theoryB.factors[0]} become dual aspects of a single generative process. The fused theory predicts phenomena invisible to either parent theory alone.`,
    Collapse: `Pushing both theories to their extremes reveals that ${theoryA.name}'s ${theoryA.factors[0]} and ${theoryB.name}'s ${theoryB.factors[0]} converge to the same degenerate limit — a point where both frameworks break down and something entirely new must emerge.`,
    "Fuse-Collapse": `After fusing ${theoryA.name} and ${theoryB.name} into a unified model, stress-testing reveals that the merged framework is most robust when ${theoryA.factors[1]} dominates, but collapses into novel behavior when ${theoryB.factors[1]} takes over — suggesting a phase transition in the meta-theory itself.`,
    Adversarial: `When pitted against each other, ${theoryA.name} wins in domains requiring ${theoryA.factors[0]}, while ${theoryB.name} dominates where ${theoryB.factors[0]} matters. The boundary between their regimes of validity maps exactly onto the transition between ${theoryA.factors[2]} and ${theoryB.factors[2]}.`,
  };

  const similarities = [
    `Both involve ${theoryA.factors[0]} as an analog of ${theoryB.factors[0]} — suggesting a shared information-theoretic substrate`,
    `The role of ${theoryA.factors[1]} in ${theoryA.name} mirrors ${theoryB.factors[1]} in ${theoryB.name} at the structural level`,
    `Both theories implicitly assume a boundary condition where ${theoryA.factors[2]} and ${theoryB.factors[2]} become equivalent`,
    `The mathematical formalism underlying both can be expressed as optimization over a shared constraint space`,
  ];

  const connections = [
    `${theoryA.domain}'s concept of ${theoryA.factors[0]} could revolutionize how we model ${theoryB.factors[1]} in ${theoryB.domain}`,
    `The failure modes of ${theoryA.name} map precisely onto the success conditions of ${theoryB.name}`,
    `Applying ${theoryB.name}'s ${theoryB.factors[0]} to ${theoryA.domain} predicts an entirely new class of phenomena: "${theoryA.factors[2]}-mediated ${theoryB.factors[2]}"`,
  ];

  const applications = [
    `Product design: Use ${theoryA.factors[0]} principles to optimize ${theoryB.factors[1]} in user experience flows`,
    `Business strategy: Apply the ${fwName} to identify phase transitions in market dynamics before competitors`,
    `AI systems: Build agents that leverage ${theoryA.factors[1]}-${theoryB.factors[0]} duality for more robust decision-making`,
  ];

  const score = 5 + (seed % 5);

  return {
    id: crypto.randomUUID(),
    theoryA: { name: theoryA.name, chinese: theoryA.nameCn, domain: theoryA.domain },
    theoryB: { name: theoryB.name, chinese: theoryB.nameCn, domain: theoryB.domain },
    mode,
    framework_name: `${fwName} (${fwChinese})`,
    core_insight: modeInsights[mode] || modeInsights["Fuse"],
    structural_similarities: similarities,
    novel_connections: connections,
    practical_applications: applications,
    quality_score: score,
    reasoning: `Cross-domain collision between ${theoryA.domain} and ${theoryB.domain} produces ${score >= 7 ? "highly" : "moderately"} productive synthesis due to ${score >= 7 ? "deep structural isomorphisms" : "surface-level parallels that hint at deeper connections"}.`,
    timestamp: Date.now(),
  };
}
