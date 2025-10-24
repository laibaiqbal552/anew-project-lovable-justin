# API Keys Setup Reference

Quick reference for setting up API keys needed for the new social media followers solution.

---

## YouTube API Key (Recommended)

### Why?
- Free tier with 10,000 units/day
- No approval needed
- Instant activation
- Most reliable for YouTube channels

### How to Get:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with Google account
3. Create a new project (if needed)
   - Click project dropdown at top
   - Click "NEW PROJECT"
   - Name: "Social Media Analytics" (or similar)
   - Click CREATE
4. Enable YouTube Data API v3
   - Search for "YouTube Data API v3" in search bar
   - Click result
   - Click ENABLE
5. Create API Key
   - Go to Credentials (left sidebar)
   - Click CREATE CREDENTIALS
   - Select "API Key"
   - Copy the key (it will be displayed)
6. Add to Supabase
   - Go to Supabase Dashboard
   - Project Settings → Secrets
   - Click "New Secret"
   - Name: `YOUTUBE_API_KEY`
   - Paste the key
   - Click "Add Secret"

### Testing:
```bash
curl "https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername=YouTube&key=YOUR_KEY"
```

Should return channel statistics in response.

---

## GitHub Token (Optional but Recommended)

### Why?
- Increases rate limits from 60/hour to 5,000/hour
- Fully free
- Very quick to set up

### How to Get:

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - Or: Click profile pic → Settings → Developer settings (left sidebar) → Personal access tokens → Tokens (classic)
2. Click "Generate new token" → "Generate new token (classic)"
3. Token name: `Social Media Analytics` (or similar)
4. Expiration: 90 days (or No expiration)
5. Select scopes:
   - ☑ `public_repo` (minimum needed)
   - ☑ `read:user` (for user info)
6. Click "Generate token"
7. Copy the token (it will only show once!)
8. Add to Supabase
   - Go to Supabase Dashboard
   - Project Settings → Secrets
   - Click "New Secret"
   - Name: `GITHUB_TOKEN`
   - Paste the token
   - Click "Add Secret"

### Testing:
```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

Should return your GitHub user info.

---

## ScrapAPI Key (Already Set)

You already have this configured: `SCRAPAPI_KEY`

This is used as fallback for platforms where official APIs aren't available.

---

## Environment Variables Summary

Here's what should be in Supabase Secrets:

| Variable | Status | Purpose |
|----------|--------|---------|
| `SCRAPAPI_KEY` | ✅ Already Set | Fallback for most platforms |
| `YOUTUBE_API_KEY` | ⏳ Needs Setup | YouTube channels (10k/day free) |
| `GITHUB_TOKEN` | ⏳ Optional | GitHub profiles (5k/hour with token) |

---

## Verification Checklist

- [ ] YOUTUBE_API_KEY added to Supabase Secrets
- [ ] GITHUB_TOKEN added to Supabase Secrets (optional)
- [ ] YouTube API v3 enabled in Google Cloud Console
- [ ] GitHub token has `public_repo` scope
- [ ] All edge functions deployed to Supabase

---

## Priority

1. **Must Deploy:** `fetch-unified-followers`
2. **Should Setup:** `YOUTUBE_API_KEY` (free, easy, very reliable)
3. **Can Setup:** `GITHUB_TOKEN` (optional, increases rate limits)

Even without YouTube/GitHub keys, the system works with ScrapAPI as fallback, but official APIs are more reliable.
