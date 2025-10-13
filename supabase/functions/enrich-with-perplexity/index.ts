import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeJsonParse<T = any>(text: string): T | null {
  try { return JSON.parse(text) as T } catch { return null }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "Missing PERPLEXITY_API_KEY" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { businessName, websiteUrl, location, industry } = await req.json();
    if (!websiteUrl && !businessName) {
      return new Response(JSON.stringify({ success: false, error: "Provide websiteUrl or businessName" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const prompt = `You are an analyst. Using only public web signals, estimate the following for the business. Return STRICT JSON only with the schema fields below. If unknown, set null.

Business:
- Name: ${businessName ?? ""}
- Website: ${websiteUrl ?? ""}
- Location: ${location ?? ""}
- Industry: ${industry ?? ""}

Schema:
{
  "website": {
    "estimated_monthly_visitors": number|null,
    "top_keywords": string[]|null
  },
  "social": {
    "total_followers": number|null,
    "engagement_rate": string|null
  },
  "reputation": {
    "average_rating": number|null,
    "total_reviews": number|null
  },
  "visibility": {
    "brand_search_volume": number|null,
    "online_mentions": number|null
  },
  "notes": string[]
}`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "Return only JSON, no prose." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ success: false, error: `Perplexity failed: ${t}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const json = await resp.json();
    const content: string | undefined = json?.choices?.[0]?.message?.content;
    let data = content?.trim() || "";

    // Some models wrap JSON in code fences; strip them
    if (data.startsWith("```")) {
      const first = data.indexOf("\n");
      const last = data.lastIndexOf("```");
      data = data.slice(first + 1, last).trim();
    }

    const parsed = safeJsonParse(data);
    if (!parsed) {
      return new Response(JSON.stringify({ success: false, error: "Failed to parse Perplexity JSON" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: String(error?.message || error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
