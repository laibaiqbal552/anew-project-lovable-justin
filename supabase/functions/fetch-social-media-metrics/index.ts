import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialMetrics {
  platform: string
  followers: number | null
  engagement: number | null
  verified: boolean
  url: string | null
}

interface SocialMediaMetricsData {
  platforms: SocialMetrics[]
  totalFollowers: number
  averageEngagement: number | null
  topPlatforms: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { socialProfiles } = await req.json()

    if (!socialProfiles || !Array.isArray(socialProfiles)) {
      throw new Error('Social profiles array is required')
    }

    console.log(`Fetching social media metrics for ${socialProfiles.length} profiles`)

    const metrics: SocialMetrics[] = []
    let totalFollowers = 0
    let totalEngagement = 0
    let engagementCount = 0

    // Process each social profile
    for (const profile of socialProfiles) {
      try {
        let platformMetrics = await fetchPlatformMetrics(profile)
        metrics.push(platformMetrics)

        if (platformMetrics.followers !== null && platformMetrics.followers > 0) {
          totalFollowers += platformMetrics.followers
        }

        if (platformMetrics.engagement !== null && platformMetrics.engagement > 0) {
          totalEngagement += platformMetrics.engagement
          engagementCount++
        }
      } catch (error) {
        console.warn(`Failed to fetch metrics for ${profile.platform}:`, error)
        metrics.push({
          platform: profile.platform,
          followers: null,
          engagement: null,
          verified: false,
          url: profile.url || null
        })
      }
    }

    const averageEngagement = engagementCount > 0 ? totalEngagement / engagementCount : null

    // Determine top platforms by followers
    const topPlatforms = metrics
      .filter(m => m.followers !== null && m.followers > 0)
      .sort((a, b) => (b.followers || 0) - (a.followers || 0))
      .slice(0, 3)
      .map(m => m.platform)

    const result: SocialMediaMetricsData = {
      platforms: metrics,
      totalFollowers,
      averageEngagement,
      topPlatforms
    }

    console.log('✅ Social media metrics fetched:', result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('Social media metrics error:', error)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          platforms: [],
          totalFollowers: 0,
          averageEngagement: null,
          topPlatforms: []
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

async function fetchPlatformMetrics(profile: any): Promise<SocialMetrics> {
  const platform = profile.platform.toLowerCase()
  const url = profile.url

  // For now, return existing follower data from profile
  // In production, these would call actual APIs
  return {
    platform: profile.platform,
    followers: profile.followers || null,
    engagement: profile.engagement || null,
    verified: profile.verified || false,
    url: url || null
  }
}
