import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Review {
  author: string
  rating: number
  text: string
  time: string
  timeRelative?: string
  profilePhotoUrl?: string
}

interface CompetitorReviewData {
  businessName: string
  placeId: string
  rating: number | null
  reviewCount: number
  reviews: Review[]
}

interface CompetitorReviewsResponse {
  success: boolean
  competitorsReviews: CompetitorReviewData[]
  error?: string
}

interface GooglePlaceDetailsResult {
  result?: {
    name: string
    rating?: number
    user_ratings_total?: number
    reviews?: Array<{
      author_name: string
      rating: number
      text: string
      time: number
      relative_time_description: string
      profile_photo_url?: string
    }>
  }
  status: string
  error_message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { placeId, placeIds } = body

    if (!placeId && !placeIds) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'placeId or placeIds array is required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          competitorsReviews: [],
          error: 'Google Maps API key not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Normalize input - handle both single placeId and array of placeIds
    const placeIdsToFetch: string[] = []
    if (placeId && typeof placeId === 'string') {
      placeIdsToFetch.push(placeId)
    } else if (Array.isArray(placeIds)) {
      placeIdsToFetch.push(...placeIds)
    }

    if (placeIdsToFetch.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No valid place IDs provided'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch details for each place ID in parallel
    const reviewPromises = placeIdsToFetch.map(async (id) => {
      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${id}&fields=name,rating,user_ratings_total,reviews&key=${googleMapsApiKey}`

        const response = await fetch(detailsUrl, {
          signal: AbortSignal.timeout(8000)
        })

        const data: GooglePlaceDetailsResult = await response.json()

        if (data.status !== 'OK' || !data.result) {
          console.error(`Place details fetch failed for ${id}:`, data.error_message || data.status)
          return null
        }

        const result = data.result

        // Convert review timestamps to readable format
        const reviews: Review[] = (result.reviews || []).map((review) => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
          time: new Date(review.time * 1000).toISOString(),
          timeRelative: review.relative_time_description,
          profilePhotoUrl: review.profile_photo_url,
        }))

        return {
          businessName: result.name,
          placeId: id,
          rating: result.rating ?? null,
          reviewCount: result.user_ratings_total ?? 0,
          reviews: reviews.slice(0, 5), // Return top 5 reviews per business
        } as CompetitorReviewData
      } catch (error) {
        console.error(`Error fetching reviews for place ${id}:`, error)
        return null
      }
    })

    const results = await Promise.all(reviewPromises)
    const competitorsReviews = results.filter((r) => r !== null) as CompetitorReviewData[]

    return new Response(
      JSON.stringify({
        success: true,
        competitorsReviews,
      } as CompetitorReviewsResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in fetch-competitor-reviews:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
