# Social Media Followers - Complete Deployment Guide

## Overview

This guide covers deploying the enhanced social media followers solution with official API integrations and intelligent fallback strategies.

---

## Edge Functions to Deploy

### 1. **fetch-unified-followers** (PRIORITY)
**Location:** `supabase/functions/fetch-unified-followers/index.ts`

**What it does:**
- Intelligently tries multiple strategies to fetch follower counts
- Priority 1: Official APIs (YouTube, GitHub)
- Priority 2: ScrapAPI (fallback for other platforms)
- Returns enriched profiles with follower counts and data source

**Required Environment Variables:**
- `SCRAPAPI_KEY` (already configured)
- `YOUTUBE_API_KEY` (needs to be set)
- `GITHUB_TOKEN` (optional, but recommended for higher rate limits)

**Deploy Command:**
```bash
supabase functions deploy fetch-unified-followers --no-verify-jwt
```

---

### 2. **fetch-youtube-followers** (OPTIONAL)
**Location:** `supabase/functions/fetch-youtube-followers/index.ts`

**What it does:**
- Fetches YouTube channel subscriber count via official YouTube Data API v3
- Can be used directly for YouTube-specific queries
- Returns subscribers, views, video count, and channel metadata

**Required Environment Variables:**
- `YOUTUBE_API_KEY`

**Setup YouTube API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "YouTube Data API v3"
4. Go to Credentials → Create API Key
5. Copy the API key to Supabase secrets as `YOUTUBE_API_KEY`

**Deploy Command:**
```bash
supabase functions deploy fetch-youtube-followers --no-verify-jwt
```

---

### 3. **fetch-github-followers** (OPTIONAL)
**Location:** `supabase/functions/fetch-github-followers/index.ts`

**What it does:**
- Fetches GitHub user follower count via official GitHub API v3
- Can be used directly for GitHub-specific queries
- Returns followers, following, public repos, and profile metadata

**Required Environment Variables:**
- `GITHUB_TOKEN` (optional, but recommended)

**Setup GitHub Token:**
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token"
3. Select scopes: `public_repo` (minimum required)
4. Copy the token to Supabase secrets as `GITHUB_TOKEN`

**Deploy Command:**
```bash
supabase functions deploy fetch-github-followers --no-verify-jwt
```

---

### 4. **fetch-trustpilot-reviews** (ALREADY DEPLOYED)
**Location:** `supabase/functions/fetch-trustpilot-reviews/index.ts`

- Already enhanced with multiple URL strategies
- Uses ScrapAPI for reliability
- Should already be deployed from previous session

---

### 5. **fetch-social-media-followers** (ALREADY DEPLOYED)
**Location:** `supabase/functions/fetch-social-media-followers/index.ts`

- Original ScrapAPI-based implementation
- Should already be deployed from previous session
- Can be replaced by fetch-unified-followers

---

## Deployment Steps

### Step 1: Set Environment Variables

Before deploying, ensure these variables are set in your Supabase project:

```bash
# Already set from previous session
SCRAPAPI_KEY=your_scrapapi_key

# Add these if not already set:
YOUTUBE_API_KEY=your_youtube_api_key
GITHUB_TOKEN=your_github_token (optional but recommended)
```

**To add via Supabase Dashboard:**
1. Go to Project Settings → Secrets
2. Add each key-value pair
3. The secrets are immediately available to edge functions

### Step 2: Deploy Functions

Run these commands in order (the `--no-verify-jwt` flag is the correct one):

```bash
# Priority 1: Deploy unified followers (uses YouTube + GitHub + ScrapAPI)
supabase functions deploy fetch-unified-followers --no-verify-jwt

# Optional: Deploy individual API functions for direct use
supabase functions deploy fetch-youtube-followers --no-verify-jwt
supabase functions deploy fetch-github-followers --no-verify-jwt

# Already deployed (no need to redeploy):
# supabase functions deploy fetch-trustpilot-reviews --no-verify-jwt
# supabase functions deploy fetch-social-media-followers --no-verify-jwt
```

### Step 3: Verify Deployments

Check that functions are deployed successfully:

```bash
supabase functions list
```

Expected output should show:
- ✓ fetch-unified-followers
- ✓ fetch-youtube-followers
- ✓ fetch-github-followers
- ✓ fetch-trustpilot-reviews
- ✓ fetch-social-media-followers

---

## Testing After Deployment

### Test 1: Verify YouTube API Works

```bash
curl -X POST https://your-project.supabase.co/functions/v1/fetch-youtube-followers \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "UCkRfArvrzheW2E7b6SVV1vA"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "subscribers": 145000,
    "views": 5000000,
    "videos": 250,
    "title": "Channel Name",
    "description": "...",
    "thumbnail": "..."
  }
}
```

