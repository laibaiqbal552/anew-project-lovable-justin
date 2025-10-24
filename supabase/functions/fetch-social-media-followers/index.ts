import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialMediaProfile {
  platform: string
  url: string
  followers?: number
  verified?: boolean
}

interface SocialMediaFollowersResponse {
  success: boolean
  profiles: SocialMediaProfile[]
  totalFollowers: number
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profiles } = await req.json()

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          profiles: [],
          totalFollowers: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const scrapApiKey = Deno.env.get('SCRAPAPI_KEY')
    if (!scrapApiKey) {
      console.warn('SCRAPAPI_KEY not configured')
      // Return profiles without follower data
      return new Response(
        JSON.stringify({
          success: true,
          profiles: profiles.map((p: any) => ({
            ...p,
            followers: undefined
          })),
          totalFollowers: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log(`Fetching follower counts for ${profiles.length} social profiles`)

    // Fetch follower data for each profile in parallel
    const enrichedProfiles = await Promise.all(
      profiles.map((profile: any) => fetchFollowerCount(profile, scrapApiKey))
    )

    const totalFollowers = enrichedProfiles.reduce((sum, p) => sum + (p.followers || 0), 0)

    const response: SocialMediaFollowersResponse = {
      success: true,
      profiles: enrichedProfiles,
      totalFollowers
    }

    console.log(`✅ Social media follower data fetched. Total followers: ${totalFollowers}`)

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Social media followers fetch error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        profiles: [],
        totalFollowers: 0,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function fetchFollowerCount(
  profile: any,
  scrapApiKey: string
): Promise<SocialMediaProfile> {
  try {
    if (!profile.url) {
      return profile
    }

    const platform = profile.platform?.toLowerCase() || 'unknown'

    console.log(`Scraping followers for ${platform}: ${profile.url}`)

    // Use ScrapAPI to fetch the profile page and extract followers
    const scrapUrl = `https://api.scrapapi.com/scrapers/instagram?api_key=${scrapApiKey}&url=${encodeURIComponent(
      profile.url
    )}`

    const response = await fetch(scrapUrl, {
      signal: AbortSignal.timeout(15000) // 15 second timeout per profile
    })

    if (!response.ok) {
      console.warn(`Failed to scrape ${platform}: ${response.status}`)
      return profile
    }

    const data = await response.json()

    // Extract followers based on platform
    let followers = extractFollowers(data, platform)

    if (followers !== undefined) {
      return {
        ...profile,
        followers,
        verified: data.verified || profile.verified
      }
    }

    return profile
  } catch (error) {
    console.warn(`Error fetching followers for ${profile.platform}:`, error)
    return profile
  }
}

function extractFollowers(data: any, platform: string): number | undefined {
  // Try common field names for follower counts
  const followerFields = [
    'followers',
    'follower_count',
    'followers_count',
    'followerCount',
    'subscriber_count',
    'subscribers',
    'fans',
    'fan_count',
    'user_followers',
    'stats.followers',
    'metrics.followers',
    'data.followers'
  ]

  // Direct field extraction
  for (const field of followerFields) {
    const value = getNestedValue(data, field)
    if (typeof value === 'number' && value > 0) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  // Platform-specific extraction
  switch (platform.toLowerCase()) {
    case 'instagram':
      return data.followers || data.follower_count || data.user_followers
    case 'twitter':
    case 'x':
      return data.followers_count || data.followers
    case 'facebook':
      return data.followers || data.fan_count || data.subscriber_count
    case 'tiktok':
      return data.follower_count || data.followers
    case 'linkedin':
      return data.follower_count || data.followers
    case 'youtube':
      return data.subscriber_count || data.subscribers || data.followers
    case 'twitch':
      return data.followers || data.follower_count
    case 'github':
      return data.followers
    case 'pinterest':
      return data.followers || data.monthly_views
    default:
      return undefined
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj)
}
