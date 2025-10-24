import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Competitor {
  name: string
  address: string
  rating: number | null
  reviewCount: number
  placeId: string
  phone?: string
  website?: string
  businessType?: string
}

interface CompetitorSearchResponse {
  success: boolean
  competitors: Competitor[]
  searchedBusiness: {
    name: string
    address: string
  }
  error?: string
}

interface GooglePlacesSearchResult {
  results: Array<{
    name: string
    formatted_address: string
    rating?: number
    user_ratings_total?: number
    place_id: string
    formatted_phone_number?: string
    website?: string
    types?: string[]
  }>
  status: string
  error_message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessName, address, radius = 5000, limit = 5 } = await req.json()

    if (!businessName || !address) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'businessName and address are required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          competitors: [],
          searchedBusiness: { name: businessName, address },
          error: 'Google Maps API key not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Step 1: Geocode the business address to get coordinates
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`

    const geocodeResponse = await fetch(geocodeUrl, {
      signal: AbortSignal.timeout(8000)
    })

    const geocodeData = await geocodeResponse.json()

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('Geocoding failed:', geocodeData.error_message || geocodeData.status)
      return new Response(
        JSON.stringify({
          success: true,
          competitors: [],
          searchedBusiness: { name: businessName, address },
          error: 'Could not geocode address'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { lat, lng } = geocodeData.results[0].geometry.location

    // Step 2: Search for nearby businesses (competitors) using Nearby Search
    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(businessName)}&key=${googleMapsApiKey}`

    const nearbyResponse = await fetch(nearbySearchUrl, {
      signal: AbortSignal.timeout(8000)
    })

    const nearbyData: GooglePlacesSearchResult = await nearbyResponse.json()

    if (nearbyData.status !== 'OK') {
      console.error('Nearby search failed:', nearbyData.error_message || nearbyData.status)
      return new Response(
        JSON.stringify({
          success: true,
          competitors: [],
          searchedBusiness: { name: businessName, address },
          error: 'Failed to search for competitors'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Step 3: Filter and format competitors (exclude the original business)
    const competitors: Competitor[] = nearbyData.results
      .filter((place) => {
        // Exclude exact business name match (original business)
        return place.name.toLowerCase() !== businessName.toLowerCase()
      })
      .slice(0, limit)
      .map((place) => ({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating ?? null,
        reviewCount: place.user_ratings_total ?? 0,
        placeId: place.place_id,
        phone: place.formatted_phone_number,
        website: place.website,
        businessType: place.types?.[0]?.replace(/_/g, ' '),
      }))

    return new Response(
      JSON.stringify({
        success: true,
        competitors,
        searchedBusiness: {
          name: businessName,
          address
        }
      } as CompetitorSearchResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in fetch-competitor-search:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
