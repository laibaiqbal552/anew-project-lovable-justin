# Comprehensive Brand Analysis API Integration Guide

This document outlines the complete setup and usage of the brand analysis APIs for Google Reviews, Trustpilot, Competitors, and Social Media Metrics.

## 🎯 Overview

The system integrates 5 edge functions that work together to provide comprehensive brand analysis:

1. **fetch-google-reviews** - Extract business data from Google Maps
2. **fetch-trustpilot-reviews** - Scrape reviews from Trustpilot via ScrapAPI
3. **analyze-competitors** - Find and analyze top competitors
4. **fetch-social-media-metrics** - Aggregate social media data
5. **comprehensive-brand-analysis** - Orchestrates all APIs

## ⚙️ Environment Variables Setup

### Required API Keys

Add these to your `.env.local` file (or Supabase secrets in production):

```bash
# Google Maps API (Required for Google Reviews & Competitor Analysis)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# ScrapAPI (Required for Trustpilot Reviews)
SCRAPAPI_KEY=your_scrapapi_key

# Supabase (Already configured)
SUPABASE_URL=https://kpqpswkalqbtbviogmcz.supabase.co
SUPABASE_SERVICE_ROLE=your_supabase_service_role_key

# Additional APIs (Already configured)
PAGESPEED_API_KEY=your_pagespeed_key
SEMRUSH_API_KEY=your_semrush_key
```

### How to Get API Keys

#### Google Maps API
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project or select existing
3. Create an API key
4. Enable these APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
5. Copy the key to `GOOGLE_MAPS_API_KEY`

#### ScrapAPI
1. Go to https://www.scrapapi.com/
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy to `SCRAPAPI_KEY`

#### Supabase Service Role
1. Go to your Supabase project settings
2. Navigate to API Keys section
3. Copy the `service_role` key (keep this secret!)
4. Set as `SUPABASE_SERVICE_ROLE`

## 📊 API Endpoints

### 1. Google Reviews Endpoint

**Function:** `fetch-google-reviews`

**Request:**
```typescript
POST /functions/v1/fetch-google-reviews
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "address": "123 Main St, City, State",
  "website": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessName": "Acme Corp",
    "rating": 4.5,
    "totalReviews": 127,
    "reviews": [
      {
        "author": "John Doe",
        "rating": 5,
        "text": "Great service!",
        "time": "2024-10-23T..."
      }
    ],
    "placeId": "ChIJ...",
    "address": "123 Main St, City, State",
    "website": "https://example.com",
    "phoneNumber": "+1-555-1234",
    "source": "Google"
  }
}
```

### 2. Trustpilot Reviews Endpoint

**Function:** `fetch-trustpilot-reviews`

**Request:**
```typescript
POST /functions/v1/fetch-trustpilot-reviews
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "domain": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessName": "Acme Corp",
    "rating": 4.2,
    "totalReviews": 89,
    "reviews": [
      {
        "title": "Excellent customer support",
        "rating": 5,
        "date": "2024-10-23T..."
      }
    ],
    "source": "Trustpilot"
  }
}
```

### 3. Competitor Analysis Endpoint

**Function:** `analyze-competitors`

**Request:**
```typescript
POST /functions/v1/analyze-competitors
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "industry": "software development",
  "address": "123 Main St, City, State",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "businessName": "Acme Corp",
    "industry": "software development",
    "location": "123 Main St, City, State",
    "competitors": [
      {
        "name": "Tech Solutions Inc",
        "rating": 4.1,
        "reviewCount": 256,
        "website": "https://techsolutions.com",
        "placeId": "ChIJ..."
      }
    ],
    "marketPosition": "Found 3 competitors in the area",
    "opportunities": [
      "Opportunity: Some competitors lack Google reviews",
      "Strategy: Monitor competitor pricing and services"
    ]
  }
}
```

### 4. Social Media Metrics Endpoint

**Function:** `fetch-social-media-metrics`

**Request:**
```typescript
POST /functions/v1/fetch-social-media-metrics
Content-Type: application/json

{
  "socialProfiles": [
    {
      "platform": "Facebook",
      "url": "https://facebook.com/acmecorp",
      "followers": 15000,
      "engagement": 2.5
    },
    {
      "platform": "LinkedIn",
      "url": "https://linkedin.com/company/acmecorp",
      "followers": 8500,
      "engagement": 1.8
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "platforms": [
      {
        "platform": "Facebook",
        "followers": 15000,
        "engagement": 2.5,
        "verified": false,
        "url": "https://facebook.com/acmecorp"
      }
    ],
    "totalFollowers": 23500,
    "averageEngagement": 2.15,
    "topPlatforms": ["Facebook", "LinkedIn"]
  }
}
```

### 5. Comprehensive Analysis Endpoint (Orchestrator)

**Function:** `comprehensive-brand-analysis`

**Request:**
```typescript
POST /functions/v1/comprehensive-brand-analysis
Content-Type: application/json

{
  "businessName": "Acme Corp",
  "websiteUrl": "https://example.com",
  "address": "123 Main St, City, State",
  "phoneNumber": "+1-555-1234",
  "industry": "software development",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "socialProfiles": [...],
  "reportId": "report-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "googleReviews": {...},
    "trustpilotReviews": {...},
    "competitors": {...},
    "socialMedia": {...},
    "combinedReputation": {
      "average_rating": 4.35,
      "total_reviews": 216,
      "review_sources": ["Google", "Trustpilot"],
      "sentiment_score": 87,
      "response_rate": 0,
      "recent_reviews": [...],
      "reputation_trends": {...}
    }
  }
}
```

