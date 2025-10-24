import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface GitHubUserResponse {
  followers?: number
  following?: number
  public_repos?: number
  name?: string
  bio?: string
  avatar_url?: string
  company?: string
  blog?: string
  message?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username } = await req.json()
    const githubToken = Deno.env.get('GITHUB_TOKEN')

    if (!username) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GitHub username is required'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Supabase-Function',
    }

    // Add auth token if available for higher rate limits (5000/hour vs 60/hour)
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`
    }

    const url = `https://api.github.com/users/${encodeURIComponent(username)}`

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    const data: GitHubUserResponse = await response.json()

    if (data.message) {
      if (data.message.includes('Not Found')) {
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              followers: null,
              error: 'GitHub user not found'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      } else {
        console.error('GitHub API Error:', data.message)
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              followers: null,
              error: data.message || 'Failed to fetch GitHub user data'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          followers: data.followers ?? null,
          following: data.following ?? null,
          public_repos: data.public_repos ?? null,
          name: data.name,
          bio: data.bio,
          avatar: data.avatar_url,
          company: data.company,
          blog: data.blog,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in fetch-github-followers:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