### Test 2: Verify GitHub API Works

```bash
curl -X POST https://your-project.supabase.co/functions/v1/fetch-github-followers \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "torvalds"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "followers": 200000,
    "following": 0,
    "public_repos": 5,
    "name": "Linus Torvalds",
    "bio": "...",
    "avatar": "...",
    "company": null,
    "blog": ""
  }
}
```

### Test 3: Verify Unified Function Works

```bash
curl -X POST https://your-project.supabase.co/functions/v1/fetch-unified-followers \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "profiles": [
      {
        "platform": "youtube",
        "url": "https://youtube.com/@GoogleDevelopers"
      },
      {
        "platform": "github",
        "url": "https://github.com/torvalds"
      },
      {
        "platform": "twitter",
        "url": "https://twitter.com/google"
      }
    ]
  }'
```

Expected response:
```json
{
  "success": true,
  "profiles": [
    {
      "platform": "youtube",
      "url": "https://youtube.com/@GoogleDevelopers",
      "username": "GoogleDevelopers",
      "followers": 15000000,
      "source": "youtube-api"
    },
    {
      "platform": "github",
      "url": "https://github.com/torvalds",
      "username": "torvalds",
      "followers": 200000,
      "source": "github-api"
    },
    {
      "platform": "twitter",
      "url": "https://twitter.com/google",
      "username": "google",
      "followers": 4500000,
      "source": "scrapapi"
    }
  ],
  "totalFollowers": 19700000
}
```

---

## Integration with Dashboard

The `comprehensive-brand-analysis` edge function should be updated to use `fetch-unified-followers` instead of `fetch-social-media-followers` for better reliability.

### Current Flow (Old):
```
comprehensive-brand-analysis → fetch-social-media-followers (ScrapAPI only)
```

### New Flow (Recommended):
```
comprehensive-brand-analysis → fetch-unified-followers (YouTube/GitHub/ScrapAPI)
```

### Dashboard Changes Needed:

In `comprehensive-brand-analysis` function, update the social media follower fetch:

**Find this code:**
```typescript
const socialFollowers = await supabase.functions.invoke('fetch-social-media-followers', {
  body: { profiles: socialProfiles },
})
```

**Replace with:**
```typescript
const socialFollowers = await supabase.functions.invoke('fetch-unified-followers', {
  body: { profiles: socialProfiles },
})
```

---

## API Rate Limits

### YouTube API
- Free tier: 10,000 units/day
- Each channel fetch: ~4 units
- Allows ~2,500 requests/day

### GitHub API
- Without token: 60 requests/hour per IP
- With token: 5,000 requests/hour per user
- Recommended to use token

### ScrapAPI (Fallback)
- Varies by plan
- Set up in configuration

---

## Troubleshooting

### YouTube API returns error "API key not valid"
- Verify key is correct in Supabase secrets
- Check that YouTube Data API v3 is enabled in Google Cloud Console
- Allow 5 minutes for API key to be activated

### GitHub API returns 404 "Not Found"
- Verify the GitHub username is correct
- Check that the user profile is public

### Unified function returns no followers
- Check that at least `SCRAPAPI_KEY` is configured
- Verify profile URLs are valid and accessible
- Check function logs for errors

### Function timeouts
- Official APIs have 8-second timeout each
- ScrapAPI has 10-second timeout
- If experiencing timeouts, ensure internet connection is stable

---

## Security Notes

- All API keys should be stored as Supabase secrets, not in code
- YouTube Data API key is public (API keys are designed to be public)
- GitHub token can be restricted to `public_repo` scope only
- ScrapAPI key is private - never expose in client-side code

---

## Next Steps

1. Deploy `fetch-unified-followers` first (includes all strategies)
2. Set up YouTube API key if not already done
3. Test the unified function with a sample profile
4. Update `comprehensive-brand-analysis` to use unified function
5. Deploy and test end-to-end with the Dashboard

---

## File Locations

All new/modified files:
- `supabase/functions/fetch-unified-followers/index.ts` ← NEW & PRIORITY
- `supabase/functions/fetch-youtube-followers/index.ts` ← NEW
- `supabase/functions/fetch-github-followers/index.ts` ← NEW
- `supabase/functions/fetch-trustpilot-reviews/index.ts` (already deployed)
- `supabase/functions/fetch-social-media-followers/index.ts` (already deployed)

---

## Support

For issues or questions:
1. Check function logs in Supabase dashboard
2. Verify environment variables are set correctly
3. Test with curl commands above
4. Check that API credentials are still valid
