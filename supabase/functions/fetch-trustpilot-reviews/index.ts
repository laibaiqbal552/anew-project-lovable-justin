import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TrustpilotReview {
  title: string
  rating: number
  date: string
}

interface TrustpilotData {
  businessName: string
  rating: number | null
  totalReviews: number | null
  reviews: TrustpilotReview[]
  source: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessName, domain } = await req.json()

    if (!businessName && !domain) {
      throw new Error('Business name or domain is required')
    }

    console.log(`Fetching Trustpilot reviews for: ${businessName || domain}`)

    // Get ScrapAPI key from environment
    const scrapApiKey = Deno.env.get('SCRAPAPI_KEY')
    if (!scrapApiKey) {
      console.warn('SCRAPAPI_KEY not configured - Trustpilot data unavailable')
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            businessName: businessName || domain || 'Unknown',
            rating: null,
            totalReviews: null,
            reviews: [],
            source: 'N/A'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Construct Trustpilot URLs to try
    const trustpilotUrls = []

    // Method 1: Use domain directly
    if (domain) {
      trustpilotUrls.push(`https://www.trustpilot.com/review/${domain.replace(/^(https?:\/\/)|(www\.)/, '')}`)
    }

    // Method 2: Use business name slug
    if (businessName) {
      const slug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      trustpilotUrls.push(`https://www.trustpilot.com/review/${slug}`)
    }

    let scrapedData = null
    let usedUrl = null

    // Try each URL with ScrapAPI
    for (const url of trustpilotUrls) {
      try {
        console.log(`Attempting to scrape: ${url}`)

        const scrapUrl = `https://api.scrapapi.com/scrapers/trustpilot?api_key=${scrapApiKey}&url=${encodeURIComponent(url)}`

        const scrapResponse = await fetch(scrapUrl, {
          signal: AbortSignal.timeout(25000) // 25 second timeout
        })

        if (scrapResponse.ok) {
          const data = await scrapResponse.json()

          // Check if we got valid data with at least a rating or reviews
          if (data && (data.rating || data.reviewCount || data.totalReviews || data.reviews?.length)) {
            scrapedData = data
            usedUrl = url
            console.log(`✅ Successfully scraped: ${url}`)
            break
          }
        } else {
          console.warn(`Failed to scrape ${url}: ${scrapResponse.status}`)
        }
      } catch (error) {
        console.warn(`Error scraping ${url}:`, error)
        continue
      }
    }

    // If no data found from scraping, provide empty response
    if (!scrapedData) {
      console.warn('No Trustpilot data found after trying all URLs')
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            businessName: businessName || domain || 'Unknown',
            rating: null,
            totalReviews: null,
            reviews: [],
            source: 'N/A'
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Extract rating and review count
    let rating = scrapedData.rating || scrapedData.score || null
    let totalReviews = scrapedData.reviewCount || scrapedData.totalReviews || scrapedData.total_reviews || null

    // Parse rating as number if it's a string
    if (typeof rating === 'string') {
      rating = parseFloat(rating) || null
    }

    // Parse total reviews as number if it's a string
    if (typeof totalReviews === 'string') {
      totalReviews = parseInt(totalReviews, 10) || null
    }

    const reviews: TrustpilotReview[] = []

    // Extract top 5 reviews (or fewer if not available)
    if (scrapedData.reviews && Array.isArray(scrapedData.reviews)) {
      scrapedData.reviews.slice(0, 5).forEach((review: any) => {
        if (review && review.title) {
          reviews.push({
            title: review.title || review.summary || 'Review',
            rating: parseInt(review.rating, 10) || 0,
            date: review.date || new Date().toISOString()
          })
        }
      })
    }

    const result: TrustpilotData = {
      businessName: businessName || domain || 'Unknown',
      rating,
      totalReviews,
      reviews,
      source: 'Trustpilot'
    }

    console.log(`✅ Trustpilot data fetched:`, result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Trustpilot fetch error:', error)
    // Return graceful error response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          businessName: 'Unknown',
          rating: null,
          totalReviews: null,
          reviews: [],
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
