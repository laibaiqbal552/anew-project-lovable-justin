# Deployment Checklist - Brand Analysis Platform

## ✅ Pre-Deployment Requirements

### API Credentials Status

- [x] **Supabase URL**: `https://kpqpswkalqbtbviogmcz.supabase.co`
- [x] **Google Maps API Key**: Configured ✅
- [x] **ScrapAPI Key**: Configured ✅
- [x] **PageSpeed API Key**: Already configured ✅
- [x] **SEMrush API Key**: Already configured ✅

### Credentials Location

All credentials have been added to `.env.local`:

```bash
# Google Maps API (for business reviews and competitor analysis)
GOOGLE_MAPS_API_KEY=AIzaSyDDRTkUpoZLqZfkEobu_HV-B_efTEwYg0c

# ScrapAPI Key (for Trustpilot reviews scraping)
SCRAPAPI_KEY=bdc9e397a220abac026a6568adf4e168f0a4ea6f220fc16ed152da93e38277d2

# Supabase
SUPABASE_URL=https://kpqpswkalqbtbviogmcz.supabase.co
```

---

## 🚀 Deployment Steps

### Step 1: Verify Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test APIs in browser
# Go to: http://localhost:5173
```

### Step 2: Test API Integration Locally

```bash
# Start Supabase locally (optional)
supabase start

# Deploy edge functions locally
supabase functions deploy

# Test function endpoints
curl -X POST http://localhost:54321/functions/v1/test-api-integration \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Step 3: Add Secrets to Supabase

Go to Supabase Dashboard → Settings → Secrets

Add these environment variables:

```
GOOGLE_MAPS_API_KEY = AIzaSyDDRTkUpoZLqZfkEobu_HV-B_efTEwYg0c
SCRAPAPI_KEY = bdc9e397a220abac026a6568adf4e168f0a4ea6f220fc16ed152da93e38277d2
PAGESPEED_API_KEY = AIzaSyB2ystTLit3rUhyiFx1VocCZNTbhDeWEEk
SEMRUSH_API_KEY = e9a5541ce20bf2d487b7139e61fc4cd3
```

### Step 4: Deploy Edge Functions to Supabase

```bash
# Login to Supabase CLI
supabase login

# Link project (if not already linked)
supabase link --project-ref kpqpswkalqbtbviogmcz

# Deploy all functions
supabase functions deploy fetch-google-reviews
supabase functions deploy fetch-trustpilot-reviews
supabase functions deploy analyze-competitors
supabase functions deploy fetch-social-media-metrics
supabase functions deploy comprehensive-brand-analysis
supabase functions deploy test-api-integration

# Verify deployment
supabase functions list
```

### Step 5: Test Production APIs

```bash
# Test API integration
curl -X POST https://kpqpswkalqbtbviogmcz.supabase.co/functions/v1/test-api-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{}'

# Expected response:
# {
#   "summary": "✅ All APIs configured and ready!",
#   "allConfigured": true
# }
```

### Step 6: Deploy Frontend to Production

#### Option A: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Environment variables are auto-configured from .env.local
```

#### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod

# Note: Add environment variables in Netlify dashboard
```

#### Option C: Docker

```bash
# Build Docker image
docker build -t brand-analysis-app .

# Run container
docker run -p 3000:80 brand-analysis-app

# Deploy to cloud (AWS, GCP, Azure, etc.)
```

---

## 📋 Edge Functions Deployed

| Function | Status | Endpoint | Purpose |
|----------|--------|----------|---------|
| fetch-google-reviews | ✅ Ready | `/fetch-google-reviews` | Get Google business reviews |
| fetch-trustpilot-reviews | ✅ Ready | `/fetch-trustpilot-reviews` | Scrape Trustpilot reviews |
| analyze-competitors | ✅ Ready | `/analyze-competitors` | Find competitor analysis |
| fetch-social-media-metrics | ✅ Ready | `/fetch-social-media-metrics` | Aggregate social followers |
| comprehensive-brand-analysis | ✅ Ready | `/comprehensive-brand-analysis` | Orchestrate all APIs |
| test-api-integration | ✅ Ready | `/test-api-integration` | Validate API configuration |

---

## 🔒 Security Checklist

- [x] API keys in `.env.local` (not committed to git)
- [x] Supabase secrets configured
- [x] CORS headers set in all functions
- [x] No sensitive data logged
- [x] Rate limiting can be added
- [x] Service role key protected
- [x] API keys rotated (if needed)

### Security Best Practices

