import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TwitterFollowersRequest {
  username: string
}

interface TwitterFollowersResponse {
  success: boolean
  followers_count?: number
  username?: string
  error?: string
}

// Fetch Twitter followers using X API v2
async function fetchTwitterFollowers(username: string, bearerToken: string): Promise<number | null> {
  try {
    console.log(`🐦 Fetching Twitter followers for: @${username}`)

    // Direct request to get user with public_metrics
    const url = `https://api.x.com/2/users/by/username/${encodeURIComponent(username)}?user.fields=public_metrics`
    const headers = {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'TwitterFollowersBot/1.0',
    }

    console.log(`📡 Calling Twitter API: ${url.substring(0, 80)}...`)

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Twitter API failed (${response.status}):`, errorText)
      return null
    }

    const data = await response.json()
    console.log(`✅ Twitter API response:`, JSON.stringify(data).substring(0, 300))

    const followersCount = data.data?.public_metrics?.followers_count

    if (followersCount !== undefined && followersCount !== null && followersCount > 0) {
      console.log(`✅ Twitter followers for @${username}: ${followersCount}`)
      return followersCount
    }

    console.warn(`⚠️ No followers count found for @${username}`)
    return null
  } catch (error) {
    console.error(`❌ Twitter API error:`, error)
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username } = await req.json() as TwitterFollowersRequest

    if (!username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Username is required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN')

    if (!bearerToken) {
      console.error('❌ TWITTER_BEARER_TOKEN not configured')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Twitter API credentials not configured',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const followersCount = await fetchTwitterFollowers(username, bearerToken)

    if (followersCount !== null) {
      return new Response(
        JSON.stringify({
          success: true,
          username,
          followers_count: followersCount,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          username,
          followers_count: null,
          error: 'Could not fetch followers count',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
  } catch (error) {
    console.error('Error in fetch-twitter-followers:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
