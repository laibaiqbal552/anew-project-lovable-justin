# Quick Start - Deploy Social Media Followers Functions

## For Your Colleague

This is a quick reference for deploying the new social media followers edge functions to Supabase.

---

## Prerequisites

- Access to Supabase project
- Supabase CLI installed
- Project authenticated: `supabase login`

---

## Step 1: Pull Latest Code

```bash
git pull origin main
```

This gets the three new edge functions:
- `supabase/functions/fetch-unified-followers/index.ts`
- `supabase/functions/fetch-youtube-followers/index.ts`
- `supabase/functions/fetch-github-followers/index.ts`

---

## Step 2: Verify Functions Exist

```bash
ls supabase/functions/fetch-*
```

You should see:
- ✅ fetch-github-followers/
- ✅ fetch-social-media-followers/ (existing)
- ✅ fetch-trustpilot-reviews/ (existing)
- ✅ fetch-unified-followers/
- ✅ fetch-youtube-followers/

---

## Step 3: Deploy Functions

```bash
# Priority 1: Deploy unified function (uses all three strategies)
supabase functions deploy fetch-unified-followers --no-verify-jwt

# Optional: Deploy individual API functions
supabase functions deploy fetch-youtube-followers --no-verify-jwt
supabase functions deploy fetch-github-followers --no-verify-jwt
```

Wait for each to complete (should say "Function pushed successfully").

---

## Step 4: Verify Deployment

```bash
supabase functions list
```

Expected output:
```
✓ fetch-github-followers
✓ fetch-social-media-followers
✓ fetch-trustpilot-reviews
✓ fetch-unified-followers
✓ fetch-youtube-followers
```

---

## Step 5: Set Environment Variables (if needed)

Go to Supabase Dashboard → Project Settings → Secrets

Verify these are set:
- ✅ `SCRAPAPI_KEY` (should already be set)
- ⏳ `YOUTUBE_API_KEY` (ask if this is set)
- ⏳ `GITHUB_TOKEN` (optional - ask if set)

If `YOUTUBE_API_KEY` or `GITHUB_TOKEN` are not set:
1. Ask to set them
2. See API_KEYS_SETUP_REFERENCE.md for setup instructions

---

## Step 6: Quick Test (Optional)

Test the unified function:

```bash
curl -X POST https://[YOUR_PROJECT].supabase.co/functions/v1/fetch-unified-followers \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
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
      }
    ]
  }'
```

Expected: JSON response with follower counts and sources.

---

## Troubleshooting

**Function not found after deploy?**
```bash
supabase functions list
# Wait a minute and try again
```

**Deployment fails with Docker error?**
```bash
supabase functions deploy fetch-unified-followers --use-api
# Use --use-api instead of Docker
```

**Still having issues?**
```bash
supabase functions deploy fetch-unified-followers --debug
# Get detailed error messages
```

---

## That's It!

Once deployed, the functions are live and ready to use.

The Dashboard will automatically use `fetch-unified-followers` for improved reliability.

---

## Files to Reference

If issues come up:
- `DEPLOYMENT_GUIDE_SOCIAL_MEDIA_SOLUTION.md` - Full deployment guide
- `API_KEYS_SETUP_REFERENCE.md` - API key setup (YouTube/GitHub)
- `IMPLEMENTATION_SUMMARY.md` - Architecture and overview

---

## Next Steps

1. ✅ Deploy functions (this guide)
2. ⏳ Set up API keys if not already done
3. ⏳ Update Dashboard integration (your developer)
4. ⏳ Test end-to-end with brand analysis

Done! Functions are now live and the system has intelligent fallback strategies for getting social media follower counts.
