import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { comprehensiveBrandAnalysisSchema, validateInput } from '../_shared/validation.ts'

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

// Function to sanitize address - remove special characters and normalize
function sanitizeAddress(address: string): string {
  if (!address) return address

  let cleaned = address

  // Remove Arabic/Urdu/Persian characters (non-Latin scripts)
  // This regex removes characters from Arabic, Persian, Urdu blocks
  cleaned = cleaned.replace(/[\u0600-\u06FF]/g, '')

  // Replace Arabic comma (،) with regular comma (already covered above but keeping for safety)
  cleaned = cleaned.replace(/،/g, ',')

  // Remove extra spaces (including multiple spaces)
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // Remove leading/trailing commas and spaces
  cleaned = cleaned.replace(/^[\s,]+|[\s,]+$/g, '').trim()

  // Remove duplicate commas
  cleaned = cleaned.replace(/,+/g, ',')

  // Remove space before comma
  cleaned = cleaned.replace(/\s+,/g, ',')

  // Remove trailing comma if present
  cleaned = cleaned.replace(/,\s*$/, '').trim()

  console.log(`🧹 Address sanitization:`)
  console.log(`   Before: "${address}"`)
  console.log(`   After: "${cleaned}"`)

  return cleaned
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const rawData = await req.json()
    
    // Validate input
    const validation = validateInput(comprehensiveBrandAnalysisSchema, rawData)
    if (!validation.success) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid input: ${validation.error}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

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
    } = validation.data

    console.log(`Starting comprehensive brand analysis for: ${businessName}`)

    // Sanitize address if provided
    const sanitizedAddress = address ? sanitizeAddress(address) : address

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔐 ENVIRONMENT VARIABLES CHECK:')
    console.log('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ NOT SET')
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRole ? '✅ Set' : '❌ NOT SET')

    // Fetch all data in parallel
    const [googleReviews, trustpilotReviews, competitors, socialMediaMetrics] = await Promise.all([
      fetchGoogleReviews(businessName, sanitizedAddress, websiteUrl, supabaseUrl, supabaseServiceRole),
      fetchTrustpilotReviews(businessName, websiteUrl, supabaseUrl, supabaseServiceRole),
      fetchCompetitors(businessName, industry, sanitizedAddress, latitude, longitude, supabaseUrl, supabaseServiceRole),
      fetchSocialMediaMetrics(socialProfiles, supabaseUrl, supabaseServiceRole)
    ])

    // Log results for debugging
    console.log('📊 Analysis Results:')
    console.log('  Google Reviews:', googleReviews ? '✅ Found' : '❌ Not found')
    console.log('  Trustpilot Reviews:', trustpilotReviews ? '✅ Found' : '❌ Not found')
    console.log('  Competitors:', competitors?.competitors?.length || 0, 'found')
    console.log('  Social Metrics:', socialMediaMetrics ? '✅ Found' : '❌ Not found')

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
    console.log('📤 Returning:', JSON.stringify(result, null, 2).substring(0, 500))

    // Update database if reportId provided
    if (reportId && supabaseUrl && supabaseServiceRole) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRole)

        // Format social media data to match Dashboard expectations
        const socialData = socialMediaMetrics ? {
          detected_platforms: socialMediaMetrics.detected_platforms || [],
          total_followers: socialMediaMetrics.total_followers || 0,
          profiles: socialMediaMetrics.profiles || []
        } : null

        const { error } = await supabase
          .from('brand_reports')
          .update({
            analysis_data: {
              googleReviews,
              trustpilotReviews,
              competitors,
              socialMedia: socialMediaMetrics,
              social: socialData,
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
    // Log for debugging
    console.log(`🔍 Fetching competitors for: ${businessName}, Address: ${address}, Industry: ${industry}`)

    if (!supabaseUrl || !supabaseServiceRole || !businessName) {
      console.warn('⚠️ Missing required data for competitor analysis')
      console.warn('  supabaseUrl:', !!supabaseUrl, 'supabaseServiceRole:', !!supabaseServiceRole, 'businessName:', businessName)
      return {
        competitors: [],
        searchedBusiness: { name: businessName, address: address || 'Unknown' },
        error: 'Missing required data'
      }
    }

    // If no address, still return empty result instead of null
    if (!address) {
      console.warn('⚠️ No address provided for competitor analysis')
      return {
        competitors: [],
        searchedBusiness: { name: businessName, address: 'Unknown' },
        error: 'Address not provided'
      }
    }

    // Step 1: Search for competitors using business name, address, and industry
    console.log(`📍 Calling fetch-competitor-search with: businessName=${businessName}, address=${address}, industry=${industry}`)
    const searchResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-competitor-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        businessName,
        address,
        industry,
        radius: 5000,
        limit: 15
      })
    })

    console.log(`📡 fetch-competitor-search response status: ${searchResponse.status}`)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.warn('❌ Competitor search failed:', searchResponse.status, errorText)
      return {
        competitors: [],
        searchedBusiness: { name: businessName, address },
        error: `Failed to search for competitors (${searchResponse.status})`
      }
    }

    const searchResult = await searchResponse.json()
    console.log(`✅ Competitor search response:`, JSON.stringify(searchResult).substring(0, 500))
    console.log(`   Response.success: ${searchResult.success}`)
    console.log(`   Response.competitors length: ${searchResult.competitors?.length || 'undefined'}`)
    console.log(`   Response.error: ${searchResult.error || 'none'}`)
    console.log(`   FULL RESPONSE:`, JSON.stringify(searchResult, null, 2))

    if (!searchResult.success) {
      console.warn('❌ Competitor search not successful:', searchResult.error)
      return {
        competitors: [],
        searchedBusiness: searchResult.searchedBusiness || { name: businessName, address },
        error: searchResult.error || 'Failed to get competitors'
      }
    }

    if (!searchResult.competitors || searchResult.competitors.length === 0) {
      console.warn('⚠️ No competitors found in results')
      console.warn(`   Total competitors in response: ${searchResult.competitors?.length || 0}`)
      console.warn(`   Searched business: ${JSON.stringify(searchResult.searchedBusiness)}`)
      return {
        competitors: [],
        searchedBusiness: searchResult.searchedBusiness,
        error: 'No competitors found in this area'
      }
    }

    console.log(`🎯 Found ${searchResult.competitors.length} competitors`)

    // Step 2: Fetch reviews for all competitors using their place IDs
    const placeIds = searchResult.competitors.map((c: any) => c.placeId)
    console.log(`📋 Fetching reviews for ${placeIds.length} competitors`)

    const reviewsResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-competitor-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        placeIds
      })
    })

    console.log(`📡 fetch-competitor-reviews response status: ${reviewsResponse.status}`)

    let competitorsWithReviews = searchResult.competitors

    if (reviewsResponse.ok) {
      const reviewsResult = await reviewsResponse.json()
      console.log(`✅ Reviews fetched:`, reviewsResult.success ? 'Success' : 'Failed', reviewsResult.competitorsReviews?.length || 0, 'items')

      if (reviewsResult.success && reviewsResult.competitorsReviews) {
        // Merge reviews with competitor data
        competitorsWithReviews = searchResult.competitors.map((competitor: any) => {
          const reviews = reviewsResult.competitorsReviews.find(
            (cr: any) => cr.placeId === competitor.placeId
          )
          return {
            ...competitor,
            reviews: reviews?.reviews || [],
            googleRating: reviews?.rating || competitor.rating,
            googleReviewCount: reviews?.reviewCount || competitor.reviewCount
          }
        })
        console.log(`🔗 Merged reviews with ${competitorsWithReviews.length} competitors`)
      }
    } else {
      console.warn(`⚠️ Reviews fetch failed with status ${reviewsResponse.status}`)
    }

    const result = {
      competitors: competitorsWithReviews,
      searchedBusiness: searchResult.searchedBusiness,
      totalCompetitors: competitorsWithReviews.length
    }
    console.log(`✅ Returning competitors result:`, JSON.stringify(result).substring(0, 200))
    return result
  } catch (error) {
    console.error('❌ Competitor analysis failed:', error)
    return {
      competitors: [],
      searchedBusiness: { name: businessName, address: address || 'Unknown' },
      error: error instanceof Error ? error.message : 'Competitor analysis failed'
    }
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

    // Fetch from unified followers (YouTube, GitHub, etc.)
    const unifiedResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-unified-followers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceRole}`
      },
      body: JSON.stringify({
        profiles: socialProfiles
      })
    })

    let unifiedProfiles: any[] = []
    if (unifiedResponse.ok) {
      const result = await unifiedResponse.json()
      if (result.success && result.profiles) {
        unifiedProfiles = result.profiles
      }
    }

    // Also fetch from SerpAPI for Instagram and Facebook
    const serpAPIProfiles = await fetchSerpAPIFollowers(socialProfiles)

    // Merge both results
    const mergedProfiles = mergeFollowerData(unifiedProfiles, serpAPIProfiles)

    // Calculate total followers
    const totalFollowers = mergedProfiles.reduce((sum: number, p: any) => {
      return sum + (p.followers || 0)
    }, 0)

    return {
      detected_platforms: mergedProfiles,
      total_followers: totalFollowers,
      profiles: mergedProfiles
    }
  } catch (error) {
    console.warn('Social media metrics fetch failed:', error)
    return null
  }
}

// Extract username from social media URL
function extractUsernameFromUrl(url: string, platform: string): string | null {
  try {
    if (!url) return null

    const platform_lower = platform.toLowerCase()

    if (platform_lower.includes('instagram')) {
      const match = url.match(/instagram\.com\/([^/?]+)/)
      return match?.[1] || null
    }

    if (platform_lower.includes('facebook')) {
      const match = url.match(/facebook\.com\/(?:pages\/[^/]+\/)?([^/?]+)/)
      return match?.[1] || null
    }

    return null
  } catch (error) {
    console.log(`Failed to extract username: ${error}`)
    return null
  }
}

// Fetch followers from SerpAPI for Instagram and Facebook
async function fetchSerpAPIFollowers(socialProfiles: any[]): Promise<any[]> {
  try {
    const serpApiKey = Deno.env.get('SERPAPI_KEY')
    if (!serpApiKey) {
      console.warn('SerpAPI key not configured')
      return []
    }

    const instagramProfiles = socialProfiles.filter(p => p.platform?.toLowerCase().includes('instagram'))
    const facebookProfiles = socialProfiles.filter(p => p.platform?.toLowerCase().includes('facebook'))

    const results: any[] = []

    // Fetch Instagram followers
    for (const profile of instagramProfiles) {
      try {
        const username = extractUsernameFromUrl(profile.url, 'instagram')
        if (username) {
          const url = `https://serpapi.com/search?engine=instagram_user&username=${encodeURIComponent(username)}&api_key=${serpApiKey}`
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

          if (response.ok) {
            const data = await response.json()
            const followers = data.user_info?.followers_count || data.followers || data.followers_count

            if (followers) {
              const followerCount = typeof followers === 'string'
                ? parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
                : followers

              results.push({
                ...profile,
                username,
                followers: followerCount,
                source: 'serpapi'
              })
              continue
            }
          }
        }

        results.push({ ...profile, followers: null, error: 'Could not fetch Instagram followers' })
      } catch (error) {
        console.warn(`Instagram fetch failed: ${error}`)
        results.push({ ...profile, followers: null, error: 'Instagram fetch failed' })
      }
    }

    // Fetch Facebook followers
    for (const profile of facebookProfiles) {
      try {
        const username = extractUsernameFromUrl(profile.url, 'facebook')
        if (username) {
          const url = `https://serpapi.com/search?engine=facebook_user&username=${encodeURIComponent(username)}&api_key=${serpApiKey}`
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) })

          if (response.ok) {
            const data = await response.json()
            const followers = data.page_info?.followers_count || data.followers || data.fans

            if (followers) {
              const followerCount = typeof followers === 'string'
                ? parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
                : followers

              results.push({
                ...profile,
                username,
                followers: followerCount,
                source: 'serpapi'
              })
              continue
            }
          }
        }

        results.push({ ...profile, followers: null, error: 'Could not fetch Facebook followers' })
      } catch (error) {
        console.warn(`Facebook fetch failed: ${error}`)
        results.push({ ...profile, followers: null, error: 'Facebook fetch failed' })
      }
    }

    return results
  } catch (error) {
    console.warn('SerpAPI followers fetch failed:', error)
    return []
  }
}

// Merge follower data from multiple sources
function mergeFollowerData(unifiedProfiles: any[], serpAPIProfiles: any[]): any[] {
  const profileMap = new Map()

  // Add unified profiles
  unifiedProfiles.forEach(p => {
    const key = `${p.platform}-${p.url}`
    profileMap.set(key, p)
  })

  // Add or merge SerpAPI profiles
  serpAPIProfiles.forEach(p => {
    const key = `${p.platform}-${p.url}`
    if (profileMap.has(key)) {
      // Prefer SerpAPI data if both exist
      const existing = profileMap.get(key)
      profileMap.set(key, {
        ...existing,
        ...p,
        source: p.followers ? 'serpapi' : existing.source
      })
    } else {
      profileMap.set(key, p)
    }
  })

  return Array.from(profileMap.values())
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
