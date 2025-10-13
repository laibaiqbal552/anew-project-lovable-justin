import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialMediaAnalysisRequest {
  businessId: string;
  reportId: string;
}

interface SocialPlatformData {
  platform: string;
  followers: number;
  engagement_rate: number;
  posts_per_week: number;
  last_post_date: string;
  profile_completion: number;
  verified: boolean;
}

interface SocialMediaAnalysisResult {
  total_followers: number;
  average_engagement_rate: number;
  platforms_active: number;
  posting_frequency: string;
  social_reach_score: number;
  consistency_score: number;
  platform_data: SocialPlatformData[];
  recommendations: string[];
}

// Deep merge helper to merge analysis_data sections
function deepMerge(target: any, source: any) {
  const output = { ...(target || {}) }
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(output[key], source[key])
    } else {
      output[key] = source[key]
    }
  }
  return output
}
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      // Service role to allow secure server-side writes
      Deno.env.get('SUPABASE_SERVICE_ROLE') ?? '',
    )

    const { businessId, reportId }: SocialMediaAnalysisRequest = await req.json()
    console.log(`Starting social media analysis for business: ${businessId}`)

    // Get social accounts for the business
    const { data: socialAccounts, error: socialError } = await supabaseClient
      .from('social_accounts')
      .select('*')
      .eq('business_id', businessId)

    if (socialError) {
      console.error('Error fetching social accounts:', socialError)
      throw socialError
    }

    const results = await analyzeSocialMedia(socialAccounts)
    // Calculate social media score
    const socialScore = calculateSocialMediaScore(results)

    // Fetch existing analysis_data to merge
    const { data: existing, error: fetchErr } = await supabaseClient
      .from('brand_reports')
      .select('analysis_data')
      .eq('id', reportId)
      .single()

    if (fetchErr) {
      console.log('Fetch existing analysis_data error (non-fatal):', fetchErr)
    }

    const merged = deepMerge(existing?.analysis_data, {
      social: results,
      last_updated: new Date().toISOString(),
    })

    // Update the brand report with social media analysis results (merged)
    const { error: updateError } = await supabaseClient
      .from('brand_reports')
      .update({
        social_score: socialScore,
        analysis_data: merged,
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Error updating report:', updateError)
      throw updateError
    }

    console.log(`Social media analysis completed for business: ${businessId}`)
    return new Response(
      JSON.stringify({ success: true, data: { section: 'social', score: socialScore, analysis: results } }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Social media analysis error:', error)
    const fallback = {
      total_followers: Math.floor(Math.random() * 5000) + 500,
      engagement_rate: Number((Math.random() * 2 + 1).toFixed(2)),
      platforms_active: 2,
      posting_frequency: 'Irregular',
      per_platform: {
        facebook: { followers: Math.floor(Math.random() * 3000) + 200, engagement_rate: 1.2 },
        instagram: { followers: Math.floor(Math.random() * 4000) + 300, engagement_rate: 2.1 },
      },
    }
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error), fallback }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  }
})

async function analyzeSocialMedia(socialAccounts: any[]): Promise<SocialMediaAnalysisResult> {
  console.log(`Analyzing ${socialAccounts.length} social accounts`)

  const platformData: SocialPlatformData[] = []
  let totalFollowers = 0
  let totalEngagementRate = 0
  let activePlatforms = 0

  for (const account of socialAccounts) {
    if (account.account_url) {
      try {
        const data = await analyzePlatform(account.platform, account.account_url, account.access_token)
        platformData.push(data)
        totalFollowers += data.followers
        totalEngagementRate += data.engagement_rate
        if (data.followers > 0) activePlatforms++
      } catch (error) {
        console.error(`Error analyzing ${account.platform}:`, error)
        // Add placeholder data for failed analysis
        platformData.push({
          platform: account.platform,
          followers: 0,
          engagement_rate: 0,
          posts_per_week: 0,
          last_post_date: '',
          profile_completion: 50,
          verified: false
        })
      }
    }
  }

  const averageEngagementRate = activePlatforms > 0 ? totalEngagementRate / activePlatforms : 0
  const avgPostsPerWeek = platformData.reduce((sum, p) => sum + p.posts_per_week, 0) / platformData.length

  const postingFrequency = getPostingFrequencyLabel(avgPostsPerWeek)
  const socialReachScore = calculateSocialReachScore(totalFollowers, activePlatforms)
  const consistencyScore = calculateConsistencyScore(platformData)

  const recommendations = generateSocialRecommendations(platformData, averageEngagementRate, avgPostsPerWeek)

  return {
    total_followers: totalFollowers,
    average_engagement_rate: Math.round(averageEngagementRate * 100) / 100,
    platforms_active: activePlatforms,
    posting_frequency: postingFrequency,
    social_reach_score: socialReachScore,
    consistency_score: consistencyScore,
    platform_data: platformData,
    recommendations
  }
}

async function analyzePlatform(platform: string, url: string, accessToken?: string): Promise<SocialPlatformData> {
  console.log(`Analyzing ${platform}: ${url}`)

  // For demo purposes, we'll generate realistic mock data
  // In production, this would call actual APIs
  switch (platform.toLowerCase()) {
    case 'facebook':
      return await analyzeFacebook(url, accessToken)
    case 'instagram':
      return await analyzeInstagram(url, accessToken)
    case 'twitter':
      return await analyzeTwitter(url, accessToken)
    case 'linkedin':
      return await analyzeLinkedIn(url, accessToken)
    case 'youtube':
      return await analyzeYouTube(url, accessToken)
    default:
      return generateMockPlatformData(platform)
  }
}

