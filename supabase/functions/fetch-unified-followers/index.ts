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

interface UnifiedFollowersResponse {
  success: boolean
  profiles: SocialProfile[]
  totalFollowers: number
  error?: string
}

// Attempt to fetch from ScrapAPI with timeout
async function fetchViaScrapAPI(url: string, scrapApiKey: string): Promise<any> {
  try {
    const scrapUrl = `https://api.scrapapi.com/scrapers?url=${encodeURIComponent(url)}&api_key=${scrapApiKey}`
    const response = await fetch(scrapUrl, { signal: AbortSignal.timeout(10000) })
    return await response.json()
  } catch (error) {
    console.log(`ScrapAPI fallback failed for ${url}: ${error}`)
    return null
  }
}

// Fetch YouTube followers
async function fetchYouTubeFollowers(channelId: string, apiKey: string): Promise<number | null> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?id=${encodeURIComponent(channelId)}&part=statistics&key=${apiKey}`
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await response.json()

    if (data.items?.[0]?.statistics?.subscriberCount) {
      const count = data.items[0].statistics.subscriberCount
      if (count !== 'unlisted') {
        return parseInt(count, 10)
      }
    }
    return null
  } catch (error) {
    console.log(`YouTube fetch failed: ${error}`)
    return null
  }
}

// Fetch GitHub followers
async function fetchGitHubFollowers(username: string, token?: string): Promise<number | null> {
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Supabase-Function',
    }

    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    const url = `https://api.github.com/users/${encodeURIComponent(username)}`
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(8000)
    })
    const data = await response.json()

    if (data.followers !== undefined) {
      return data.followers
    }
    return null
  } catch (error) {
    console.log(`GitHub fetch failed: ${error}`)
    return null
  }
}

// Extract followers from profile URL
function extractIdentifierFromUrl(url: string, platform: string): string | null {
  try {
    if (!url) return null

    switch (platform.toLowerCase()) {
      case 'youtube':
        // https://youtube.com/@channelname or /c/channelname or ?v=... or /user/...
        const youtubeMatch = url.match(/(?:youtube\.com\/@|youtube\.com\/c\/|youtube\.com\/user\/|youtube\.com\/channel\/)([^/?]+)/)
        return youtubeMatch?.[1] || null

      case 'github':
        // https://github.com/username
        const githubMatch = url.match(/github\.com\/([^/?]+)/)
        return githubMatch?.[1] || null

      case 'instagram':
      case 'twitter':
      case 'tiktok':
      case 'linkedin':
        // Generic: extract username from common URL patterns
        const genericMatch = url.match(/(?:instagram|twitter|tiktok|linkedin)\.com\/(?:in\/|@)?([^/?]+)/)
        return genericMatch?.[1] || null

      default:
        return null
    }
  } catch (error) {
    console.log(`Failed to extract identifier for ${platform}: ${error}`)
    return null
  }
}

// Extract followers count from ScrapAPI response
function extractFollowersFromScrapAPIResponse(data: any, platform: string): number | null {
  if (!data) return null

  const platform_lower = platform.toLowerCase()

  // Try common field names
  const fieldNames = [
    'followers',
    'follower_count',
    'followers_count',
    'user_followers',
    'subscriber_count',
    'subscribers',
    'member_count',
    'fans',
  ]

  // Search in main data object
  for (const field of fieldNames) {
    if (data[field] !== undefined && typeof data[field] === 'number') {
      return data[field]
    }
    // Also try string conversions
    if (data[field] && typeof data[field] === 'string') {
      const parsed = parseInt(data[field].toString().replace(/[^\d]/g, ''), 10)
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  }

  // Search in nested objects (common in scraping responses)
  if (data.user) {
    for (const field of fieldNames) {
      if (data.user[field] !== undefined && typeof data.user[field] === 'number') {
        return data.user[field]
      }
    }
  }

  if (data.account) {
    for (const field of fieldNames) {
      if (data.account[field] !== undefined && typeof data.account[field] === 'number') {
        return data.account[field]
      }
    }
  }

  if (data.profile) {
    for (const field of fieldNames) {
      if (data.profile[field] !== undefined && typeof data.profile[field] === 'number') {
        return data.profile[field]
      }
    }
  }

  if (data.stats) {
    for (const field of fieldNames) {
      if (data.stats[field] !== undefined && typeof data.stats[field] === 'number') {
        return data.stats[field]
      }
    }
  }

  return null
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

    const scrapApiKey = Deno.env.get('SCRAPAPI_KEY')
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    const githubToken = Deno.env.get('GITHUB_TOKEN')

    const enrichedProfiles: SocialProfile[] = []
    let totalFollowers = 0

    // Process each profile with intelligent fallback strategy
    for (const profile of profiles) {
      const platform = profile.platform || 'unknown'
      const url = profile.url || ''
      let followers: number | null = null
      let source = 'unknown'

      try {
        // YouTube: Try official API first
        if (platform.toLowerCase() === 'youtube' && youtubeApiKey) {
          const channelId = extractIdentifierFromUrl(url, 'youtube')
          if (channelId) {
            followers = await fetchYouTubeFollowers(channelId, youtubeApiKey)
            if (followers !== null) {
              source = 'youtube-api'
            }
          }
        }

        // GitHub: Try official API first
        if (platform.toLowerCase() === 'github' && followers === null) {
          const username = extractIdentifierFromUrl(url, 'github')
          if (username) {
            followers = await fetchGitHubFollowers(username, githubToken)
            if (followers !== null) {
              source = 'github-api'
            }
          }
        }

        // Fallback to ScrapAPI for any platform
        if (followers === null && scrapApiKey && url) {
          try {
            const scrapData = await fetchViaScrapAPI(url, scrapApiKey)
            followers = extractFollowersFromScrapAPIResponse(scrapData, platform)
            if (followers !== null) {
              source = 'scrapapi'
            }
          } catch (error) {
            console.log(`ScrapAPI fallback failed for ${platform}: ${error}`)
          }
        }

        if (followers !== null && followers > 0) {
          totalFollowers += followers
        }

        enrichedProfiles.push({
          platform,
          url,
          username: extractIdentifierFromUrl(url, platform),
          followers: followers || 0,
          source: followers ? source : undefined,
          error: followers ? undefined : 'Could not fetch follower count',
        })
      } catch (error) {
        console.error(`Error processing ${platform}: ${error}`)
        enrichedProfiles.push({
          platform,
          url,
          followers: null,
          error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        profiles: enrichedProfiles,
        totalFollowers,
      } as UnifiedFollowersResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in fetch-unified-followers:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
