import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ComprehensiveBrandAnalysisRequest {
  businessName: string
  websiteUrl?: string
  address?: string
  phoneNumber?: string
  industry?: string
  latitude?: number
  longitude?: number
  socialProfiles?: any[]
  reportId?: string
}

interface BrandAnalysisResult {
  googleReviews: any
  trustpilotReviews: any
  competitors: any
  socialMedia: any
  combinedReputation: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: ComprehensiveBrandAnalysisRequest = await req.json()
    const {
      businessName,
      websiteUrl,
      address,
      phoneNumber,
      industry,
      latitude,
      longitude,
      socialProfiles,
      reportId
    } = requestData

    if (!businessName) {
      throw new Error('Business name is required')
    }

    console.log(`Starting comprehensive brand analysis for: ${businessName}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE')

    // Fetch all data in parallel
    const [googleReviews, trustpilotReviews, competitors, socialMediaMetrics] = await Promise.all([
      fetchGoogleReviews(businessName, address, websiteUrl, supabaseUrl, supabaseServiceRole),
      fetchTrustpilotReviews(businessName, websiteUrl, supabaseUrl, supabaseServiceRole),
      fetchCompetitors(businessName, industry, address, latitude, longitude, supabaseUrl, supabaseServiceRole),
      fetchSocialMediaMetrics(socialProfiles, supabaseUrl, supabaseServiceRole)
    ])

    // Combine and analyze reputation from multiple sources
    const combinedReputation = combineReputationData(googleReviews, trustpilotReviews)

    const result: BrandAnalysisResult = {
      googleReviews,
      trustpilotReviews,
      competitors,
      socialMedia: socialMediaMetrics,
      combinedReputation
    }

    console.log('✅ Comprehensive brand analysis completed')

    // Update database if reportId provided
    if (reportId && supabaseUrl && supabaseServiceRole) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRole)

        const { error } = await supabase
          .from('brand_reports')
          .update({
            analysis_data: {
              googleReviews,
              trustpilotReviews,
              competitors,
              socialMedia: socialMediaMetrics,
              combinedReputation
            },
            last_updated: new Date().toISOString()
          })
          .eq('id', reportId)

        if (error) {
          console.warn('Failed to update report:', error)
        }
      } catch (dbError) {
        console.warn('Database update failed (non-fatal):', dbError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Comprehensive analysis error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function fetchGoogleReviews(
  businessName: string,
  address: string | undefined,
  websiteUrl: string | undefined,
  supabaseUrl: string | undefined,
  supabaseServiceRole: string | undefined
) {
  try {
    if (!supabaseUrl || !supabaseServiceRole) {
      console.warn('Supabase credentials missing for Google Reviews')
      return null
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-google-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        businessName,
        address,
        website: websiteUrl
      })
    })

    if (response.ok) {
      const result = await response.json()
      return result.data || null
    }
    return null
  } catch (error) {
    console.warn('Google Reviews fetch failed:', error)
    return null
  }
}

async function fetchTrustpilotReviews(
  businessName: string,
  domain: string | undefined,
  supabaseUrl: string | undefined,
  supabaseServiceRole: string | undefined
) {
  try {
    if (!supabaseUrl || !supabaseServiceRole) {
      console.warn('Supabase credentials missing for Trustpilot Reviews')
      return null
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-trustpilot-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        businessName,
        domain
      })
    })

    if (response.ok) {
      const result = await response.json()
      return result.data || null
    }
    return null
  } catch (error) {
    console.warn('Trustpilot Reviews fetch failed:', error)
    return null
  }
}

async function fetchCompetitors(
  businessName: string,
  industry: string | undefined,
  address: string | undefined,
  latitude: number | undefined,
  longitude: number | undefined,
  supabaseUrl: string | undefined,
  supabaseServiceRole: string | undefined
) {
  try {
    if (!supabaseUrl || !supabaseServiceRole || !industry) {
      console.warn('Missing data for competitor analysis')
      return null
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/analyze-competitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        businessName,
        industry,
        address,
        latitude,
        longitude
      })
    })

    if (response.ok) {
      const result = await response.json()
      return result.data || null
    }
    return null
  } catch (error) {
    console.warn('Competitor analysis failed:', error)
    return null
  }
}

async function fetchSocialMediaMetrics(
  socialProfiles: any[] | undefined,
  supabaseUrl: string | undefined,
  supabaseServiceRole: string | undefined
) {
  try {
    if (!supabaseUrl || !supabaseServiceRole || !socialProfiles) {
      console.warn('Missing social profiles for metrics')
      return null
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/fetch-social-media-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        socialProfiles
      })
    })

    if (response.ok) {
      const result = await response.json()
      return result.data || null
    }
    return null
  } catch (error) {
    console.warn('Social media metrics fetch failed:', error)
    return null
  }
}

function combineReputationData(googleReviews: any, trustpilotReviews: any) {
  const ratings = []
  const reviewCounts = []

  if (googleReviews && googleReviews.rating !== null) {
    ratings.push(googleReviews.rating)
    if (googleReviews.totalReviews) {
      reviewCounts.push(googleReviews.totalReviews)
    }
  }

  if (trustpilotReviews && trustpilotReviews.rating !== null) {
    ratings.push(trustpilotReviews.rating)
    if (trustpilotReviews.totalReviews) {
      reviewCounts.push(trustpilotReviews.totalReviews)
    }
  }

  const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null
  const totalReviews = reviewCounts.reduce((a, b) => a + b, 0)

  const reviews = []
  if (googleReviews && googleReviews.reviews) {
    reviews.push(...googleReviews.reviews.map((r: any) => ({
      ...r,
      source: 'Google'
    })))
  }
  if (trustpilotReviews && trustpilotReviews.reviews) {
    reviews.push(...trustpilotReviews.reviews.map((r: any) => ({
      ...r,
      source: 'Trustpilot'
    })))
  }

  return {
    average_rating: averageRating ? Math.round(averageRating * 10) / 10 : null,
    total_reviews: totalReviews,
    review_sources: [
      ...(googleReviews && googleReviews.rating !== null ? ['Google'] : []),
      ...(trustpilotReviews && trustpilotReviews.rating !== null ? ['Trustpilot'] : [])
    ],
    sentiment_score: averageRating ? Math.round((averageRating / 5) * 100) : null,
    response_rate: 0,
    recent_reviews: reviews.slice(0, 5),
    reputation_trends: {
      trend_direction: 'N/A',
      monthly_review_growth: null,
      sentiment_trend: 'N/A',
      response_time_avg: 'N/A'
    },
    review_breakdown: {
      google: googleReviews,
      trustpilot: trustpilotReviews
    }
  }
}
