import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface YouTubeChannelResponse {
  items?: Array<{
    statistics?: {
      subscriberCount?: string
      viewCount?: string
      videoCount?: string
    }
    snippet?: {
      title?: string
      description?: string
      thumbnails?: {
        medium?: {
          url?: string
        }
      }
    }
  }>
  error?: {
    message?: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { channelId, channelUsername } = await req.json()
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')

    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { subscribers: null, error: 'YouTube API key not configured' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (!channelId && !channelUsername) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Either channelId or channelUsername is required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    let queryParams = ''
    if (channelId) {
      queryParams = `id=${encodeURIComponent(channelId)}`
    } else if (channelUsername) {
      queryParams = `forUsername=${encodeURIComponent(channelUsername)}`
    }

    const url = `https://www.googleapis.com/youtube/v3/channels?${queryParams}&part=statistics,snippet&key=${youtubeApiKey}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    const data: YouTubeChannelResponse = await response.json()

    if (data.error) {
      console.error('YouTube API Error:', data.error.message)
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            subscribers: null,
            error: data.error.message || 'Failed to fetch YouTube channel data'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (!data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            subscribers: null,
            error: 'Channel not found'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const channel = data.items[0]
    const stats = channel.statistics
    const snippet = channel.snippet

    let subscribers: number | null = null
    if (stats?.subscriberCount && stats.subscriberCount !== 'unlisted') {
      subscribers = parseInt(stats.subscriberCount, 10)
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          subscribers,
          views: stats?.viewCount ? parseInt(stats.viewCount, 10) : null,
          videos: stats?.videoCount ? parseInt(stats.videoCount, 10) : null,
          title: snippet?.title,
          description: snippet?.description,
          thumbnail: snippet?.thumbnails?.medium?.url,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in fetch-youtube-followers:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
