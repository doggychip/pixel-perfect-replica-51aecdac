export type Domain = "Quantum Physics" | "Cognitive Science" | "Dynamic Systems" | "Information Theory" | "Topology" | "Neuroscience";

export interface Theory {
  id: number;
  name: string;
  chinese: string;
  domain: Domain;
  core: string;
  factors: string[];
}

export const DOMAIN_COLORS: Record<Domain, string> = {
  "Quantum Physics": "quantum",
  "Cognitive Science": "cognitive",
  "Dynamic Systems": "dynamic",
  "Information Theory": "information",
  "Topology": "topology",
  "Neuroscience": "neuroscience",
};

export const DOMAINS: Domain[] = [
  "Quantum Physics",
  "Cognitive Science",
  "Dynamic Systems",
  "Information Theory",
  "Topology",
  "Neuroscience",
];

export const COLLISION_MODES = [
  { value: "Reinforce", label: "Reinforce (强化)", desc: "Find where both theories confirm the same principle" },
  { value: "Extend", label: "Extend (延伸)", desc: "Use theory A to extend theory B into new territory" },
  { value: "Contrast", label: "Contrast (对比)", desc: "Find where they fundamentally disagree" },
  { value: "Fuse", label: "Fuse (融合)", desc: "Merge both into a unified framework" },
  { value: "Collapse", label: "Collapse (坍缩)", desc: "Push both to their logical extremes" },
  { value: "Fuse-Collapse", label: "Fuse-Collapse (融合坍缩)", desc: "Merge then stress-test" },
  { value: "Adversarial", label: "Adversarial (对抗)", desc: "Pit them against each other" },
];

