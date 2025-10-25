import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialProfile {
  platform: string
  url: string
  username?: string
  followers?: number | null
  source?: string
  error?: string
}

interface SerpAPIFollowersResponse {
  success: boolean
  profiles: SocialProfile[]
  totalFollowers: number
  error?: string
}

// Extract followers count from SerpAPI response
function extractFollowersFromSerpAPI(data: any, platform: string): number | null {
  if (!data) return null

  // SerpAPI returns different structures for Instagram and Facebook
  const platform_lower = platform.toLowerCase()

  // Instagram followers extraction
  if (platform_lower.includes('instagram')) {
    if (data.user_info?.followers_count) {
      const followers = data.user_info.followers_count
      if (typeof followers === 'number') return followers
      if (typeof followers === 'string') {
        return parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
      }
    }

    // Alternative paths for Instagram
    if (data.followers) {
      const followers = data.followers
      if (typeof followers === 'number') return followers
      if (typeof followers === 'string') {
        return parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
      }
    }

    if (data.followers_count) {
      const followers = data.followers_count
      if (typeof followers === 'number') return followers
      if (typeof followers === 'string') {
        return parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
      }
    }
  }

  // Facebook followers extraction
  if (platform_lower.includes('facebook')) {
    if (data.page_info?.followers_count) {
      const followers = data.page_info.followers_count
      if (typeof followers === 'number') return followers
      if (typeof followers === 'string') {
        return parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
      }
    }

    // Alternative paths for Facebook
    if (data.followers) {
      const followers = data.followers
      if (typeof followers === 'number') return followers
      if (typeof followers === 'string') {
        return parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
      }
    }

    if (data.fans) {
      const followers = data.fans
      if (typeof followers === 'number') return followers
      if (typeof followers === 'string') {
        return parseInt(followers.toString().replace(/[^\d]/g, ''), 10)
      }
    }
  }

  return null
}

// Extract username from profile URL
function extractUsername(url: string, platform: string): string | null {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profiles } = await req.json()

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'profiles array is required and cannot be empty'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const serpApiKey = Deno.env.get('SERPAPI_KEY')

    if (!serpApiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          profiles: profiles.map(p => ({
            ...p,
            followers: null,
            error: 'SerpAPI key not configured'
          })),
          totalFollowers: 0,
          error: 'SerpAPI key not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const enrichedProfiles: SocialProfile[] = []
    let totalFollowers = 0

    // Process each profile
    for (const profile of profiles) {
      const platform = profile.platform || 'unknown'
      const url = profile.url || ''
      const username = extractUsername(url, platform)

      // Only process Instagram and Facebook for SerpAPI
      if (!platform.toLowerCase().includes('instagram') && !platform.toLowerCase().includes('facebook')) {
        enrichedProfiles.push({
          ...profile,
          error: 'SerpAPI only supports Instagram and Facebook'
        })
        continue
      }

      if (!username) {
        enrichedProfiles.push({
          ...profile,
          followers: null,
          error: 'Could not extract username from URL'
        })
        continue
      }

      try {
        // Construct SerpAPI request
        let serpApiUrl = ''

        if (platform.toLowerCase().includes('instagram')) {
          serpApiUrl = `https://serpapi.com/search?engine=instagram_user&username=${encodeURIComponent(username)}&api_key=${serpApiKey}`
        } else if (platform.toLowerCase().includes('facebook')) {
          serpApiUrl = `https://serpapi.com/search?engine=facebook_user&username=${encodeURIComponent(username)}&api_key=${serpApiKey}`
        }

        if (!serpApiUrl) {
          enrichedProfiles.push({
            ...profile,
            followers: null,
            error: 'Unsupported platform for SerpAPI'
          })
          continue
        }

        const response = await fetch(serpApiUrl, {
          signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) {
          console.warn(`SerpAPI request failed for ${platform}: ${response.status}`)
          enrichedProfiles.push({
            ...profile,
            followers: null,
            error: `API request failed: ${response.status}`
          })
          continue
        }

        const data = await response.json()

        if (data.error) {
          console.warn(`SerpAPI error for ${platform}: ${data.error}`)
          enrichedProfiles.push({
            ...profile,
            followers: null,
            error: data.error
          })
          continue
        }

        // Extract followers count
        const followers = extractFollowersFromSerpAPI(data, platform)

        if (followers !== null && followers > 0) {
          totalFollowers += followers
          enrichedProfiles.push({
            platform,
            url,
            username,
            followers,
            source: 'serpapi'
          })
        } else {
          enrichedProfiles.push({
            ...profile,
            followers: null,
            error: 'Could not extract follower count from response'
          })
        }
      } catch (error) {
        console.error(`Error processing ${platform}: ${error}`)
        enrichedProfiles.push({
          ...profile,
          followers: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        profiles: enrichedProfiles,
        totalFollowers
      } as SerpAPIFollowersResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in fetch-serpapi-followers:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
