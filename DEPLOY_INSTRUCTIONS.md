# Deployment Instructions - Trustpilot & Social Media Fix

## Quick Deploy Guide

### Prerequisites ✓
- SCRAPAPI_KEY already set in Supabase secrets
- Supabase CLI installed
- git configured

### Step 1: Deploy Edge Functions (2 minutes)

```bash
cd supabase/functions

# Deploy improved Trustpilot function
supabase functions deploy fetch-trustpilot-reviews --no-verify

# Deploy new social media followers function
supabase functions deploy fetch-social-media-followers --no-verify
```

**Expected Output:**
```
✓ Function deployed successfully
  Endpoint: https://your-project.supabase.co/functions/v1/fetch-trustpilot-reviews
  Endpoint: https://your-project.supabase.co/functions/v1/fetch-social-media-followers
```

### Step 2: Verify Secrets (1 minute)

In Supabase Dashboard → Settings → Secrets:

```env
✓ SCRAPAPI_KEY=20d5ce4ba222fa7774076... (already set)
✓ SUPABASE_URL=bfae9be6fe28af2808ad... (already set)
✓ SUPABASE_SERVICE_ROLE=f63e65c43827bb... (already set)
```

### Step 3: Build & Push (2 minutes)

```bash
# Build the frontend
npm run build

# Push changes to git
git push origin main

# Deploy to your hosting (Vercel, Netlify, etc.)
# OR
# Docker/manual deployment
```

### Step 4: Test (5 minutes)

1. **Start a New Brand Analysis:**
   - Go to your app
   - Start a new analysis
   - Wait 2-3 minutes for completion

2. **Check Trustpilot Data:**
   - Navigate to Dashboard
   - Scroll to Trustpilot Reviews card
   - Should show:
     - ✓ Rating (e.g., 4.5/5)
     - ✓ Total reviews count
     - ✓ Latest reviews with titles

3. **Check Social Media Followers:**
   - Click "Detailed Data" tab
   - Scroll to "Social Media Followers" card
   - Should show:
     - ✓ Individual platforms (Instagram, Twitter, etc.)
     - ✓ Follower count for each
     - ✓ Total followers at bottom

4. **Check Reputation Card:**
   - Stay in "Detailed Data" tab
   - Look at "Reputation & Reviews" card
   - Should show:
     - ✓ Average Rating (from Trustpilot)
     - ✓ Total Reviews (Trustpilot badge)
     - ✓ Recent reviews preview (2 reviews)
     - ✓ Response Rate (if available)

## Rollback Plan

If issues occur:

```bash
# Revert to previous commit
git revert HEAD

# Or rollback specific function
supabase functions deploy fetch-trustpilot-reviews --version <previous-version>
```

## Troubleshooting

### Trustpilot Data Not Showing

**Check 1: Verify API Key**
```bash
# In Supabase Dashboard, verify:
SCRAPAPI_KEY is set and not empty
```

**Check 2: Verify Function Deployment**
```bash
# Go to Supabase → Edge Functions
# Click fetch-trustpilot-reviews
# Check Status = "Active"
```

**Check 3: Check Logs**
```bash
supabase functions list --no-verify
# Look for recent invocations
```

**Check 4: Manual Test**
```bash
# Try in browser console:
curl -X POST https://your-project.supabase.co/functions/v1/fetch-trustpilot-reviews \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Google","domain":"google.com"}'
```

### Social Media Followers Not Showing

**Check 1: Profiles Detected**
- Verify business has social media profiles
- Check that profiles are actual URLs (not empty)

**Check 2: ScrapAPI Working**
- Test manual scrape: https://api.scrapapi.com/status
- Verify SCRAPAPI_KEY is valid

**Check 3: Function Logs**
- Check Supabase function logs for errors
- Look for timeout messages (should be 15-25 seconds)

### Build Failed

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

## Performance Notes

- Trustpilot scraping: ~5-10 seconds per business
- Social media followers: ~15-25 seconds for multiple platforms
- Recommendation: Run analysis after business hours if concerned about speed

## Success Checklist

- [ ] Both edge functions deployed
- [ ] SCRAPAPI_KEY verified in secrets
- [ ] Build passes with no errors
- [ ] Deployed to production
- [ ] Ran brand analysis
- [ ] Trustpilot reviews show in Dashboard
- [ ] Social media followers show in Detailed Data
- [ ] Reputation card shows Trustpilot badge

## Files Modified in This Deploy

```
Modified:
  ✓ supabase/functions/fetch-trustpilot-reviews/index.ts
  ✓ src/pages/Dashboard.tsx

Created:
  ✓ supabase/functions/fetch-social-media-followers/index.ts

Documentation:
  ✓ TRUSTPILOT_SOCIAL_MEDIA_FIX.md
  ✓ DEPLOY_INSTRUCTIONS.md (this file)
```

## Commit Details

```
Commit: ba79c06
Message: Fix Trustpilot reviews display and implement social media followers scraping
Author: Claude Code
Date: October 24, 2025

Changes:
  4 files changed
  693 insertions(+)
  94 deletions(-)
```

## Support Contacts

For issues:
1. Check TRUSTPILOT_SOCIAL_MEDIA_FIX.md troubleshooting section
2. Review Supabase function logs
3. Check browser console for errors
4. Verify API keys in secrets

## FAQ

**Q: Do I need to update the database schema?**
A: No, uses existing `analysis_data` fields

**Q: Will this affect existing reports?**
A: No, only new analyses will have the updated data

**Q: Can I disable Trustpilot scraping?**
A: Yes, remove ScrapAPI key from secrets (it will gracefully fallback)

**Q: How long does analysis take now?**
A: Same as before, data fetching runs in parallel

**Q: Are there rate limits?**
A: ScrapAPI has rate limits, monitor usage in their dashboard

## Next Steps (Optional)

1. **Cache Data:** Add caching layer for follower data
2. **Schedule Refresh:** Auto-refresh follower counts weekly
3. **Analytics:** Track which platforms are most common
4. **Alerts:** Notify if Trustpilot rating drops significantly

---

**Last Updated:** October 24, 2025
**Status:** Ready for Production Deployment
**Estimated Deployment Time:** 10 minutes
