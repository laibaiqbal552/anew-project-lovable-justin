# Social Media Followers Scraping - Complete Solutions Guide

## Problem Statement
ScrapAPI has limitations getting follower counts from social media platforms. This guide provides multiple alternative solutions with code examples and recommendations.

---

## Solution 1: Official Social Media APIs (Recommended)

### Best For: Reliability + Legal Compliance

#### YouTube Data API (Easiest)
✅ **Free**, ✅ **10,000 units/day**, ✅ **No approval needed**

**Setup:**
```bash
# 1. Go to Google Cloud Console
# 2. Enable YouTube Data API v3
# 3. Create API Key
# 4. Copy API key
```

**Implementation:**
```typescript
// supabase/functions/fetch-youtube-followers/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
          data: { subscribers: null, error: 'API key not configured' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    let finalChannelId = channelId

    // If username provided, search for channel ID
    if (!finalChannelId && channelUsername) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelUsername)}&key=${youtubeApiKey}`
      const searchRes = await fetch(searchUrl)
      const searchData = await searchRes.json()

      if (searchData.items && searchData.items.length > 0) {
        finalChannelId = searchData.items[0].id.channelId
      }
    }

    if (!finalChannelId) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { subscribers: null, error: 'Channel ID not found' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Get channel statistics
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${finalChannelId}&key=${youtubeApiKey}`
    const statsRes = await fetch(statsUrl)
    const statsData = await statsRes.json()

    const subscribers = statsData.items?.[0]?.statistics?.subscriberCount
    const viewCount = statsData.items?.[0]?.statistics?.viewCount
    const videoCount = statsData.items?.[0]?.statistics?.videoCount

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          platform: 'YouTube',
          subscribers: subscribers ? parseInt(subscribers) : null,
          viewCount: viewCount ? parseInt(viewCount) : null,
          videoCount: videoCount ? parseInt(videoCount) : null,
          source: 'YouTube API'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('YouTube API error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        data: { subscribers: null },
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

**Environment Setup:**
```bash
# Get API Key from Google Cloud Console
# Add to Supabase secrets:
YOUTUBE_API_KEY=your_api_key_here
```

**Cost:** Free (10,000 quota units/day)
**Rate Limit:** 100 requests/minute
**Reliability:** ⭐⭐⭐⭐⭐

---

#### GitHub API (Second Easiest)
✅ **Free**, ✅ **5,000/hour (authenticated)**, ✅ **No approval needed**

```typescript
// supabase/functions/fetch-github-followers/index.ts
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { username } = await req.json()
    const githubToken = Deno.env.get('GITHUB_TOKEN')

    if (!githubToken) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { followers: null, error: 'Token not configured' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const url = `https://api.github.com/users/${username}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          platform: 'GitHub',
          followers: data.followers,
          following: data.following,
          publicRepos: data.public_repos,
          source: 'GitHub API'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('GitHub API error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        data: { followers: null },
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

**Setup:**
```bash
# 1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
# 2. Generate new token with 'public_repo' scope
# 3. Add to Supabase secrets:
GITHUB_TOKEN=your_token_here
```

**Cost:** Free
**Rate Limit:** 5,000/hour (authenticated)
**Reliability:** ⭐⭐⭐⭐⭐

---

#### Twitter/X API v2 (Advanced)
⚠️ **Paid** ($100+/month minimum), **Requires application**

Not recommended for free/startup projects due to cost and approval process.

---

### Summary of Official APIs

| Platform | Free | Setup Time | Rate Limit | Approval |
|----------|------|-----------|-----------|----------|
| YouTube | ✅ 10k units/day | 15 min | 100 req/min | None |
| GitHub | ✅ 5k/hour | 10 min | 5k/hour | None |
| Instagram | ⚠️ Free* | 1-2 weeks | 200/hour | Required |
| TikTok | ⚠️ Free* | 2-4 weeks | Limited | Very restrictive |
| Twitter | ❌ $100+/month | 1-2 weeks | 100 reads | Required |
| Facebook | ✅ Free* | 15 min | 200/hour | None (for pages) |
| LinkedIn | ❌ Partners only | 4+ weeks | Limited | Very restrictive |

---

## Solution 2: Apify Scrapers (Recommended for Multi-Platform)

### Best For: Multiple platforms without official API access

**Free Tier:** $5 credit (~2,000 results)
**Cost:** $2.60 per 1,000 results or $49/month subscription

**Setup:**
```bash
# 1. Create account at apify.com
# 2. Go to Actors → Search "Instagram profile"
# 3. Get API token from Settings
# 4. Add to Supabase:
APIFY_API_TOKEN=your_token_here
```

**Implementation for Multiple Platforms:**
```typescript
// supabase/functions/fetch-social-followers-apify/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SocialProfile {
  platform: string
  username: string
  url: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profiles } = await req.json()
    const apifyToken = Deno.env.get('APIFY_API_TOKEN')

    if (!apifyToken) {
      return new Response(
        JSON.stringify({
          success: true,
          profiles: profiles.map((p: SocialProfile) => ({ ...p, followers: null })),
          error: 'Apify token not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const enrichedProfiles = await Promise.all(
      profiles.map((profile: SocialProfile) => fetchProfileData(profile, apifyToken))
    )

    return new Response(
      JSON.stringify({
        success: true,
        profiles: enrichedProfiles,
        totalFollowers: enrichedProfiles.reduce((sum, p) => sum + (p.followers || 0), 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Apify error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function fetchProfileData(profile: SocialProfile, token: string) {
  try {
    const platform = profile.platform.toLowerCase()

    let actorId = ''
    let input: any = {}

    // Map platform to Apify actor
    switch (platform) {
      case 'instagram':
        actorId = 'apify/instagram-profile-scraper'
        input = { usernames: [profile.username] }
        break
      case 'tiktok':
        actorId = 'apify/tiktok-profile-scraper'
        input = { usernames: [profile.username] }
        break
      case 'twitter':
      case 'x':
        actorId = 'apify/twitter-profile-scraper'
        input = { usernames: [profile.username] }
        break
      default:
        return { ...profile, followers: null }
    }

    // Call Apify API
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      }
    )

    const runData = await runResponse.json()

    if (!runData.data?.id) {
      throw new Error('Failed to start Apify run')
    }

    // Wait for run to complete (max 60 seconds)
    let attempts = 0
    while (attempts < 30) {
      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runData.data.id}?token=${token}`
      )
      const statusData = await statusResponse.json()

      if (statusData.data?.status === 'SUCCEEDED') {
        // Get results
        const resultsResponse = await fetch(
          `https://api.apify.com/v2/datasets/${statusData.data.defaultDatasetId}/items?token=${token}`
        )
        const results = await resultsResponse.json()

        if (results.length > 0) {
          const data = results[0]
          return {
            ...profile,
            followers: extractFollowers(data, platform),
            verified: data.isVerified || data.verified
          }
        }

        return { ...profile, followers: null }
      }

      if (statusData.data?.status === 'FAILED') {
        throw new Error(`Apify run failed: ${statusData.data.statusMessage}`)
      }

      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++
    }

    throw new Error('Apify run timeout')
  } catch (error) {
    console.warn(`Error fetching ${profile.platform}:`, error)
    return { ...profile, followers: null }
  }
}

function extractFollowers(data: any, platform: string): number | null {
  switch (platform) {
    case 'instagram':
      return data.followers_count || data.followersCount || null
    case 'tiktok':
      return data.followers || data.followerCount || null
    case 'twitter':
    case 'x':
      return data.followers_count || data.followersCount || null
    default:
      return null
  }
}
```

**Apify Actor IDs (2025):**
```
Instagram: apify/instagram-profile-scraper
TikTok: apify/tiktok-profile-scraper
Twitter/X: apify/twitter-profile-scraper
Facebook: apify/facebook-profile-scraper
LinkedIn: apify/linkedin-profile-scraper
YouTube: apify/youtube-profile-scraper
```

**Cost Calculation:**
- Instagram profile: $0.0026 per profile
- TikTok profile: $0.0013 per profile
- Twitter profile: $0.0013 per profile
- Free tier: $5 = ~2,000 profiles

**Reliability:** ⭐⭐⭐⭐

---

## Solution 3: RapidAPI Endpoints

### Best For: Quick integration without setup

**Setup:**
```bash
# 1. Create account at rapidapi.com
# 2. Search "social media followers" or specific platform
# 3. Copy API key from header
# 4. Add to Supabase:
RAPIDAPI_KEY=your_key_here
```

**Implementation:**
```typescript
// supabase/functions/fetch-social-rapidapi/index.ts
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { platform, username } = await req.json()
    const rapidapiKey = Deno.env.get('RAPIDAPI_KEY')

    if (!rapidapiKey) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { followers: null, error: 'API key not configured' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    let url = ''
    let host = ''

    // Different APIs for different platforms
    switch (platform.toLowerCase()) {
      case 'instagram':
        url = `https://instagram-data1.p.rapidapi.com/user/info/${username}`
        host = 'instagram-data1.p.rapidapi.com'
        break
      case 'tiktok':
        url = `https://tiktok-api7.p.rapidapi.com/user/info?username=${username}`
        host = 'tiktok-api7.p.rapidapi.com'
        break
      case 'twitter':
        url = `https://twitter-followers.p.rapidapi.com/profile/${username}`
        host = 'twitter-followers.p.rapidapi.com'
        break
      default:
        return new Response(
          JSON.stringify({
            success: true,
            data: { followers: null, error: 'Platform not supported' }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidapiKey,
        'X-RapidAPI-Host': host
      }
    })

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.statusText}`)
    }

    const data = await response.json()
    const followers = extractFollowersFromRapidAPI(data, platform)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          platform,
          username,
          followers,
          source: 'RapidAPI'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('RapidAPI error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

function extractFollowersFromRapidAPI(data: any, platform: string): number | null {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return data.followers_count || data.follower || null
    case 'tiktok':
      return data.followerCount || data.followers || null
    case 'twitter':
      return data.followers_count || data.followers || null
    default:
      return null
  }
}
```

**Popular RapidAPI Endpoints:**
- Instagram: instagram-data1 (~$0.001 per call)
- TikTok: tiktok-api7 (~$0.001 per call)
- Twitter: twitter-followers (~$0.001 per call)

**Cost:** ~$0.001 per call or $5-50/month subscription

**Reliability:** ⭐⭐⭐

---

## Solution 4: Browser-Based Extraction (Free but Limited)

### Best For: Personal use / testing

**Via Browser Console (Copy-Paste Ready):**
```javascript
// Instagram
const instagramFollowers = window._sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user?.edge_followed_by?.count;
console.log('Instagram Followers:', instagramFollowers);

// TikTok
const tiktokData = window.__UNIVERSAL_DATA_FOR_REHYDRATION__;
const tiktokFollowers = tiktokData?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo?.stats?.followerCount;
console.log('TikTok Followers:', tiktokFollowers);

// YouTube
const youtubeSubscribers = document.querySelector('#subscriber-count')?.textContent;
console.log('YouTube Subscribers:', youtubeSubscribers);
```

**Limitations:**
- Only works in browser (not server-side)
- Breaks when platforms update HTML/APIs
- Cannot automate (need manual copy-paste)
- Risk of account suspension if used at scale

**Use Case:** Quick manual checks only

---

## Recommended Solution Architecture

```
┌─────────────────────────────────────┐
│     Dashboard Social Media Card      │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
    ┌──▼──┐      ┌──────▼─────┐
    │ API │      │  Scraper    │
    └──┬──┘      └──────┬──────┘
       │                │
  ┌────┴────┐      ┌────┴────┐
  │ YouTube │      │  Apify   │
  │ GitHub  │      │RapidAPI  │
  │         │      │          │
  └────┬────┘      └────┬─────┘
       │                │
       └────────┬───────┘
                │
        ┌───────▼────────┐
        │ Display Results │
        └────────────────┘
```

---

## Recommended Implementation by Use Case

### Use Case 1: YouTube/GitHub Only
```typescript
// Use official APIs
Implement: fetch-youtube-followers + fetch-github-followers
Cost: Free
Time: 30 minutes
Reliability: ⭐⭐⭐⭐⭐
```

### Use Case 2: Instagram + TikTok + YouTube
```typescript
// Hybrid approach
Implement: fetch-youtube-followers (API) + fetch-social-apify (Apify)
Cost: Free + $5-50/month
Time: 2 hours
Reliability: ⭐⭐⭐⭐
```

### Use Case 3: All Major Platforms
```typescript
// Enterprise approach
Implement:
  - YouTube API
  - GitHub API
  - Apify for Instagram/TikTok
  - RapidAPI for Twitter
Cost: ~$50-100/month
Time: 4 hours
Reliability: ⭐⭐⭐⭐
```

### Use Case 4: Testing/Development
```typescript
// Just use browser console
Manual copy-paste from browser
Cost: Free
Time: 5 minutes
Reliability: ⭐⭐
```

---

## Step-by-Step Implementation

### Step 1: Choose Your Stack
Choose based on your use case above.

### Step 2: Set Up API Keys
For each service:
1. Create account
2. Get API key
3. Add to Supabase secrets

### Step 3: Deploy Edge Functions
```bash
supabase functions deploy fetch-youtube-followers --no-verify
supabase functions deploy fetch-github-followers --no-verify
# ... etc for others
```

### Step 4: Update Dashboard
Modify social media card to use new functions:
```typescript
// src/pages/Dashboard.tsx
const youtubeData = await fetchYoutubeFollowers(channelId)
const githubData = await fetchGithubFollowers(username)
// ... etc
```

### Step 5: Test
Run new analysis and verify data appears.

---

## Comparison Matrix

| Solution | Cost | Setup Time | Reliability | Scale |
|----------|------|-----------|------------|-------|
| **YouTube API** | Free | 15 min | ⭐⭐⭐⭐⭐ | Unlimited |
| **GitHub API** | Free | 10 min | ⭐⭐⭐⭐⭐ | Unlimited |
| **Apify** | $5-50/mo | 30 min | ⭐⭐⭐⭐ | 10k+/mo |
| **RapidAPI** | $5-50/mo | 20 min | ⭐⭐⭐ | 5k+/mo |
| **ScrapAPI** | $50/mo | 10 min | ⭐⭐⭐ | 500/mo |
| **Browser Console** | Free | 5 min | ⭐⭐ | <10 |

---

## Next Steps

1. **Choose your solution** from above
2. **Get API keys/tokens**
3. **Deploy edge functions** using code templates
4. **Add to Supabase secrets**
5. **Test with new analysis**
6. **Monitor usage** and adjust as needed

---

**Last Updated:** October 24, 2025
**Recommended:** YouTube + GitHub APIs + Apify (best balance)
