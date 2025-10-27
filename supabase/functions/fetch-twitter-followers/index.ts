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

    // Step 1: Look up user by username
    const lookupUrl = `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}`
    const lookupHeaders = {
      'Authorization': `Bearer ${bearerToken}`,
      'User-Agent': 'TwitterFollowersBot/1.0',
    }

    const lookupResponse = await fetch(lookupUrl, {
      method: 'GET',
      headers: lookupHeaders,
      signal: AbortSignal.timeout(8000),
    })

    if (!lookupResponse.ok) {
      const error = await lookupResponse.text()
      console.error(`❌ Twitter lookup failed (${lookupResponse.status}):`, error)
      return null
    }

    const lookupData = await lookupResponse.json()
    console.log(`✅ User lookup response:`, JSON.stringify(lookupData).substring(0, 200))

    if (!lookupData.data?.id) {
      console.warn(`⚠️ No user found for: @${username}`)
      return null
    }

    const userId = lookupData.data.id

    // Step 2: Get user details including followers count
    const userUrl = `https://api.twitter.com/2/users/${userId}?user.fields=public_metrics`
    const userResponse = await fetch(userUrl, {
      method: 'GET',
      headers: lookupHeaders,
      signal: AbortSignal.timeout(8000),
    })

    if (!userResponse.ok) {
      const error = await userResponse.text()
      console.error(`❌ Twitter user details failed (${userResponse.status}):`, error)
      return null
    }

    const userData = await userResponse.json()
    console.log(`✅ User details response:`, JSON.stringify(userData).substring(0, 200))

    const followersCount = userData.data?.public_metrics?.followers_count

    if (followersCount !== undefined && followersCount !== null) {
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