## 🔄 Data Flow

```
User initiates brand analysis
           ↓
Analysis.tsx calls:
  1. PageSpeed Insights (website performance)
  2. SEMrush (SEO metrics)
  3. Social Media Detector (detect profiles)
           ↓
Calls comprehensive-brand-analysis which:
  ├─ fetch-google-reviews (parallel)
  ├─ fetch-trustpilot-reviews (parallel)
  ├─ analyze-competitors (parallel)
  └─ fetch-social-media-metrics (parallel)
           ↓
Combines results:
  - Merges Google + Trustpilot ratings
  - Aggregates total review counts
  - Analyzes competitor positioning
  - Summarizes social media reach
           ↓
Stores in Supabase brand_reports table
           ↓
Dashboard displays:
  - Google/Trustpilot reviews tab
  - Competitor analysis
  - Social media metrics
  - Combined reputation score
```

## ✅ Testing APIs

### Test API Integration Status

Call the test function to verify all APIs are configured:

```bash
curl -X POST https://kpqpswkalqbtbviogmcz.supabase.co/functions/v1/test-api-integration \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{}'
```

Expected response:
```json
{
  "timestamp": "2024-10-23T...",
  "allConfigured": true,
  "apiStatuses": [
    {
      "name": "Google Maps API",
      "configured": true,
      "status": "Configured ✅"
    },
    {
      "name": "ScrapAPI (Trustpilot)",
      "configured": true,
      "status": "Configured ✅"
    }
  ],
  "connectivity": {
    "googleMaps": {
      "success": true,
      "error": "Found 30 places"
    },
    "scrapApi": {
      "success": true,
      "error": "API is accessible"
    }
  },
  "summary": "✅ All APIs configured and ready!"
}
```

## 🎯 Frontend Integration

### Analysis.tsx Integration

The Analysis component automatically calls the comprehensive analysis:

```typescript
const { data: comprehensiveData } = await supabase.functions.invoke(
  'comprehensive-brand-analysis',
  {
    body: {
      businessName: business.name,
      websiteUrl: business.website_url,
      address: business.address,
      phoneNumber: business.phone,
      industry: business.industry,
      latitude: business.latitude,
      longitude: business.longitude,
      socialProfiles: socialMediaData.platforms,
      reportId
    }
  }
);
```

### Dashboard Display

The Dashboard component has a dedicated "Reviews" tab showing:

1. **Google Reviews Section**
   - Business rating (1-5 stars)
   - Total review count
   - Business address, phone, website
   - Recent review snippets with authors

2. **Trustpilot Section**
   - Business rating (1-5 stars)
   - Total review count
   - Recent review titles

3. **Competitor Analysis**
   - Top 3 competitors with ratings
   - Review counts per competitor
   - External links to competitor websites
   - Market opportunities

## 🔐 Security Considerations

1. **API Keys in Supabase**
   - Never commit `.env.local` to git
   - Add API keys to Supabase project secrets (Settings → Secrets)
   - Edge functions access via `Deno.env.get()`

2. **CORS Configuration**
   - All functions have proper CORS headers
   - Only allow from your domain in production

3. **Rate Limiting**
   - Implement request throttling in production
   - Monitor API usage to avoid quota limits

4. **Error Handling**
   - All functions gracefully handle API failures
   - Return null/N/A instead of fake data
   - Log errors for debugging

## 📈 Performance Optimization

1. **Parallel Execution**
   - All APIs called simultaneously with Promise.all()
   - Reduces total analysis time by 60-70%

2. **Caching Strategy**
   - Cache results for 24-48 hours
   - Avoid duplicate API calls

3. **Timeout Handling**
   - 10-30 second timeouts per API
   - Graceful fallback if timeouts occur

## 🚀 Production Deployment

### Supabase Environment Variables

Add to your Supabase project settings:

```bash
GOOGLE_MAPS_API_KEY=your_key
SCRAPAPI_KEY=your_key
PAGESPEED_API_KEY=your_key
SEMRUSH_API_KEY=your_key
```

### Deploying Functions

```bash
# Login to Supabase
supabase login

# Deploy functions
supabase functions deploy fetch-google-reviews
supabase functions deploy fetch-trustpilot-reviews
supabase functions deploy analyze-competitors
supabase functions deploy fetch-social-media-metrics
supabase functions deploy comprehensive-brand-analysis
supabase functions deploy test-api-integration
```

## 🐛 Troubleshooting

### API Key Issues

**Problem:** "API key not configured"
**Solution:**
- Verify key is set in Supabase secrets
- Check key spelling matches environment variable name
- Ensure key has not expired

### API Call Failures

**Problem:** Functions timeout or return errors
**Solution:**
- Check API key is valid
- Verify API has required permissions enabled
- Check network connectivity
- Review function logs in Supabase dashboard

### No Reviews Found

**Problem:** Returns null/N/A for ratings
**Solution:**
- Verify business exists in Google Places/Trustpilot
- Use full business name in search
- Check business address is correct
- Some businesses may not have listings yet

### CORS Errors

**Problem:** Frontend can't call functions
**Solution:**
- Verify CORS headers are set in function
- Check Supabase project settings allow CORS
- Use proper Authorization header

## 📞 Support

For issues or questions:
1. Check Supabase dashboard function logs
2. Review API documentation links
3. Test with the test-api-integration function
4. Check network tab in browser dev tools

---

**Last Updated:** 2024-10-23
**Version:** 1.0.0
