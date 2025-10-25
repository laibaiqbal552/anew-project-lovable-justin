# SerpAPI Instagram & Facebook Followers Integration Plan

## Overview

Using SerpAPI to fetch Instagram and Facebook follower counts and display them in three key locations:
1. **Step 2 of /connect page** - During analysis with live progress
2. **/connect page summary** - After Step 2 completes with total followers
3. **Reports page Social Media card** - Detailed breakdown with totals

---

## What is SerpAPI?

**SerpAPI** is a web scraping API that extracts public data from social media platforms without needing official API approvals.

### Benefits:
- ✅ No app approval needed (unlike Instagram/Facebook official APIs)
- ✅ Works immediately with API key
- ✅ Scrapes public profile data (followers, engagement, etc.)
- ✅ Very fast and reliable
- ✅ Affordable pricing

### Supported Engines:
- `instagram_user` - Get Instagram profile data including followers
- `facebook_user` - Get Facebook page data including followers

---

## Implementation Plan

### 1. Edge Function: fetch-serpapi-followers

**File:** `supabase/functions/fetch-serpapi-followers/index.ts`

**What it does:**
- Takes array of social media profiles (Instagram/Facebook URLs)
- Extracts username from URL
- Calls SerpAPI for each profile
- Returns follower counts

**Input:**
```typescript
{
  profiles: [
    {
      platform: "instagram",
      url: "https://instagram.com/username"
    },
    {
      platform: "facebook",
      url: "https://facebook.com/pagename"
    }
  ]
}
```

**Output:**
```typescript
{
  success: true,
  profiles: [
    {
      platform: "instagram",
      url: "https://instagram.com/username",
      username: "username",
      followers: 150000,
      source: "serpapi"
    },
    {
      platform: "facebook",
      url: "https://facebook.com/pagename",
      username: "pagename",
      followers: 250000,
      source: "serpapi"
    }
  ],
  totalFollowers: 400000
}
```

**Status:** ✅ CREATED (Ready to deploy)

---

## Display Locations

### Location 1: /connect Page - Step 2 Analysis

**When:** During brand analysis Step 2 (fetching social media data)

**What to show:**
```
┌─────────────────────────────────────────────┐
│ Step 2: Gathering Social Media Data...      │
├─────────────────────────────────────────────┤
│                                             │
│ 📱 Instagram: @username                     │
│   └─ 150,000 followers ✓                    │
│                                             │
│ 👍 Facebook: Page Name                      │
│   └─ 250,000 followers ✓                    │
│                                             │
│ 🐦 Twitter: @handle                         │
│   └─ Checking...                            │
│                                             │
└─────────────────────────────────────────────┘
```

**Implementation:**
- Show as list of detected platforms
- Display follower count as it loads
- Use checkmark (✓) when data obtained
- Show "Checking..." while loading
- Show error message if failed

---

### Location 2: /connect Page - Summary Card (After Step 2)

**When:** After Step 2 completes

**What to show:**
```
┌─────────────────────────────────────────────┐
│ 📊 Social Media Summary                     │
├─────────────────────────────────────────────┤
│                                             │
│ Total Followers Across All Platforms:      │
│ ┌─────────────────────────────────┐        │
│ │         400,000                 │        │
│ │      Live Data Badge            │        │
│ └─────────────────────────────────┘        │
│                                             │
│ Breakdown:                                  │
│ • Instagram:  150,000 followers            │
│ • Facebook:   250,000 followers            │
│ • Twitter:    [Not detected]               │
│                                             │
└─────────────────────────────────────────────┘
```

**Implementation:**
- Show big total number prominently
- "Live Data" badge indicating real API data
- Breakdown by platform below
- Formatted numbers with commas (150,000)
- Show "Not detected" if profile not found

---

### Location 3: Reports Page - Social Media Card

**Where:** The existing "Social Media" card on reports page (6 cards total)

**Current state:** Shows "Engagement, Followers, Consistency"

**Updated to show:**

```
┌────────────────────────────────────────────────┐
│ 📱 Social Media                                │
│ Engagement, Followers, Consistency            │
├────────────────────────────────────────────────┤
│                                                │
│ Total Followers: 400,000        [Live Data]   │
│                                                │
│ Platform Breakdown:                            │
│ ├─ Instagram: 150,000 followers               │
│ ├─ Facebook:  250,000 followers               │
│ ├─ Twitter:   Not detected                    │
│ └─ LinkedIn:  Not detected                    │
│                                                │
│ Engagement Rate:                               │
│ ├─ Instagram: 4.2%                            │
│ ├─ Facebook:  2.8%                            │
│ └─ Twitter:   N/A                             │
│                                                │
│ Consistency:                                   │
│ ├─ Posting Frequency: 3x/week                 │
│ ├─ Engagement Trend: ↑ Increasing             │
│ └─ Follower Growth: +5% (30 days)             │
│                                                │
└────────────────────────────────────────────────┘
```

