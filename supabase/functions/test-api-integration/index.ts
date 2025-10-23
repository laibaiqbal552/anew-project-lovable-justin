import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface APIStatus {
  name: string
  configured: boolean
  key: string
  status: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiStatuses: APIStatus[] = []

    // Check Google Maps API
    const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    apiStatuses.push({
      name: 'Google Maps API',
      configured: !!googleMapsKey,
      key: googleMapsKey ? `${googleMapsKey.substring(0, 10)}...` : 'NOT SET',
      status: googleMapsKey ? 'Configured ✅' : 'Missing ❌'
    })

    // Check ScrapAPI Key
    const scrapApiKey = Deno.env.get('SCRAPAPI_KEY')
    apiStatuses.push({
      name: 'ScrapAPI (Trustpilot)',
      configured: !!scrapApiKey,
      key: scrapApiKey ? `${scrapApiKey.substring(0, 10)}...` : 'NOT SET',
      status: scrapApiKey ? 'Configured ✅' : 'Missing ❌'
    })

    // Check Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE')
    apiStatuses.push({
      name: 'Supabase URL',
      configured: !!supabaseUrl,
      key: supabaseUrl ? supabaseUrl : 'NOT SET',
      status: supabaseUrl ? 'Configured ✅' : 'Missing ❌'
    })

    apiStatuses.push({
      name: 'Supabase Service Role',
      configured: !!supabaseKey,
      key: supabaseKey ? `${supabaseKey.substring(0, 10)}...` : 'NOT SET',
      status: supabaseKey ? 'Configured ✅' : 'Missing ❌'
    })

    // Check PageSpeed API
    const pageSpeedKey = Deno.env.get('PAGESPEED_API_KEY')
    apiStatuses.push({
      name: 'PageSpeed API',
      configured: !!pageSpeedKey,
      key: pageSpeedKey ? `${pageSpeedKey.substring(0, 10)}...` : 'NOT SET',
      status: pageSpeedKey ? 'Configured ✅' : 'Missing ❌'
    })

    // Check SEMrush API
    const semrushKey = Deno.env.get('SEMRUSH_API_KEY')
    apiStatuses.push({
      name: 'SEMrush API',
      configured: !!semrushKey,
      key: semrushKey ? `${semrushKey.substring(0, 10)}...` : 'NOT SET',
      status: semrushKey ? 'Configured ✅' : 'Missing ❌'
    })

    // Test Google Maps API connectivity
    let googleMapsTest = { success: false, error: 'Not tested' }
    if (googleMapsKey) {
      try {
        const testUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=pizza&inputtype=textquery&fields=place_id,name&key=${googleMapsKey}`
        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          const data = await response.json()
          googleMapsTest = {
            success: true,
            error: data.candidates?.length > 0 ? `Found ${data.candidates.length} places` : 'No results'
          }
        } else {
          googleMapsTest = {
            success: false,
            error: `HTTP ${response.status}`
          }
        }
      } catch (error) {
        googleMapsTest = {
          success: false,
          error: String(error)
        }
      }
    }

    // Test ScrapAPI connectivity
    let scrapApiTest = { success: false, error: 'Not tested' }
    if (scrapApiKey) {
      try {
        const testUrl = `https://api.scrapapi.com/scrapers/trustpilot?api_key=${scrapApiKey}&url=https://www.trustpilot.com/review/google.com`
        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000)
        })
        if (response.ok) {
          scrapApiTest = {
            success: true,
            error: 'API is accessible'
          }
        } else {
          scrapApiTest = {
            success: false,
            error: `HTTP ${response.status}`
          }
        }
      } catch (error) {
        scrapApiTest = {
          success: false,
          error: String(error)
        }
      }
    }

    const result = {
      timestamp: new Date().toISOString(),
      allConfigured: apiStatuses.every(s => s.configured),
      apiStatuses,
      connectivity: {
        googleMaps: googleMapsTest,
        scrapApi: scrapApiTest
      },
      summary: apiStatuses.filter(s => !s.configured).length === 0
        ? '✅ All APIs configured and ready!'
        : `❌ ${apiStatuses.filter(s => !s.configured).length} API(s) missing configuration`
    }

    return new Response(
      JSON.stringify(result, null, 2),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Test error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
