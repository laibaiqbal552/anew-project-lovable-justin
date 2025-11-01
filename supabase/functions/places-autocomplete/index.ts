import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
}

interface AutocompleteRequest {
  input: string
}

interface AutocompletePrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface AutocompleteResponse {
  success: boolean
  predictions: AutocompletePrediction[]
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    const { input }: AutocompleteRequest = await req.json()

    if (!input || input.trim().length < 3) {
      return new Response(
        JSON.stringify({
          success: true,
          predictions: []
        } as AutocompleteResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`🔍 Places Autocomplete request: "${input}"`)

    // Get Google Maps API key from environment
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!googleMapsApiKey) {
      console.error('❌ GOOGLE_MAPS_API_KEY not configured')
      return new Response(
        JSON.stringify({
          success: false,
          predictions: [],
          error: 'Google Maps API key not configured'
        } as AutocompleteResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    // Call Google Places Autocomplete API
    const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${googleMapsApiKey}`

    const response = await fetch(autocompleteUrl, {
      signal: AbortSignal.timeout(5000)
    })

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'OK' && data.predictions) {
      console.log(`✅ Found ${data.predictions.length} autocomplete suggestions`)

      return new Response(
        JSON.stringify({
          success: true,
          predictions: data.predictions.map((p: any) => ({
            description: p.description,
            place_id: p.place_id,
            structured_formatting: {
              main_text: p.structured_formatting?.main_text || p.description,
              secondary_text: p.structured_formatting?.secondary_text || ''
            }
          }))
        } as AutocompleteResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else if (data.status === 'ZERO_RESULTS') {
      console.log('⚠️ No autocomplete results found')
      return new Response(
        JSON.stringify({
          success: true,
          predictions: []
        } as AutocompleteResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    } else {
      console.error(`❌ Google Places API error: ${data.status}`)
      if (data.error_message) {
        console.error(`   Error message: ${data.error_message}`)
      }

      return new Response(
        JSON.stringify({
          success: false,
          predictions: [],
          error: data.error_message || data.status
        } as AutocompleteResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

  } catch (error: any) {
    console.error('Places Autocomplete error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        predictions: [],
        error: error.message || 'Unknown error occurred'
      } as AutocompleteResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
