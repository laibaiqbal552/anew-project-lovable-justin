import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { googleReviewsSchema, validateInput } from '../_shared/validation.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace('www.', '').toLowerCase()
  } catch {
    return url.replace('www.', '').toLowerCase()
  }
}

// Helper function to calculate name similarity (simple Levenshtein-based)
function calculateNameSimilarity(name1: string, name2: string): number {
  const s1 = name1.toLowerCase().trim()
  const s2 = name2.toLowerCase().trim()

  // Exact match
  if (s1 === s2) return 1.0

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8

  // Simple word overlap check
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  const commonWords = words1.filter(w => words2.includes(w))

  if (commonWords.length === 0) return 0

  // Calculate overlap ratio
  const overlapRatio = (commonWords.length * 2) / (words1.length + words2.length)
  return overlapRatio
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

    // Method 2: If no results, try Text Search API (more flexible than FindPlace)
    if (!placeId) {
      console.log(`⚠️ FindPlace returned no results, trying Text Search...`)

      const textSearchQuery = address ? `${businessName} ${address}` : businessName
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textSearchQuery)}&key=${googleMapsApiKey}`

      const textSearchResponse = await fetch(textSearchUrl, {
        signal: AbortSignal.timeout(10000)
      })
      const textSearchData = await textSearchResponse.json()

      if (textSearchData.status === 'OK' && textSearchData.results && textSearchData.results.length > 0) {
        // Try to find best match by name similarity and website verification
        let bestMatch = null

        for (const result of textSearchData.results) {
          const nameMatch = calculateNameSimilarity(businessName, result.name)
          console.log(`   Checking: ${result.name} (similarity: ${nameMatch})`)

          // If we have a website to verify against, use it
          if (website && result.website) {
            const websiteDomain = extractDomain(website)
            const resultDomain = extractDomain(result.website)
            if (websiteDomain === resultDomain) {
              console.log(`   ✅ Website match found: ${result.name}`)
              bestMatch = result
              break
            }
          }

          // Otherwise use name similarity (require at least 60% match)
          if (nameMatch > 0.6 && (!bestMatch || nameMatch > calculateNameSimilarity(businessName, bestMatch.name))) {
            bestMatch = result
          }
        }

        if (bestMatch) {
          console.log(`✅ Found via Text Search: ${bestMatch.name}`)
          place = bestMatch
          placeId = bestMatch.place_id
        } else {
          console.log(`⚠️ No good matches found in Text Search results`)
        }
      }
    }

    // Method 3: Last resort - try just the business name without address
    if (!placeId && address) {
      console.log(`⚠️ Still no results, trying business name only...`)

      const nameOnlyUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(businessName)}&inputtype=textquery&fields=place_id,name,formatted_address,website,formatted_phone_number,rating,user_ratings_total&key=${googleMapsApiKey}`

      const nameOnlyResponse = await fetch(nameOnlyUrl, {
        signal: AbortSignal.timeout(10000)
      })
      const nameOnlyData = await nameOnlyResponse.json()

      if (nameOnlyData.status === 'OK' && nameOnlyData.candidates && nameOnlyData.candidates.length > 0) {
        // Verify with website if available
        if (website) {
          const websiteDomain = extractDomain(website)
          const match = nameOnlyData.candidates.find((c: any) =>
            c.website && extractDomain(c.website) === websiteDomain
          )

          if (match) {
            console.log(`✅ Found via name-only search with website verification: ${match.name}`)
            place = match
            placeId = match.place_id
          }
        } else {
          // No website to verify, use first result
          place = nameOnlyData.candidates[0]
          placeId = place.place_id
          console.log(`✅ Found via name-only search: ${place.name}`)
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