async function analyzeFacebook(url: string, accessToken?: string): Promise<SocialPlatformData> {
  // In production, this would use Facebook Graph API
  if (accessToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=followers_count,engagement`)
      if (response.ok) {
        const data = await response.json()
        return {
          platform: 'facebook',
          followers: data.followers_count || 0,
          engagement_rate: data.engagement?.rate || 0,
          posts_per_week: 5,
          last_post_date: new Date().toISOString(),
          profile_completion: 85,
          verified: data.verified || false
        }
      }
    } catch (error) {
      console.error('Facebook API error:', error)
    }
  }
  return generateMockPlatformData('facebook')
}

async function analyzeInstagram(url: string, accessToken?: string): Promise<SocialPlatformData> {
  // In production, this would use Instagram Basic Display API
  if (accessToken) {
    try {
      const response = await fetch(`https://graph.instagram.com/me?fields=account_type,media_count&access_token=${accessToken}`)
      if (response.ok) {
        const data = await response.json()
        return {
          platform: 'instagram',
          followers: Math.floor(Math.random() * 5000) + 1000,
          engagement_rate: Math.random() * 5 + 1,
          posts_per_week: 7,
          last_post_date: new Date().toISOString(),
          profile_completion: 90,
          verified: false
        }
      }
    } catch (error) {
      console.error('Instagram API error:', error)
    }
  }
  return generateMockPlatformData('instagram')
}

async function analyzeTwitter(url: string, accessToken?: string): Promise<SocialPlatformData> {
  // In production, this would use Twitter API v2
  return generateMockPlatformData('twitter')
}

async function analyzeLinkedIn(url: string, accessToken?: string): Promise<SocialPlatformData> {
  // In production, this would use LinkedIn API
  return generateMockPlatformData('linkedin')
}

async function analyzeYouTube(url: string, accessToken?: string): Promise<SocialPlatformData> {
  // In production, this would use YouTube Data API
  return generateMockPlatformData('youtube')
}

function generateMockPlatformData(platform: string): SocialPlatformData {
  const baseFollowers = {
    facebook: 2000,
    instagram: 1500,
    twitter: 800,
    linkedin: 600,
    youtube: 300
  }

  const base = baseFollowers[platform.toLowerCase() as keyof typeof baseFollowers] || 500

  return {
    platform,
    followers: Math.floor(Math.random() * base) + base,
    engagement_rate: Math.random() * 4 + 1,
    posts_per_week: Math.floor(Math.random() * 7) + 1,
    last_post_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    profile_completion: Math.floor(Math.random() * 30) + 70,
    verified: Math.random() > 0.8
  }
}

function calculateSocialMediaScore(results: SocialMediaAnalysisResult): number {
  // Weight different factors
  const followersWeight = 0.25
  const engagementWeight = 0.35
  const platformsWeight = 0.20
  const consistencyWeight = 0.20

  const followersScore = Math.min(100, (results.total_followers / 10000) * 100)
  const engagementScore = Math.min(100, results.average_engagement_rate * 20)
  const platformsScore = Math.min(100, (results.platforms_active / 5) * 100)
  const consistencyScore = results.consistency_score

  return Math.round(
    (followersScore * followersWeight) +
    (engagementScore * engagementWeight) +
    (platformsScore * platformsWeight) +
    (consistencyScore * consistencyWeight)
  )
}

function calculateSocialReachScore(totalFollowers: number, activePlatforms: number): number {
  const baseScore = Math.min(80, (totalFollowers / 10000) * 80)
  const platformBonus = Math.min(20, activePlatforms * 4)
  return Math.round(baseScore + platformBonus)
}

function calculateConsistencyScore(platformData: SocialPlatformData[]): number {
  if (platformData.length === 0) return 0

  const avgCompletion = platformData.reduce((sum, p) => sum + p.profile_completion, 0) / platformData.length
  const avgPostsPerWeek = platformData.reduce((sum, p) => sum + p.posts_per_week, 0) / platformData.length

  const completionScore = avgCompletion
  const activityScore = Math.min(100, avgPostsPerWeek * 20)

  return Math.round((completionScore + activityScore) / 2)
}

function getPostingFrequencyLabel(avgPostsPerWeek: number): string {
  if (avgPostsPerWeek >= 7) return 'Daily'
  if (avgPostsPerWeek >= 4) return 'Regular'
  if (avgPostsPerWeek >= 2) return 'Moderate'
  if (avgPostsPerWeek >= 1) return 'Weekly'
  return 'Infrequent'
}

function generateSocialRecommendations(
  platformData: SocialPlatformData[],
  avgEngagement: number,
  avgPosts: number
): string[] {
  const recommendations: string[] = []

  if (avgEngagement < 2) {
    recommendations.push('Increase engagement by responding to comments and creating interactive content')
  }

  if (avgPosts < 3) {
    recommendations.push('Increase posting frequency to maintain audience engagement')
  }

  if (platformData.length < 3) {
    recommendations.push('Expand to additional social media platforms to reach more audiences')
  }

  const lowCompletionPlatforms = platformData.filter(p => p.profile_completion < 80)
  if (lowCompletionPlatforms.length > 0) {
    recommendations.push(`Complete profile information on ${lowCompletionPlatforms.map(p => p.platform).join(', ')}`)
  }

  if (recommendations.length === 0) {
    recommendations.push('Great job! Your social media presence is strong. Consider experimenting with new content formats.')
  }

  return recommendations
}