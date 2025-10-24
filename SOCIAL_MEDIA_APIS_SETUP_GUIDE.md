# Complete Social Media Followers APIs Setup Guide

## Overview

Integration plan for 12 social media platforms to fetch follower counts. Organized in phases based on approval time and complexity.

---

## 🎯 All Platforms (12 Total)

### 1. YOUTUBE (Official Data API v3)
**Status:** ✅ ALREADY HAVE THIS

- **Followers:** ✅ Channel Subscribers
- **Cost:** FREE (10,000 units/day)
- **Rate Limit:** 10,000 units/day
- **Difficulty:** ⭐ (Easiest)
- **You already have:** `YOUTUBE_API_KEY` ✅

---

### 2. GITHUB (Official API v3)
**Status:** ✅ ALREADY HAVE THIS

- **Followers:** ✅ User/Organization followers
- **Cost:** FREE
- **Rate Limit:** 5,000 requests/hour (with token)
- **Difficulty:** ⭐ (Very Easy)
- **You already have:** `GITHUB_TOKEN` ✅

---

## PHASE 1: No Approval Needed (Start Immediately)

### 3. TWITCH (Official API)

**Setup Steps:**
1. Go to: https://dev.twitch.tv/
2. Sign in with Twitch account
3. Click "Applications" → "Create Application"
4. Fill in:
   - Name: "Social Media Analyzer"
   - OAuth Redirect URL: https://yourapp.com/callback
   - Category: "Application"
5. Go to "Settings" tab
6. Copy **Client ID**
7. Click "Generate" → Copy **OAuth Token**
8. Add to Supabase Secrets:
   - `TWITCH_CLIENT_ID` = Client ID
   - `TWITCH_ACCESS_TOKEN` = OAuth Token

**Verification:**
```bash
curl -H "Client-ID: YOUR_CLIENT_ID" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     https://api.twitch.tv/helix/users?login=twitch_username
```

---

### 4. PINTEREST (Official API)

**Setup Steps:**
1. Go to: https://developers.pinterest.com/
2. Create an App
3. Fill in App Details:
   - App Name: "Social Media Analyzer"
   - App Description: "Analyzing social media followers"
4. Copy **App ID** and **App Secret**
5. Generate Access Token:
   - In app settings, click "Generate Token"
   - Select scopes: `user_accounts:read`, `pins:read`
   - Copy the token
6. Add to Supabase Secrets:
   - `PINTEREST_APP_ID` = App ID
   - `PINTEREST_ACCESS_TOKEN` = Access Token

**Verification:**
```bash
curl -X GET "https://api.pinterest.com/v1/me/?access_token=YOUR_TOKEN&fields=id,username,counts"
```

---

### 5. DISCORD (Official API)

**Setup Steps:**
1. Go to: https://discord.com/developers/applications
2. Click "New Application"
3. Enter App Name: "Social Media Analyzer"
4. Go to "Bot" section
5. Click "Add Bot"
6. Under TOKEN, click "Copy" → Copy **Bot Token**
7. Enable Intents: Server Members Intent (toggle on)
8. Add bot to your server:
   - OAuth2 → URL Generator
   - Select scope: `bot`
   - Select permissions: `Read Members`
   - Copy URL and open in browser
9. Add to Supabase Secrets:
   - `DISCORD_BOT_TOKEN` = Bot Token
   - `DISCORD_SERVER_ID` = Your Discord Server ID (right-click server, copy ID)

**Verification:**
```bash
curl -H "Authorization: Bot YOUR_BOT_TOKEN" \
     https://discord.com/api/v10/guilds/SERVER_ID
```

---

### 6. REDDIT (Official API)

**Setup Steps:**
1. Go to: https://www.reddit.com/prefs/apps
2. Scroll to "Authorized applications"
3. Click "Create app" or "Create another app"
4. Fill in:
   - name: "Social Media Analyzer"
   - App type: "script"
   - Redirect URI: http://localhost:8080
