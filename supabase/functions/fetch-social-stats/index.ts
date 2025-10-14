import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialStatsRequest {
  platform: string;
  url: string;
}

interface SocialStatsResponse {
  followers: number;
  engagement?: number;
  verified?: boolean;
  username?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platform, url }: SocialStatsRequest = await req.json()
    console.log(`Fetching stats for ${platform}: ${url}`)

    let stats: SocialStatsResponse | null = null

    switch (platform.toLowerCase()) {
      case 'youtube':
        stats = await fetchYouTubeStats(url)
        break
      case 'instagram':
        stats = await fetchInstagramStats(url)
        break
      case 'twitter':
      case 'x':
        stats = await fetchTwitterStats(url)
        break
      case 'facebook':
        stats = await fetchFacebookStats(url)
        break
      case 'linkedin':
        stats = await fetchLinkedInStats(url)
        break
      case 'tiktok':
        stats = await fetchTikTokStats(url)
        break
      case 'threads':
        stats = await fetchThreadsStats(url)
        break
      default:
        throw new Error(`Unsupported platform: ${platform}`)
    }

    if (stats) {
      return new Response(
        JSON.stringify({ success: true, data: stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not fetch stats' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

  } catch (error: any) {
    console.error('Error fetching social stats:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// YouTube - Using official API
async function fetchYouTubeStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    const channelInfo = extractYouTubeChannelInfo(url)
    if (!channelInfo) return null

    const apiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!apiKey) {
      console.warn('YouTube API key not configured')
      return null
    }

    let apiUrl = ''
    if (channelInfo.type === 'channelId') {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelInfo.id}&key=${apiKey}`
    } else if (channelInfo.type === 'handle') {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelInfo.id)}&key=${apiKey}`
      const searchRes = await fetch(searchUrl)
      if (searchRes.ok) {
        const searchData = await searchRes.json()
        if (searchData.items && searchData.items.length > 0) {
          const channelId = searchData.items[0].snippet.channelId
          apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`
        }
      }
    } else if (channelInfo.type === 'username') {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&forUsername=${channelInfo.id}&key=${apiKey}`
    }

    if (apiUrl) {
      const response = await fetch(apiUrl)
      if (response.ok) {
        const data = await response.json()
        if (data.items && data.items.length > 0) {
          const channel = data.items[0]
          const stats = channel.statistics
          return {
            followers: parseInt(stats.subscriberCount || '0', 10),
            engagement: calculateYouTubeEngagement(stats),
            verified: !!channel.snippet?.customUrl,
            username: channel.snippet?.title
          }
        }
      }
    }
  } catch (error) {
    console.error('YouTube fetch error:', error)
  }
  return null
}

// Instagram - Using free public API
async function fetchInstagramStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    const username = extractInstagramUsername(url)
    if (!username) return null

    // Try free Instagram public API (no auth required)
    // Using a CORS proxy to access Instagram's public data
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.instagram.com/${username}/?__a=1&__d=dis`)}`

    const response = await fetch(proxyUrl)

    if (response.ok) {
      const data = await response.json()
      if (data.contents) {
        try {
          const instagramData = JSON.parse(data.contents)
          const user = instagramData.graphql?.user || instagramData.user

          if (user) {
            return {
              followers: user.edge_followed_by?.count || user.follower_count || 0,
              engagement: 0,
              verified: user.is_verified || false,
              username: user.username
            }
          }
        } catch (parseError) {
          console.error('Instagram parse error:', parseError)
        }
      }
    }
  } catch (error) {
    console.error('Instagram fetch error:', error)
  }
  return null
}

// Twitter/X - Using Syndication API (free, no auth)
async function fetchTwitterStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    const username = extractTwitterUsername(url)
    if (!username) return null

    // Try Twitter Syndication API (free, used by embedded tweets)
    const response = await fetch(`https://cdn.syndication.twimg.com/settings?screen_name=${username}`)

    if (response.ok) {
      const data = await response.json()
      if (data && data.followers_count !== undefined) {
        return {
          followers: data.followers_count || 0,
          engagement: 0,
          verified: data.verified || false,
          username: data.screen_name || username
        }
      }
    }
  } catch (error) {
    console.error('Twitter fetch error:', error)
  }
  return null
}