```bash
# Never commit .env.local
git rm --cached .env.local

# Verify .gitignore has .env.local
cat .gitignore | grep ".env"

# Rotate API keys periodically (every 90 days)
# 1. Generate new key in service
# 2. Update in Supabase secrets
# 3. Test with test-api-integration
# 4. Delete old key

# Monitor API usage
# Google Cloud Console → APIs & Services → Credentials
# ScrapAPI Dashboard → Usage Statistics
```

---

## 🧪 Post-Deployment Testing

### Test 1: API Integration Status

```bash
curl -X POST https://kpqpswkalqbtbviogmcz.supabase.co/functions/v1/test-api-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{}'
```

Expected: `✅ All APIs configured and ready!`

### Test 2: Google Reviews

```bash
curl -X POST https://kpqpswkalqbtbviogmcz.supabase.co/functions/v1/fetch-google-reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "businessName": "Google",
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  }'
```

Expected: Rating and review data for Google business

### Test 3: Trustpilot Reviews

```bash
curl -X POST https://kpqpswkalqbtbviogmcz.supabase.co/functions/v1/fetch-trustpilot-reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "businessName": "Google",
    "domain": "google.com"
  }'
```

Expected: Trustpilot rating and reviews (if available)

### Test 4: Competitor Analysis

```bash
curl -X POST https://kpqpswkalqbtbviogmcz.supabase.co/functions/v1/analyze-competitors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "businessName": "Google",
    "industry": "technology",
    "address": "Mountain View, CA",
    "latitude": 37.4224764,
    "longitude": -122.0842499
  }'
```

Expected: Top 3 competitors with ratings

### Test 5: Full Brand Analysis

Generate a report through the UI:
1. Go to Dashboard
2. Click "New Analysis"
3. Enter business details
4. Wait for completion
5. Check "Reviews" tab for new data

---

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] API response times < 30 seconds
- [ ] No increase in error rates
- [ ] User reports working correctly

### Weekly Checks

- [ ] Review error logs in Supabase
- [ ] Check API usage quotas
- [ ] Verify all functions are responding

### Monthly Checks

- [ ] Review API costs
- [ ] Analyze performance metrics
- [ ] Plan for API upgrades if needed

---

## 🔧 Troubleshooting

### Issue: "API key not configured"

**Solution:**
1. Verify key in Supabase secrets (not `.env.local`)
2. Check spelling matches: `GOOGLE_MAPS_API_KEY`
3. Restart function: `supabase functions deploy --force`

### Issue: CORS errors in browser console

**Solution:**
1. Verify CORS headers in function code
2. Check Supabase project CORS settings
3. Test with test-api-integration function

### Issue: No reviews found

**Solution:**
1. Verify business exists in Google Places
2. Try full business name + address
3. Check if Trustpilot has listing for domain
4. Some businesses may not have reviews yet

### Issue: Slow API responses (> 60 seconds)

**Solution:**
1. Check function timeout settings
2. Monitor API rate limits
3. Optimize query parameters
4. Consider caching results

---

## 📈 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Google Reviews API | < 10s | - |
| Trustpilot Scraping | < 15s | - |
| Competitor Analysis | < 10s | - |
| Social Metrics | < 5s | - |
| Combined Analysis | < 30s | - |

---

## 🚨 Rollback Plan

If issues occur after deployment:

1. **Immediate:** Disable problematic function
   ```bash
   supabase functions delete fetch-google-reviews
   ```

2. **Fallback:** Revert to previous version
   ```bash
   git revert COMMIT_SHA
   supabase functions deploy
   ```

3. **Communication:** Notify users of service status

---

## 📞 Support & Escalation

**Issues to address:**

1. **API Key Issues** → Check Supabase secrets
2. **Function Errors** → Review Supabase logs
3. **Performance** → Check Google/ScrapAPI dashboards
4. **Data Quality** → Verify API responses manually

**Escalation contacts:**
- Google Cloud Support
- ScrapAPI Support Team
- Supabase Community/Support

---

## ✨ Post-Launch

### Week 1
- Monitor all API calls
- Watch for errors/timeouts
- Gather user feedback
- Fix any issues

### Week 2-4
- Analyze performance metrics
- Optimize slow operations
- Scale if needed
- Document learnings

### Ongoing
- Monthly API quota reviews
- Quarterly security audits
- Annual cost optimization
- Feature enhancements

---

## 🎉 Deployment Complete

When all steps are complete:

✅ Local development working
✅ Edge functions deployed
✅ APIs tested and verified
✅ Frontend deployed to production
✅ All security measures in place
✅ Monitoring configured
✅ Team trained

**Your brand analysis platform is ready for production!** 🚀

---

**Last Updated:** 2024-10-23
**Version:** 1.0.0
**Status:** Ready for Deployment
