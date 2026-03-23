import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const response = await fetch("https://uprjhveymnzgwhgjpjcp.supabase.co/functions/v1/ai-proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI proxy error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    let jsonStr = text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(jsonStr);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
