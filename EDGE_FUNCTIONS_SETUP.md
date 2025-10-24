# Edge Functions Setup Guide

## Problem
The Reviews tab appears empty because the edge functions need API keys to be configured in **Supabase Secrets**, not just in .env.local.

## Solution

### Step 1: Set Supabase Secrets

You need to add your API keys to Supabase's edge function secrets. Run these commands:

```bash
# Login to Supabase
supabase login

# Set the secrets for your project
supabase secrets set GOOGLE_MAPS_API_KEY="AIzaSyDDRTkUpoZLqZfkEobu_HV-B_efTEwYg0c"
supabase secrets set SCRAPAPI_KEY="bdc9e397a220abac026a6568adf4e168f0a4ea6f220fc16ed152da93e38277d2"
supabase secrets set PAGESPEED_API_KEY="AIzaSyB2ystTLit3rUhyiFx1VocCZNTbhDeWEEk"
supabase secrets set SEMRUSH_API_KEY="e9a5541ce20bf2d487b7139e61fc4cd3"
```

### Step 2: Deploy Edge Functions

Deploy all the edge functions to your Supabase project:

```bash
# Deploy comprehensive-brand-analysis function
supabase functions deploy comprehensive-brand-analysis

# Deploy supporting functions (if not already deployed)
supabase functions deploy fetch-google-reviews
supabase functions deploy fetch-trustpilot-reviews
supabase functions deploy analyze-competitors
supabase functions deploy fetch-social-media-metrics
supabase functions deploy pagespeed-analyzer
supabase functions deploy semrush-analyzer
```

### Step 3: Verify Secrets in Supabase Dashboard

1. Go to https://app.supabase.com/project/kpqpswkalqbtbviogmcz
2. Navigate to: **Settings → Edge Functions → Secrets**
3. Verify all 4 secrets are listed:
   - GOOGLE_MAPS_API_KEY ✅
   - SCRAPAPI_KEY ✅
   - PAGESPEED_API_KEY ✅
   - SEMRUSH_API_KEY ✅

### Step 4: Test the Integration

1. In your app, go to the Analysis page
2. Run a new brand analysis
3. After analysis completes, go to Dashboard → Reviews tab
4. You should now see:
   - Google Reviews section with real business data
   - Trustpilot section with reviews
   - Competitor Analysis showing top 3 competitors

### Troubleshooting

If the Reviews tab is still empty:

1. **Check edge function logs:**
   ```bash
   supabase functions list
   # Copy function ID and check logs
   supabase functions download comprehensive-brand-analysis
   ```

2. **Verify API keys work:**
   - Test Google Maps API: https://developers.google.com/maps/documentation/places/web-service/search
   - Test ScrapAPI: https://www.scrapapi.com/documentation

3. **Check browser console:**
   - Open DevTools (F12) in your browser
   - Go to Console tab
   - Look for error messages starting with "❌" or "Error"

4. **Check function response:**
   - In DevTools, go to Network tab
   - Run an analysis
   - Look for requests to "comprehensive-brand-analysis"
   - Click on the response to see what the function returned

### Alternative: If You Can't Deploy Edge Functions

If deployment isn't possible, the app will gracefully degrade to use AI-sourced data (Perplexity mode) instead of live APIs. The data quality will be lower but the app will still function.

Current status: **API Keys provided but edge functions not yet deployed to Supabase**
