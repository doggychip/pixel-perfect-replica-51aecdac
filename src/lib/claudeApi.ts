import { type Theory } from "@/data/theories";
import { type CollisionResult } from "@/types/collision";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export function getApiKey(): string | null {
  return localStorage.getItem("anthropic_api_key");
}

export function setApiKey(key: string) {
  localStorage.setItem("anthropic_api_key", key);
}

export function clearApiKey() {
  localStorage.removeItem("anthropic_api_key");
}

export async function collideWithClaude(
  theoryA: Theory,
  theoryB: Theory,
  mode: string,
  modeDesc: string,
  apiKey: string
): Promise<CollisionResult> {
  const prompt = `You are the Theory Collision Engine. You collide two theories from different domains to produce novel intellectual frameworks.

Theory A: "${theoryA.name}" (${theoryA.chinese}) from ${theoryA.domain}
Core: ${theoryA.core}
Key factors: ${theoryA.factors.join(", ")}

Theory B: "${theoryB.name}" (${theoryB.chinese}) from ${theoryB.domain}
Core: ${theoryB.core}
Key factors: ${theoryB.factors.join(", ")}

Collision Mode: ${mode} — ${modeDesc}

Collide these two theories using the specified mode. Return a JSON object with exactly these fields:
{
  "framework_name": "Name of the new framework (include Chinese translation in parentheses)",
  "core_insight": "The central insight of this collision (2-3 sentences)",
  "structural_similarities": ["3-4 structural parallels between the theories"],
  "novel_connections": ["3-4 surprising new connections discovered"],
  "practical_applications": ["3-4 real-world applications of this framework"],
  "quality_score": 7,
  "reasoning": "Brief explanation of why this collision is productive"
}

The quality_score should be 1-10 based on how productive and novel the collision is.
Return ONLY the JSON object, no markdown formatting or code blocks.`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.content[0]?.text || "";
  
  // Try to parse JSON from the response
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      parsed = JSON.parse(match[1].trim());
    } else {
      throw new Error("Failed to parse response as JSON");
    }
  }

  return {
    id: crypto.randomUUID(),
    theoryA: { name: theoryA.name, chinese: theoryA.chinese, domain: theoryA.domain },
    theoryB: { name: theoryB.name, chinese: theoryB.chinese, domain: theoryB.domain },
    mode,
    framework_name: parsed.framework_name,
    core_insight: parsed.core_insight,
    structural_similarities: parsed.structural_similarities,
    novel_connections: parsed.novel_connections,
    practical_applications: parsed.practical_applications,
    quality_score: parsed.quality_score,
    reasoning: parsed.reasoning,
    timestamp: Date.now(),
  };
}
