import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Competitor {
  name: string
  rating: number | null
  reviewCount: number | null
  website: string | null
  placeId: string | null
}

interface CompetitorAnalysis {
  businessName: string
  industry: string
  location: string
  competitors: Competitor[]
  marketPosition: string
  opportunities: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessName, industry, address, latitude, longitude } = await req.json()

    if (!businessName || !industry) {
      throw new Error('Business name and industry are required')
    }

    console.log(`Analyzing competitors for: ${businessName} in ${industry}`)

    // Get Google Maps API key
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleMapsApiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured - Competitor analysis unavailable')
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            businessName,
            industry,
            location: address || 'Unknown',
            competitors: [],
            marketPosition: 'N/A',
            opportunities: []
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Step 1: Get business coordinates if not provided
    let businessLat = latitude
    let businessLng = longitude

    if (!businessLat || !businessLng) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address || businessName)}&key=${googleMapsApiKey}`
        const geocodeResponse = await fetch(geocodeUrl, {
          signal: AbortSignal.timeout(10000)
        })

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json()
          if (geocodeData.results && geocodeData.results[0]) {
            const location = geocodeData.results[0].geometry.location
            businessLat = location.lat
            businessLng = location.lng
          }
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError)
      }
    }

    const competitors: Competitor[] = []

    // Step 2: Search for nearby competitors
    if (businessLat && businessLng) {
      try {
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(industry)}&location=${businessLat},${businessLng}&radius=5000&type=establishment&fields=place_id,name,rating,user_ratings_total,website&key=${googleMapsApiKey}`

        console.log('Searching for nearby competitors...')
        const nearbyResponse = await fetch(nearbyUrl, {
          signal: AbortSignal.timeout(10000)
        })

        if (nearbyResponse.ok) {
          const nearbyData = await nearbyResponse.json()

          if (nearbyData.results && Array.isArray(nearbyData.results)) {
            // Get top 3 competitors (excluding self if name matches)
            let count = 0
            for (const result of nearbyData.results) {
              if (count >= 3) break

              // Skip if it's the same business
              if (result.name.toLowerCase() === businessName.toLowerCase()) {
                continue
              }

              competitors.push({
                name: result.name,
                rating: result.rating || null,
                reviewCount: result.user_ratings_total || null,
                website: result.website || null,
                placeId: result.place_id
              })

              count++
            }
          }
        }
      } catch (nearbyError) {
        console.warn('Nearby search failed:', nearbyError)
      }
    }

    // Step 3: Analyze market position
    let marketPosition = 'Unable to analyze'
    const opportunities: string[] = []

    if (competitors.length > 0) {
      const avgCompetitorRating = competitors.reduce((sum, c) => sum + (c.rating || 0), 0) / competitors.length
      const avgCompetitorReviews = competitors.reduce((sum, c) => sum + (c.reviewCount || 0), 0) / competitors.length

      // This would be combined with the business's own metrics in the main analysis function
      marketPosition = `Found ${competitors.length} competitors in the area`

      if (competitors.some(c => !c.rating)) {
        opportunities.push('Opportunity: Some competitors lack Google reviews - establish strong review presence')
      }

      if (competitors.some(c => (c.rating || 0) < 4)) {
        opportunities.push('Opportunity: Some competitors have low ratings - focus on customer satisfaction and reviews')
      }

      opportunities.push('Strategy: Monitor competitor pricing and services')
      opportunities.push('Strategy: Differentiate with unique value proposition')
    } else {
      opportunities.push('Limited competitor data available')
      opportunities.push('Focus on building strong online presence and reviews')
    }

    const result: CompetitorAnalysis = {
      businessName,
      industry,
      location: address || 'Unknown',
      competitors,
      marketPosition,
      opportunities
    }

    console.log('✅ Competitor analysis completed:', result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Competitor analysis error:', error)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          businessName: 'Unknown',
          industry: 'Unknown',
          location: 'Unknown',
          competitors: [],
          marketPosition: 'N/A',
          opportunities: []
        },
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})