5. Copy **Client ID** (under app name) and **Client Secret**
6. Add to Supabase Secrets:
   - `REDDIT_CLIENT_ID` = Client ID
   - `REDDIT_CLIENT_SECRET` = Client Secret
   - `REDDIT_USERNAME` = Your Reddit username
   - `REDDIT_PASSWORD` = Your Reddit password (or create app password)

**Verification:**
```bash
curl -X POST "https://www.reddit.com/api/v1/access_token" \
     -H "Authorization: Basic $(echo -n 'CLIENT_ID:CLIENT_SECRET' | base64)" \
     -d "grant_type=password&username=USERNAME&password=PASSWORD"
```

---

## PHASE 2: Approval Process (24-48 hours)

### 7. FACEBOOK (Official Graph API)

**Setup Steps:**
1. Go to: https://developers.facebook.com/
2. Sign in or create Meta account
3. Create App:
   - App Name: "Social Media Analyzer"
   - App Type: Business
4. Add Product: **Facebook Graph API**
5. Go to Settings → Basic
   - Copy **App ID** and **App Secret**
6. Go to Tools → Access Token Generator
   - Select App Roles
   - Click "Generate Access Token"
   - Copy the token
7. Get your Page ID:
   - Go to facebook.com/[yourpage]
   - Right-click → View Page Source
   - Search for "page_id" to find your Page ID
8. Add to Supabase Secrets:
   - `FACEBOOK_APP_ID` = App ID
   - `FACEBOOK_ACCESS_TOKEN` = Access Token
   - `FACEBOOK_PAGE_ID` = Your Page ID

**Verification:**
```bash
curl "https://graph.facebook.com/v18.0/PAGE_ID?fields=followers_count,fan_count&access_token=YOUR_TOKEN"
```

---

### 8. INSTAGRAM (Official Graph API)

**Setup Steps:**
1. Go to: https://developers.facebook.com/
2. Create/Use same app as Facebook
3. Add Product: **Instagram Graph API**
4. Go to Roles → Instagram Accounts
5. Convert Personal Account to Creator/Business Account:
   - Go to instagram.com settings
   - Switch to Professional Account
6. Connect Business Account to App:
   - In app settings, select your Instagram account
7. Get your Instagram Business Account ID:
   - From app dashboard, it will show your account ID
8. Generate long-lived token (valid 2+ months):
   - In app dashboard, use Token Tool
9. Add to Supabase Secrets:
   - `INSTAGRAM_ACCESS_TOKEN` = Long-lived Token
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID` = Your Business Account ID

**Verification:**
```bash
curl "https://graph.instagram.com/v18.0/ACCOUNT_ID/insights?metric=follower_count&access_token=YOUR_TOKEN"
```

---

### 9. TWITTER/X (API v2)

**Setup Steps:**
1. Go to: https://developer.twitter.com/en/dashboard
2. Sign in with Twitter account
3. Create App:
   - Fill out application with use case
   - Twitter may ask follow-up questions (be specific)
4. Once approved, go to App settings
5. Go to "Keys and Tokens" tab
6. Copy:
   - **API Key** (Consumer Key)
   - **API Secret Key** (Consumer Secret)
   - Generate and copy **Bearer Token**
7. Add to Supabase Secrets:
   - `TWITTER_API_KEY` = API Key
   - `TWITTER_API_SECRET` = API Secret
   - `TWITTER_BEARER_TOKEN` = Bearer Token

**Verification:**
```bash
curl -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
     "https://api.twitter.com/2/tweets/search/recent?query=from:twitter_username"
```

---

### 10. LINKEDIN (Official API)

**Setup Steps:**
1. Go to: https://www.linkedin.com/developers/
2. Create App:
   - App Name: "Social Media Analyzer"
   - LinkedIn Page (required): Link your company/personal page
3. Fill in details and submit for verification
   - LinkedIn will review your application
4. Once approved, go to "Auth" tab
5. Copy:
   - **Client ID**
   - **Client Secret**
6. Authorize your app:
   - Use OAuth 2.0 flow to get access token
   - LinkedIn Developer Tools can help generate one
7. Add to Supabase Secrets:
   - `LINKEDIN_CLIENT_ID` = Client ID
   - `LINKEDIN_CLIENT_SECRET` = Client Secret
   - `LINKEDIN_ACCESS_TOKEN` = Access Token
   - `LINKEDIN_ORGANIZATION_ID` = Your Organization/Company ID (if using business account)

**Verification:**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     "https://api.linkedin.com/v2/me"
```

