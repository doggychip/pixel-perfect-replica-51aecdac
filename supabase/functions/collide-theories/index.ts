import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { theoryA, theoryB, collisionMode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `You are a cross-disciplinary synthesis engine. Given two theories from different domains, find deep structural connections and generate a novel framework.

THEORY A: ${theoryA.name} (${theoryA.domain})
Core: ${theoryA.core}
Key factors: ${theoryA.factors.join(", ")}

THEORY B: ${theoryB.name} (${theoryB.domain})
Core: ${theoryB.core}
Key factors: ${theoryB.factors.join(", ")}

COLLISION MODE: ${collisionMode.label} (${collisionMode.labelCn}) — ${collisionMode.desc}

Respond ONLY in JSON (no markdown, no backticks):
{
  "framework_name": "A creative name for the new framework (English + Chinese)",
  "core_insight": "2-3 sentences describing the novel insight from this collision",
  "structural_similarities": ["list of 3-4 deep structural parallels found"],
  "novel_connections": ["list of 2-3 genuinely surprising cross-domain links"],
  "practical_applications": ["list of 2-3 concrete business/product applications"],
  "quality_score": 7,
  "reasoning": "1 sentence on why this collision is or isn't productive"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    let jsonStr = text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("collide-theories error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});