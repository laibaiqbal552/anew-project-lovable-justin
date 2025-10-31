import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { googleReviewsSchema, validateInput } from '../_shared/validation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GoogleReview {
  author: string
  rating: number
  text: string
  time: string
}

interface GoogleReviewsData {
  businessName: string
  rating: number | null
  totalReviews: number | null
  reviews: GoogleReview[]
  placeId: string | null
  address: string | null
  website: string | null
  phoneNumber: string | null
  source: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawData = await req.json()
    
    // Validate input
    const validation = validateInput(googleReviewsSchema, rawData)
    if (!validation.success) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid input: ${validation.error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { businessName, address, website } = validation.data
    console.log(`Fetching Google Reviews for: ${businessName}`)

    // Get Google Maps API key from environment
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleMapsApiKey) {
      console.warn('GOOGLE_MAPS_API_KEY not configured - Google Reviews unavailable')
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            businessName,
            rating: null,
            totalReviews: null,
            reviews: [],
            placeId: null,
            address: null,
            website: null,
            phoneNumber: null,
            source: 'N/A'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Step 1: Find place using business name and address
    // First try: search with business name + address
    let place = null
    let placeId = null

    // Method 1: Try FindPlace with combined query
    const searchQuery = address ? `${businessName} ${address}` : businessName
    console.log(`🔎 FindPlace: Searching for "${searchQuery}"`)

    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address,website,formatted_phone_number,rating,user_ratings_total&key=${googleMapsApiKey}`

    let findPlaceResponse = await fetch(findPlaceUrl, {
      signal: AbortSignal.timeout(10000)
    })

    if (!findPlaceResponse.ok) {
      throw new Error(`Google Maps API error: ${findPlaceResponse.status}`)
    }

    let findPlaceData = await findPlaceResponse.json()

    console.log(`🔎 FindPlace Response Status: ${findPlaceData.status}`)
    console.log(`🔎 FindPlace Candidates: ${findPlaceData.candidates?.length || 0}`)
    if (findPlaceData.error_message) {
      console.error(`🔎 FindPlace Error: ${findPlaceData.error_message}`)
    }
    if (findPlaceData.candidates && findPlaceData.candidates.length > 0) {
      console.log(`🔎 First candidate: ${findPlaceData.candidates[0].name}`)
      place = findPlaceData.candidates[0]
      placeId = place.place_id
    }

    // Method 2: If no results, try searching with just the address (for Nearby Search)
    if (!placeId && address) {
      console.log(`⚠️ FindPlace returned no results, trying Nearby Search with address...`)

      // Geocode the address first
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`
      const geocodeResponse = await fetch(geocodeUrl, {
        signal: AbortSignal.timeout(8000)
      })
      const geocodeData = await geocodeResponse.json()

      if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
        const lat = geocodeData.results[0].geometry.location.lat
        const lng = geocodeData.results[0].geometry.location.lng

        // Now search nearby businesses
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=100&type=point_of_interest&key=${googleMapsApiKey}`
        const nearbyResponse = await fetch(nearbyUrl, {
          signal: AbortSignal.timeout(8000)
        })
        const nearbyData = await nearbyResponse.json()

        if (nearbyData.status === 'OK' && nearbyData.results && nearbyData.results.length > 0) {
          // Find the business that matches by name (best match)
          const bestMatch = nearbyData.results.find((p: any) =>
            p.name.toLowerCase().includes(businessName.toLowerCase().split(/\s+/)[0])
          ) || nearbyData.results[0]

          console.log(`✅ Found via Nearby Search: ${bestMatch.name}`)
          place = bestMatch
          placeId = bestMatch.place_id
        }
      }
    }

    if (!placeId || !place) {
      console.warn(`❌ No Google Places found for business: ${businessName}`)
      console.warn(`   Search query: "${searchQuery}"`)
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            businessName,
            rating: null,
            totalReviews: null,
            reviews: [],
            placeId: null,
            address: null,
            website: null,
            phoneNumber: null,
            source: 'N/A'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Extract place details
    const rating = place.rating || null
    const totalReviews = place.user_ratings_total || null
    const placeAddress = place.formatted_address || null
    const placeWebsite = place.website || website || null
    const phoneNumber = place.formatted_phone_number || null

    // Initialize empty reviews array - we'll fetch from Place Details API
    const reviews: GoogleReview[] = []

    // Step 2: Get more detailed info including reviews using place details API
    if (placeId) {
      try {
        // Include reviews field in the request - note: limited to 5 reviews max by Google
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,formatted_address,website,formatted_phone_number&key=${googleMapsApiKey}`

        console.log(`📍 Fetching place details for place_id: ${placeId}...`)
        const detailsResponse = await fetch(detailsUrl, {
          signal: AbortSignal.timeout(10000)
        })

        if (!detailsResponse.ok) {
          console.error(`❌ Place Details API error: ${detailsResponse.status}`)
          throw new Error(`Place Details API error: ${detailsResponse.status}`)
        }

        const detailsData = await detailsResponse.json()
        console.log(`📍 Place Details Response Status: ${detailsData.status}`)

        if (detailsData.status !== 'OK') {
          console.error(`❌ Place Details failed: ${detailsData.error_message || detailsData.status}`)
        } else if (detailsData.result) {
          const result = detailsData.result

          console.log(`✅ Found place: ${result.name}`)
          console.log(`   Rating: ${result.rating}, Total Reviews: ${result.user_ratings_total}`)

          // Update with more detailed info
          const updatedRating = result.rating || rating
          const updatedTotalReviews = result.user_ratings_total || totalReviews

          // Extract reviews - Google returns up to 5 reviews per Place Details call
          if (result.reviews && Array.isArray(result.reviews)) {
            console.log(`📖 Found ${result.reviews.length} reviews in details response`)
            result.reviews.slice(0, 5).forEach((review: any, idx: number) => {
              console.log(`   Review ${idx + 1}: "${review.author_name}" - ${review.rating}⭐`)
              reviews.push({
                author: review.author_name || 'Anonymous',
                rating: review.rating || 0,
                text: review.text || '',
                time: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString()
              })
            })
          } else {
            console.warn(`⚠️ No reviews found in Place Details response`)
          }

          const googleReviewsData: GoogleReviewsData = {
            businessName: result.name || businessName,
            rating: updatedRating,
            totalReviews: updatedTotalReviews,
            reviews,
            placeId,
            address: result.formatted_address || placeAddress,
            website: result.website || placeWebsite,
            phoneNumber: result.formatted_phone_number || phoneNumber,
            source: 'Google'
          }

          console.log('✅ Google Reviews data fetched:', googleReviewsData)
          return new Response(
            JSON.stringify({ success: true, data: googleReviewsData }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          )
        }
      } catch (detailsError) {
        console.warn('Failed to fetch place details:', detailsError)
      }
    }

    const googleReviewsData: GoogleReviewsData = {
      businessName,
      rating,
      totalReviews,
      reviews,
      placeId,
      address: placeAddress,
      website: placeWebsite,
      phoneNumber,
      source: 'Google'
    }

    console.log('✅ Google Reviews data fetched:', googleReviewsData)

    return new Response(
      JSON.stringify({ success: true, data: googleReviewsData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Google Reviews fetch error:', error)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          businessName: 'Unknown',
          rating: null,
          totalReviews: null,
          reviews: [],
          placeId: null,
          address: null,
          website: null,
          phoneNumber: null,
          source: 'N/A'
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