export const theories: Theory[] = [
  // Quantum Physics (8)
  { id: 1, name: "Quantum Superposition", chinese: "量子叠加", domain: "Quantum Physics", core: "A system exists in all possible states simultaneously until measured.", factors: ["state space", "probability amplitude", "measurement collapse"] },
  { id: 2, name: "Quantum Entanglement", chinese: "量子纠缠", domain: "Quantum Physics", core: "Particles become correlated so measuring one instantly affects the other.", factors: ["non-locality", "correlation", "Bell inequality"] },
  { id: 3, name: "Wave-Particle Duality", chinese: "波粒二象性", domain: "Quantum Physics", core: "Quantum entities exhibit both wave and particle properties.", factors: ["complementarity", "observation context", "interference"] },
  { id: 4, name: "Uncertainty Principle", chinese: "不确定性原理", domain: "Quantum Physics", core: "Cannot simultaneously know position and momentum with perfect precision.", factors: ["conjugate variables", "measurement limits", "information trade-off"] },
  { id: 5, name: "Quantum Tunneling", chinese: "量子隧穿", domain: "Quantum Physics", core: "Particles can pass through energy barriers they classically shouldn't.", factors: ["barrier width", "probability decay", "energy landscape"] },
  { id: 6, name: "Quantum Decoherence", chinese: "量子退相干", domain: "Quantum Physics", core: "Quantum systems lose coherence through environmental interaction.", factors: ["environment coupling", "information leakage", "classical emergence"] },
  { id: 7, name: "Quantum Field Theory", chinese: "量子场论", domain: "Quantum Physics", core: "Particles are excitations of underlying fields.", factors: ["field dynamics", "virtual particles", "vacuum energy"] },
  { id: 8, name: "Many-Worlds Interpretation", chinese: "多世界诠释", domain: "Quantum Physics", core: "Every quantum measurement splits reality into parallel branches.", factors: ["branching", "universal wavefunction", "observer perspective"] },

  // Cognitive Science (8)
  { id: 9, name: "Dual Process Theory", chinese: "双重加工理论", domain: "Cognitive Science", core: "System 1 (fast/intuitive) vs System 2 (slow/deliberate) thinking.", factors: ["cognitive load", "heuristics", "rationality"] },
  { id: 10, name: "Embodied Cognition", chinese: "具身认知", domain: "Cognitive Science", core: "Thinking is shaped by the body's interactions with the environment.", factors: ["sensorimotor coupling", "situated action", "body schema"] },
  { id: 11, name: "Predictive Processing", chinese: "预测处理", domain: "Cognitive Science", core: "The brain constantly generates predictions and updates on prediction errors.", factors: ["prediction error", "generative model", "precision weighting"] },
  { id: 12, name: "Cognitive Load Theory", chinese: "认知负荷理论", domain: "Cognitive Science", core: "Working memory has limited capacity affecting learning.", factors: ["intrinsic load", "extraneous load", "germane load"] },
  { id: 13, name: "Theory of Mind", chinese: "心智理论", domain: "Cognitive Science", core: "Ability to attribute mental states to others.", factors: ["perspective taking", "belief attribution", "social cognition"] },
  { id: 14, name: "Flow State", chinese: "心流状态", domain: "Cognitive Science", core: "Optimal experience when challenge matches skill level.", factors: ["challenge-skill balance", "clear goals", "immediate feedback"] },
  { id: 15, name: "Metacognition", chinese: "元认知", domain: "Cognitive Science", core: "Thinking about thinking — awareness and regulation of cognitive processes.", factors: ["self-monitoring", "strategy selection", "confidence calibration"] },
  { id: 16, name: "Distributed Cognition", chinese: "分布式认知", domain: "Cognitive Science", core: "Cognition extends beyond the individual into tools and social groups.", factors: ["cognitive artifacts", "social coordination", "information propagation"] },

  // Dynamic Systems (8)
  { id: 17, name: "Chaos Theory", chinese: "混沌理论", domain: "Dynamic Systems", core: "Deterministic systems can produce unpredictable behavior from sensitivity to initial conditions.", factors: ["butterfly effect", "strange attractors", "fractal boundaries"] },
  { id: 18, name: "Self-Organized Criticality", chinese: "自组织临界性", domain: "Dynamic Systems", core: "Systems naturally evolve toward critical states where small events can trigger cascades.", factors: ["power laws", "avalanches", "sandpile model"] },
  { id: 19, name: "Feedback Loops", chinese: "反馈回路", domain: "Dynamic Systems", core: "Output of a system feeds back as input, creating reinforcing or balancing dynamics.", factors: ["positive feedback", "negative feedback", "delay"] },
  { id: 20, name: "Emergence", chinese: "涌现", domain: "Dynamic Systems", core: "Complex patterns arise from simple rules at lower levels.", factors: ["local interactions", "global patterns", "irreducibility"] },
  { id: 21, name: "Attractor Dynamics", chinese: "吸引子动力学", domain: "Dynamic Systems", core: "Systems tend toward certain states (point, cycle, or strange attractors).", factors: ["basin of attraction", "stability", "bifurcation"] },
  { id: 22, name: "Phase Transitions", chinese: "相变", domain: "Dynamic Systems", core: "Systems undergo qualitative changes at critical thresholds.", factors: ["critical point", "order parameter", "symmetry breaking"] },
  { id: 23, name: "Dissipative Structures", chinese: "耗散结构", domain: "Dynamic Systems", core: "Order can emerge in far-from-equilibrium systems through energy dissipation.", factors: ["entropy export", "self-organization", "energy flow"] },
  { id: 24, name: "Autopoiesis", chinese: "自创生", domain: "Dynamic Systems", core: "Self-maintaining systems that produce their own components.", factors: ["operational closure", "structural coupling", "self-production"] },

  // Information Theory (8)
  { id: 25, name: "Shannon Entropy", chinese: "香农熵", domain: "Information Theory", core: "Quantifies information as reduction of uncertainty.", factors: ["probability distribution", "surprise", "compression"] },
  { id: 26, name: "Mutual Information", chinese: "互信息", domain: "Information Theory", core: "Measures shared information between two variables.", factors: ["dependency", "redundancy", "synergy"] },
  { id: 27, name: "Kolmogorov Complexity", chinese: "柯尔莫哥洛夫复杂度", domain: "Information Theory", core: "Shortest program that produces a given output.", factors: ["algorithmic randomness", "compressibility", "minimal description"] },
  { id: 28, name: "Error Correction Codes", chinese: "纠错码", domain: "Information Theory", core: "Redundancy enables reliable communication over noisy channels.", factors: ["redundancy", "noise tolerance", "capacity bounds"] },
  { id: 29, name: "Maximum Entropy Principle", chinese: "最大熵原理", domain: "Information Theory", core: "In absence of information, assume the distribution with maximum entropy.", factors: ["prior ignorance", "constraint satisfaction", "least bias"] },
  { id: 30, name: "Information Bottleneck", chinese: "信息瓶颈", domain: "Information Theory", core: "Optimal representations compress input while preserving relevant information.", factors: ["compression", "relevance", "trade-off curve"] },
  { id: 31, name: "Integrated Information Theory", chinese: "整合信息理论", domain: "Information Theory", core: "Consciousness correlates with integrated information (Φ).", factors: ["integration", "differentiation", "causal power"] },
  { id: 32, name: "Algorithmic Information Dynamics", chinese: "算法信息动力学", domain: "Information Theory", core: "Using algorithmic complexity to model causation in dynamic systems.", factors: ["perturbation", "program-size change", "causal discovery"] },

  // Topology (8)
  { id: 33, name: "Manifold Theory", chinese: "流形理论", domain: "Topology", core: "Complex spaces locally resemble simple Euclidean space.", factors: ["local-global relationship", "charts", "smooth structure"] },
  { id: 34, name: "Homology", chinese: "同调论", domain: "Topology", core: "Classifies spaces by their holes and voids.", factors: ["cycles", "boundaries", "Betti numbers"] },
  { id: 35, name: "Fixed Point Theorems", chinese: "不动点定理", domain: "Topology", core: "Certain mappings must have points that map to themselves.", factors: ["contraction", "continuity", "existence guarantees"] },
  { id: 36, name: "Topological Phase Transitions", chinese: "拓扑相变", domain: "Topology", core: "Changes in topological invariants signal qualitative system shifts.", factors: ["invariants", "winding numbers", "topological order"] },
  { id: 37, name: "Persistent Homology", chinese: "持续同调", domain: "Topology", core: "Tracks topological features across multiple scales.", factors: ["filtration", "persistence diagram", "multi-scale structure"] },
  { id: 38, name: "Fiber Bundles", chinese: "纤维丛", domain: "Topology", core: "Spaces built by attaching fibers to a base space.", factors: ["local triviality", "connection", "parallel transport"] },
  { id: 39, name: "Morse Theory", chinese: "莫尔斯理论", domain: "Topology", core: "Studies topology through critical points of smooth functions.", factors: ["critical points", "index", "gradient flow"] },
  { id: 40, name: "Knot Theory", chinese: "纽结理论", domain: "Topology", core: "Studies mathematical knots and their invariants.", factors: ["knot invariants", "linking number", "unknotting"] },

  // Neuroscience (9)
  { id: 41, name: "Hebbian Learning", chinese: "赫布学习", domain: "Neuroscience", core: "\"Neurons that fire together, wire together.\"", factors: ["synaptic plasticity", "co-activation", "long-term potentiation"] },
  { id: 42, name: "Neural Oscillations", chinese: "神经振荡", domain: "Neuroscience", core: "Brain rhythms coordinate information processing across regions.", factors: ["frequency bands", "synchronization", "phase coupling"] },
  { id: 43, name: "Default Mode Network", chinese: "默认模式网络", domain: "Neuroscience", core: "Brain network active during rest, self-reflection, and mind-wandering.", factors: ["self-referential processing", "memory consolidation", "creativity"] },
  { id: 44, name: "Neuroplasticity", chinese: "神经可塑性", domain: "Neuroscience", core: "The brain's ability to reorganize itself throughout life.", factors: ["experience-dependent change", "critical periods", "compensation"] },
  { id: 45, name: "Mirror Neurons", chinese: "镜像神经元", domain: "Neuroscience", core: "Neurons that fire both when acting and when observing the same action.", factors: ["action understanding", "empathy", "imitation"] },
  { id: 46, name: "Predictive Coding", chinese: "预测编码", domain: "Neuroscience", core: "Brain minimizes prediction errors in a hierarchical generative model.", factors: ["top-down predictions", "bottom-up errors", "hierarchical inference"] },
  { id: 47, name: "Global Workspace Theory", chinese: "全局工作空间理论", domain: "Neuroscience", core: "Consciousness arises when information is broadcast across brain regions.", factors: ["broadcasting", "access", "workspace ignition"] },
  { id: 48, name: "Connectome", chinese: "连接组", domain: "Neuroscience", core: "Complete map of neural connections in the brain.", factors: ["structural connectivity", "functional connectivity", "network topology"] },
  { id: 49, name: "Free Energy Principle", chinese: "自由能原理", domain: "Neuroscience", core: "Biological systems minimize surprise by updating internal models.", factors: ["variational inference", "active inference", "Markov blankets"] },
];