**Implementation:**
- Show total followers prominently at top
- List each platform with follower count
- Show "Not detected" if profile not found
- Include existing engagement metrics
- Show consistency metrics
- Add "Live Data" badge for SerpAPI sourced data

---

## Integration with Existing Code

### In comprehensive-brand-analysis function

**Currently:** Calls `fetch-unified-followers` for social media data

**Update to:**
1. Call `fetch-unified-followers` first (YouTube, GitHub, etc.)
2. Call `fetch-serpapi-followers` for Instagram/Facebook
3. Merge results together
4. Include followers in response

**Code structure:**
```typescript
// Fetch from both sources
const [unifiedFollowers, serpAPIFollowers] = await Promise.all([
  fetchUnifiedFollowers(socialProfiles),
  fetchSerpAPIFollowers(socialProfiles)
])

// Merge results
const allFollowers = mergeFollowerData(unifiedFollowers, serpAPIFollowers)

// Return combined data
return {
  ...otherData,
  socialMedia: {
    ...allFollowers,
    totalFollowers: calculateTotal(allFollowers)
  }
}
```

---

## API Key Setup

### Step 1: Get SerpAPI Key

1. Go to: https://serpapi.com/
2. Sign up for free account
3. Get API key from dashboard
4. Add to Supabase Secrets:
   - Name: `SERPAPI_KEY`
   - Value: Your API key

### Step 2: Add to Edge Functions

The `fetch-serpapi-followers` function will automatically use the key from Supabase secrets.

---

## Data Structure

### What gets stored in database

```typescript
analysis_data: {
  // ... other data
  socialMedia: {
    detected_platforms: [
      {
        platform: "instagram",
        url: "https://instagram.com/username",
        username: "username",
        followers: 150000,
        source: "serpapi",
        engagement_rate: 4.2  // existing data
      },
      {
        platform: "facebook",
        url: "https://facebook.com/page",
        username: "page",
        followers: 250000,
        source: "serpapi",
        engagement_rate: 2.8  // existing data
      }
    ],
    total_followers: 400000,
    totalEngagement: 3.5,
    consistency: "High"
  }
}
```

---

## Platforms Supported

### Fully Supported (SerpAPI):
- ✅ Instagram (followers via SerpAPI)
- ✅ Facebook (followers via SerpAPI)

### Also Supported (Existing unified function):
- ✅ YouTube (official API)
- ✅ GitHub (official API)
- ✅ Twitter (ScrapAPI fallback)
- ✅ LinkedIn (ScrapAPI fallback)
- ✅ TikTok (ScrapAPI fallback)
- ✅ Twitch (ScrapAPI fallback)
- ✅ Pinterest (ScrapAPI fallback)
- ✅ And more via ScrapAPI

---

## Error Handling

If SerpAPI fails:
1. Still show data from other sources
2. Display "Data unavailable" for that platform
3. Show error message in detailed view
4. Fallback to ScrapAPI if available

---

## Testing Checklist

After implementation:
- [ ] SerpAPI function deploys successfully
- [ ] Instagram followers fetch correctly
- [ ] Facebook followers fetch correctly
- [ ] Step 2 shows loading/completion of social data
- [ ] Summary card appears after Step 2
- [ ] Total followers calculated correctly
- [ ] Reports page Social Media card displays followers
- [ ] Dashboard shows breakdown by platform
- [ ] Error messages display if API fails
- [ ] "Live Data" badge shows for SerpAPI data

---

## Next Steps

1. **Get SerpAPI key:** https://serpapi.com/
2. **Add to Supabase Secrets** as `SERPAPI_KEY`
3. **Deploy function:** Tell me when ready
4. **Test with Instagram/Facebook profiles**
5. **Integrate into /connect page Step 2**
6. **Integrate into /connect page summary**
7. **Integrate into reports page Social Media card**

---

## Summary

This plan uses SerpAPI for Instagram and Facebook followers because:
- ✅ No app approval needed (immediate)
- ✅ No complex OAuth flows
- ✅ Reliable and fast
- ✅ Works with public profiles
- ✅ Affordable ($10-50/month for typical usage)

All follower data will be displayed in three key locations to give users comprehensive social media insights!
