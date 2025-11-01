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

    console.log(`📥 FETCH-COMPETITOR-SEARCH CALLED`)
    console.log(`   businessName: "${businessName}"`)
    console.log(`   address: "${address}"`)
    console.log(`   industry: "${industry}"`)
    console.log(`   radius: ${radius}`)
    console.log(`   limit: ${limit}`)

    if (!businessName || !address) {
      console.error(`❌ MISSING REQUIRED PARAMS: businessName="${businessName}", address="${address}"`)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'businessName and address are required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    console.log(`   API Key available: ${googleMapsApiKey ? '✅ YES' : '❌ NO'}`)
    if (googleMapsApiKey) {
      console.log(`   API Key (first 30 chars): ${googleMapsApiKey.substring(0, 30)}...`)
      console.log(`   API Key length: ${googleMapsApiKey.length}`)
    }

    if (!googleMapsApiKey) {
      console.error(`❌ GOOGLE_MAPS_API_KEY not configured in Supabase secrets`)
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
    const searchKeyword = industry ? `${industry}` : businessName
    console.log(`🔍 Searching for: "${searchKeyword}" at coordinates ${lat}, ${lng} with radius ${radius}m`)
    console.log(`🔍 Full Search params: industry=${industry}, businessName=${businessName}, keyword="${searchKeyword}"`)

    const nearbySearchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(searchKeyword)}&key=${googleMapsApiKey}`
    console.log(`🌐 Nearby Search URL: ${nearbySearchUrl.substring(0, 150)}...`)

    const nearbyResponse = await fetch(nearbySearchUrl, {
      signal: AbortSignal.timeout(8000)
    })

    const nearbyData: GooglePlacesSearchResult = await nearbyResponse.json()

    console.log(`📡 Nearby search response status: ${nearbyData.status}`)
    console.log(`📡 Nearby search response - full status: ${JSON.stringify(nearbyData).substring(0, 300)}`)
    if (nearbyData.results) {
      console.log(`📊 Found ${nearbyData.results.length} results from Nearby Search`)
    }
    if (nearbyData.error_message) {
      console.error(`📊 Error message: ${nearbyData.error_message}`)
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
    } else {
      console.error(`❌ CRITICAL: Nearby Search returned 0 results!`)
      console.error(`   Geocoded address: ${geocodeData.results[0].formatted_address}`)
      console.error(`   Search coordinates: ${lat}, ${lng}`)
      console.error(`   Search radius: ${radius}m`)
      console.error(`   Search keyword: "${searchKeyword}"`)
      console.error(`   Industry: "${industry}", Business name: "${businessName}"`)
    }

    // Step 3: Filter out the main business and format competitors
    // Filter logic: Exclude businesses that match the main business name or address
    const competitors: Competitor[] = nearbyData.results
      .filter((place) => {
        // Normalize names for comparison
        const placeName = place.name.toLowerCase().trim()
        const mainBusinessName = businessName.toLowerCase().trim()

        // Check if names are too similar (exact match or high overlap)
        const isNameMatch = placeName === mainBusinessName ||
                           placeName.includes(mainBusinessName) ||
                           mainBusinessName.includes(placeName)

        // Check if addresses match (normalize for comparison)
        const placeAddress = place.formatted_address?.toLowerCase().replace(/\s+/g, ' ') || ''
        const mainAddress = address.toLowerCase().replace(/\s+/g, ' ')
        const isAddressMatch = placeAddress.includes(mainAddress) || mainAddress.includes(placeAddress)

        // Exclude if both name and address match
        if (isNameMatch && isAddressMatch) {
          console.log(`🚫 Excluding main business from competitors: ${place.name}`)
          return false
        }

        return true
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

    console.log(`✅ Formatted ${competitors.length} competitors from ${nearbyData.results.length} total results`)
    if (competitors.length > 0) {
      console.log(`🏆 Top competitor: ${competitors[0].name} (${competitors[0].reviewCount} reviews, rating: ${competitors[0].rating})`)
    } else {
      console.log(`⚠️ No competitors found after filtering`)
      console.log(`   Total results: ${nearbyData.results.length}`)
      console.log(`   Business name to filter: "${businessName}"`)
      if (nearbyData.results.length > 0) {
        console.log(`   First result: "${nearbyData.results[0]?.name || 'N/A'}"`)
      }
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
