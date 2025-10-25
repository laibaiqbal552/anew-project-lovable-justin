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
    const { businessName, address, industry, radius = 5000, limit = 15 } = await req.json()

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
    console.log(`🗺️ Geocoding address: "${address}"`)
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
    console.log(`🔗 Geocode URL: ${geocodeUrl.substring(0, 100)}...`)

    const geocodeResponse = await fetch(geocodeUrl, {
      signal: AbortSignal.timeout(8000)
    })

    const geocodeData = await geocodeResponse.json()

    console.log(`📍 Geocoding response status: ${geocodeData.status}`)
    console.log(`📊 Geocoding error_message: ${geocodeData.error_message || 'none'}`)
    console.log(`📊 Geocoding results count: ${geocodeData.results?.length || 0}`)

    if (geocodeData.results && geocodeData.results.length > 0) {
      console.log(`📍 Geocoded coordinates: ${geocodeData.results[0].geometry.location.lat}, ${geocodeData.results[0].geometry.location.lng}`)
      console.log(`📍 Formatted address (from geocode): ${geocodeData.results[0].formatted_address}`)
    }

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('❌ Geocoding failed:', geocodeData.error_message || geocodeData.status)
      console.error(`❌ Full geocoding response:`, JSON.stringify(geocodeData).substring(0, 500))
      return new Response(
        JSON.stringify({
          success: true,
          competitors: [],
          searchedBusiness: { name: businessName, address },
          error: `Could not geocode address: ${geocodeData.error_message || geocodeData.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const { lat, lng } = geocodeData.results[0].geometry.location

    // Step 2: Search for nearby businesses (competitors) using Nearby Search
    // Use industry keyword if available for more targeted results
    const searchKeyword = industry ? `${industry} ${businessName}` : businessName
    console.log(`🔍 Searching for: "${searchKeyword}" at coordinates ${lat}, ${lng} with radius ${radius}m`)
    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(searchKeyword)}&key=${googleMapsApiKey}`

    const nearbyResponse = await fetch(nearbySearchUrl, {
      signal: AbortSignal.timeout(8000)
    })

    const nearbyData: GooglePlacesSearchResult = await nearbyResponse.json()

    console.log(`📡 Nearby search response status: ${nearbyData.status}`)
    if (nearbyData.results) {
      console.log(`📊 Found ${nearbyData.results.length} results from Nearby Search`)
    }

    if (nearbyData.status !== 'OK') {
      console.error('❌ Nearby search failed:', nearbyData.error_message || nearbyData.status)
      return new Response(
        JSON.stringify({
          success: true,
          competitors: [],
          searchedBusiness: { name: businessName, address },
          error: `Nearby search failed: ${nearbyData.error_message || nearbyData.status}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Log the raw results before filtering
    console.log(`📋 Raw results from Google Maps: ${nearbyData.results.length} total places`)
    if (nearbyData.results.length > 0) {
      console.log(`📝 First 3 results:`)
      nearbyData.results.slice(0, 3).forEach((place, idx) => {
        console.log(`   ${idx + 1}. ${place.name} - Rating: ${place.rating}, Reviews: ${place.user_ratings_total}`)
      })
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

    console.log(`✅ Filtered to ${competitors.length} competitors (after excluding original business)`)
    if (competitors.length > 0) {
      console.log(`🏆 Top competitor: ${competitors[0].name} (${competitors[0].reviewCount} reviews, rating: ${competitors[0].rating})`)
    } else {
      console.log(`⚠️ No competitors found after filtering`)
      console.log(`   Total results: ${nearbyData.results.length}`)
      console.log(`   Business name to filter: "${businessName}"`)
      console.log(`   First result: "${nearbyData.results[0]?.name || 'N/A'}"`)
    }

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
