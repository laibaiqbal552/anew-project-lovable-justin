import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessId, reportId } = await req.json()
    console.log(`Test analysis for business: ${businessId}, report: ${reportId}`)

    // Simple mock response
    const mockResults = {
      overall_score: 75,
      website_score: 80,
      social_score: 65,
      reputation_score: 85,
      visibility_score: 70,
      consistency_score: 75,
      positioning_score: 80,
      analysis_completed: true
    }

    return new Response(
      JSON.stringify({ success: true, results: mockResults }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Test analysis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})