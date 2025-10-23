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
            businessName: businessName || domain,
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

    // Method 1: Search Trustpilot for business using domain
    let trustpilotUrl = null
    if (domain) {
      try {
        // Search Trustpilot API for company
        const searchUrl = `https://api.trustpilot.com/v1/business-units/find?url=${encodeURIComponent(domain)}`
        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json'
          }
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.id) {
            trustpilotUrl = `https://www.trustpilot.com/review/${domain}`
          }
        }
      } catch (error) {
        console.warn('Trustpilot search failed:', error)
      }
    }

    // Fallback: construct URL from business name
    if (!trustpilotUrl && businessName) {
      const slug = businessName.toLowerCase().replace(/\s+/g, '-')
      trustpilotUrl = `https://www.trustpilot.com/review/${slug}`
    }

    if (!trustpilotUrl) {
      throw new Error('Could not construct Trustpilot URL')
    }

    console.log(`Scraping Trustpilot URL: ${trustpilotUrl}`)

    // Scrape Trustpilot using ScrapAPI
    const scrapUrl = `https://api.scrapapi.com/scrapers/trustpilot?api_key=${scrapApiKey}&url=${encodeURIComponent(trustpilotUrl)}`
    const scrapResponse = await fetch(scrapUrl, {
      signal: AbortSignal.timeout(30000)
    })

    if (!scrapResponse.ok) {
      console.warn(`ScrapAPI error: ${scrapResponse.status}`)
      throw new Error('Failed to scrape Trustpilot')
    }

    const scrapedData = await scrapResponse.json()

    // Extract rating and review count
    const rating = scrapedData.rating || null
    const totalReviews = scrapedData.reviewCount || scrapedData.totalReviews || null
    const reviews: TrustpilotReview[] = []

    // Extract top 3 reviews
    if (scrapedData.reviews && Array.isArray(scrapedData.reviews)) {
      scrapedData.reviews.slice(0, 3).forEach((review: any) => {
        reviews.push({
          title: review.title || review.summary || 'Review',
          rating: review.rating || 0,
          date: review.date || new Date().toISOString()
        })
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
