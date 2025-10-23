import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { businessName, address, website } = await req.json()

    if (!businessName) {
      throw new Error('Business name is required')
    }

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

    // Step 1: Find place using business name or website
    const searchQuery = address ? `${businessName} ${address}` : businessName
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address,website,formatted_phone_number,rating,user_ratings_total,reviews&key=${googleMapsApiKey}`

    console.log('Finding place on Google Maps...')
    const findPlaceResponse = await fetch(findPlaceUrl, {
      signal: AbortSignal.timeout(10000)
    })

    if (!findPlaceResponse.ok) {
      throw new Error(`Google Maps API error: ${findPlaceResponse.status}`)
    }

    const findPlaceData = await findPlaceResponse.json()

    if (!findPlaceData.candidates || findPlaceData.candidates.length === 0) {
      console.warn('No Google Places found for business')
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

    const place = findPlaceData.candidates[0]
    const placeId = place.place_id
    const rating = place.rating || null
    const totalReviews = place.user_ratings_total || null
    const placeAddress = place.formatted_address || null
    const placeWebsite = place.website || website || null
    const phoneNumber = place.formatted_phone_number || null

    // Extract top 2 reviews from findPlace response
    const reviews: GoogleReview[] = []
    if (place.reviews && Array.isArray(place.reviews)) {
      place.reviews.slice(0, 2).forEach((review: any) => {
        reviews.push({
          author: review.author_name || 'Anonymous',
          rating: review.rating || 0,
          text: review.text || '',
          time: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString()
        })
      })
    }

    // Step 2: Get more detailed info if needed using place details
    if (placeId && reviews.length < 2) {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,formatted_address,website,formatted_phone_number&key=${googleMapsApiKey}`

        console.log('Fetching place details...')
        const detailsResponse = await fetch(detailsUrl, {
          signal: AbortSignal.timeout(10000)
        })

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json()
          const result = detailsData.result

          if (result) {
            // Update with more detailed info
            const updatedRating = result.rating || rating
            const updatedTotalReviews = result.user_ratings_total || totalReviews

            // Get more reviews
            if (result.reviews && Array.isArray(result.reviews)) {
              result.reviews.slice(0, 2).forEach((review: any) => {
                if (reviews.length < 2) {
                  reviews.push({
                    author: review.author_name || 'Anonymous',
                    rating: review.rating || 0,
                    text: review.text || '',
                    time: review.time ? new Date(review.time * 1000).toISOString() : new Date().toISOString()
                  })
                }
              })
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