// Facebook - Scraping public page data
async function fetchFacebookStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    const pageId = extractFacebookPageId(url)
    if (!pageId) return null

    // Facebook requires scraping or Graph API - skipping for now
    console.log('Facebook requires Graph API token')
    return null
  } catch (error) {
    console.error('Facebook fetch error:', error)
  }
  return null
}

// LinkedIn - Requires API access
async function fetchLinkedInStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    // LinkedIn requires OAuth or scraping - skipping for now
    console.log('LinkedIn requires API token')
    return null
  } catch (error) {
    console.error('LinkedIn fetch error:', error)
  }
  return null
}

// TikTok - Using free scraper
async function fetchTikTokStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    const username = extractTikTokUsername(url)
    if (!username) return null

    // Using CORS proxy with TikTok's public API
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.tiktok.com/@${username}`)}`

    const response = await fetch(proxyUrl)

    if (response.ok) {
      const data = await response.json()
      if (data.contents) {
        // Try to extract follower count from page HTML
        const followerMatch = data.contents.match(/"followerCount":(\d+)/)
        if (followerMatch) {
          return {
            followers: parseInt(followerMatch[1], 10),
            engagement: 0,
            verified: false,
            username
          }
        }
      }
    }
  } catch (error) {
    console.error('TikTok fetch error:', error)
  }
  return null
}

// Threads - Using web scraping
async function fetchThreadsStats(url: string): Promise<SocialStatsResponse | null> {
  try {
    const username = extractThreadsUsername(url)
    if (!username) return null

    // Threads doesn't have a public API yet, would need web scraping
    console.log('Threads API not yet available')
    return null
  } catch (error) {
    console.error('Threads fetch error:', error)
  }
  return null
}

// Helper functions for URL extraction
function extractYouTubeChannelInfo(url: string): { type: 'channelId' | 'username' | 'handle', id: string } | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname

    const channelMatch = pathname.match(/\/channel\/([^\/\?]+)/)
    if (channelMatch) return { type: 'channelId', id: channelMatch[1] }

    const userMatch = pathname.match(/\/(user|c)\/([^\/\?]+)/)
    if (userMatch) return { type: 'username', id: userMatch[2] }

    const handleMatch = pathname.match(/\/@([^\/\?]+)/)
    if (handleMatch) return { type: 'handle', id: handleMatch[1] }

    return null
  } catch {
    return null
  }
}

function extractInstagramUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/([^\/\?]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extractTwitterUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const username = urlObj.pathname.replace(/^\//, '').split('/')[0]
    if (username && !['intent', 'i', 'home', 'explore', 'notifications'].includes(username)) {
      return username
    }
    return null
  } catch {
    return null
  }
}

function extractFacebookPageId(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const cleanPath = urlObj.pathname.replace(/^\/|\/$/g, '')
    const segments = cleanPath.split('/')
    return segments.length > 0 ? segments[0] : null
  } catch {
    return null
  }
}

function extractLinkedInCompanyName(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/company\/([^\/\?]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extractTikTokUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/@([^\/\?]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function extractThreadsUsername(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const match = urlObj.pathname.match(/\/@([^\/\?]+)/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function calculateYouTubeEngagement(stats: any): number {
  const views = parseInt(stats.viewCount || '0', 10)
  const subscribers = parseInt(stats.subscriberCount || '1', 10)
  if (subscribers === 0) return 0
  const viewsPerSub = views / subscribers
  return Math.min(5, Math.max(0.5, viewsPerSub * 0.1))
}

function calculateEngagementRate(posts: number, followers: number): number {
  if (followers === 0) return 0
  return Math.min(10, (posts / followers) * 100)
}