---

## PHASE 3: Long Approval Time (2-4 weeks)

### 11. TIKTOK (Official API)

**Setup Steps:**
1. Go to: https://developers.tiktok.com/
2. Create Developer Account
3. Create Application:
   - App Name: "Social Media Analyzer"
   - Purpose: Select appropriate category
4. Fill out all required information
5. Request access to endpoints:
   - User Info (to get username)
   - User Stats (to get followers)
6. Submit for approval (TikTok will review - takes 2-4 weeks)
7. Once approved, copy:
   - **Client Key**
   - **Client Secret**
8. Generate Access Token following TikTok's OAuth flow
9. Add to Supabase Secrets:
   - `TIKTOK_CLIENT_KEY` = Client Key
   - `TIKTOK_CLIENT_SECRET` = Client Secret
   - `TIKTOK_ACCESS_TOKEN` = Access Token
   - `TIKTOK_OPEN_ID` = Your TikTok Open ID

**Note:** TikTok approval is strict - be clear about your use case!

---

### 12. SNAPCHAT (Official API)

**Setup Steps:**
1. Go to: https://businesshelp.snapchat.com/en/article/register-api
2. Register Business Account (if you don't have one)
3. Apply for API Access:
   - Fill out application
   - Explain your use case
4. Snapchat will review and approve (24-48 hours usually)
5. Once approved, you'll get:
   - **Client ID**
   - **Client Secret**
6. Generate OAuth Token
7. Add to Supabase Secrets:
   - `SNAPCHAT_CLIENT_ID` = Client ID
   - `SNAPCHAT_CLIENT_SECRET` = Client Secret
   - `SNAPCHAT_ACCESS_TOKEN` = Access Token

---

## 📊 Quick Reference Table

| Platform | Cost | Setup Time | Approval | Status |
|----------|------|-----------|----------|--------|
| YouTube | FREE | 5 min | ✅ Done | ✅ Ready |
| GitHub | FREE | 3 min | ✅ Done | ✅ Ready |
| Twitch | FREE | 10 min | No | ⏳ Phase 1 |
| Pinterest | FREE | 15 min | No | ⏳ Phase 1 |
| Discord | FREE | 10 min | No | ⏳ Phase 1 |
| Reddit | FREE | 10 min | No | ⏳ Phase 1 |
| Facebook | FREE | 20 min | 24-48h | ⏳ Phase 2 |
| Instagram | FREE | 20 min | 24-48h | ⏳ Phase 2 |
| Twitter | FREE* | 20 min | 48h+ | ⏳ Phase 2 |
| LinkedIn | FREE | 20 min | 24h+ | ⏳ Phase 2 |
| TikTok | FREE | 30 min | 2-4w | ⏳ Phase 3 |
| Snapchat | FREE | 20 min | 24-48h | ⏳ Phase 3 |

*Twitter may require paid plan for some features

---

## 🎯 Recommended Order

**PRIORITY (Start Now):**
1. Twitch
2. Pinterest
3. Discord
4. Reddit

**NEXT (Submit applications now):**
1. Facebook
2. Instagram
3. Twitter
4. LinkedIn

**LATER (When TikTok and Snapchat approve):**
1. TikTok
2. Snapchat

---

## 🚀 What I'll Do

Once you provide the API keys, I will:

1. **Create edge functions** for each platform
2. **Update fetch-unified-followers** to use all APIs
3. **Add intelligent fallback** (if one API fails, try next)
4. **Auto-detect profiles** from URLs
5. **Display on Dashboard** with data sources

---

## 📝 Next Steps

1. **Choose which platforms to start with** (recommend Phase 1)
2. **Get API keys/tokens** using steps above
3. **Add to Supabase Secrets** in your project settings
4. **Tell me when ready** and I'll create the functions

Which platforms would you like to start with?
