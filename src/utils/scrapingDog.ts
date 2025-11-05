/**
 * ScrapingDog API integration for fetching social media follower counts
 * Supports Facebook, Instagram, and TikTok
 */

const SCRAPINGDOG_API_KEY = '690b6fb1fa88fda8dde4321d';
const SCRAPINGDOG_BASE_URL = 'https://api.scrapingdog.com/scrape';

export interface FollowerData {
  platform: string;
  url: string;
  followers?: number;
  error?: string;
  source: 'scrapingdog';
}

/**
 * Fetch Instagram follower count using ScrapingDog Instagram API
 */
export async function fetchInstagramFollowers(username: string): Promise<number | null> {
  try {
    // Clean up username - remove @ symbol if present
    const cleanUsername = username.replace(/^@/, '');

    console.log(`📸 [ScrapingDog] Fetching Instagram followers for @${cleanUsername}...`);

    // Use ScrapingDog's dedicated Instagram API endpoint
    const apiUrl = `https://api.scrapingdog.com/instagram/profile/?api_key=${SCRAPINGDOG_API_KEY}&username=${encodeURIComponent(cleanUsername)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.error(`❌ [ScrapingDog] Instagram API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`❌ [ScrapingDog] Error details:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`📄 [ScrapingDog] Received Instagram profile data:`, data);

    // Extract followers count from the structured JSON response
    const followersCount = data.followers_count;

    if (typeof followersCount === 'number' && followersCount >= 0) {
      console.log(`✅ [ScrapingDog] Found Instagram followers: ${followersCount}`);
      return followersCount;
    }

    console.log(`⚠️ [ScrapingDog] Could not extract Instagram followers count from response`);
    return null;
  } catch (error) {
    console.error(`❌ [ScrapingDog] Failed to fetch Instagram followers:`, error);
    return null;
  }
}

/**
 * Fetch Facebook page followers using ScrapingDog
 * Note: Facebook may require dedicated API endpoint. Check ScrapingDog docs for facebook/page/ endpoint
 */
export async function fetchFacebookFollowers(pageName: string): Promise<number | null> {
  try {
    // Extract page name from URL if a full URL was provided
    let cleanPageName = pageName;
    if (pageName.includes('facebook.com/')) {
      const match = pageName.match(/facebook\.com\/([^/?]+)/);
      cleanPageName = match ? match[1] : pageName;
    }

    console.log(`📘 [ScrapingDog] Fetching Facebook followers for ${cleanPageName}...`);

    // Method 1: Use dedicated Facebook Profile API
    const dedicatedApiUrl = `https://api.scrapingdog.com/facebook/profile/?api_key=${SCRAPINGDOG_API_KEY}&username=${encodeURIComponent(cleanPageName)}`;

    try {
      const dedicatedResponse = await fetch(dedicatedApiUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(30000),
      });

      if (dedicatedResponse.ok) {
        const contentType = dedicatedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await dedicatedResponse.json();
          console.log(`📄 [ScrapingDog] Received Facebook profile data:`, data);

          // Facebook API returns "likes" field for page likes/followers
          const followersCount = data.likes || data.followers_count || data.follower_count || data.fans || data.page_likes;

          if (typeof followersCount === 'number' && followersCount >= 0) {
            console.log(`✅ [ScrapingDog] Found Facebook followers: ${followersCount}`);
            return followersCount;
          } else if (typeof followersCount === 'string') {
            // Handle "1.1K" format
            const match = followersCount.match(/([0-9.]+)([KMB]?)/);
            if (match) {
              const multiplier: Record<string, number> = { 'K': 1000, 'M': 1000000, 'B': 1000000000 };
              const num = parseFloat(match[1]);
              const suffix = match[2];
              const count = suffix ? Math.round(num * multiplier[suffix]) : Math.round(num);
              console.log(`✅ [ScrapingDog] Found Facebook followers (parsed from string): ${count}`);
              return count;
            }
          }
        }
      } else {
        console.warn(`⚠️ [ScrapingDog] Facebook API returned ${dedicatedResponse.status}, falling back to web scraper...`);
      }
    } catch (dedicatedError) {
      console.log(`⚠️ [ScrapingDog] Facebook API failed:`, dedicatedError);
    }

    // Method 2: Use general web scraper with premium proxy
    const facebookUrl = `https://www.facebook.com/${cleanPageName}`;
    const apiUrl = `${SCRAPINGDOG_BASE_URL}?api_key=${SCRAPINGDOG_API_KEY}&url=${encodeURIComponent(facebookUrl)}&dynamic=true&premium=true`;

    console.log(`🌐 [ScrapingDog] Fetching via web scraper: ${facebookUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      console.error(`❌ [ScrapingDog] Facebook web scraper error: ${response.status} ${response.statusText}`);
      return null;
    }

    const htmlContent = await response.text();
    console.log(`📄 [ScrapingDog] Received HTML content (length: ${htmlContent.length})`);

    // Check if response is too small (likely blocked)
    if (htmlContent.length < 5000) {
      console.warn(`⚠️ [ScrapingDog] Response too small (${htmlContent.length} bytes), likely blocked by Facebook`);
      console.log(`💡 [ScrapingDog] Facebook has strong anti-scraping. Consider using Facebook Graph API or manual entry.`);
      return null;
    }

    let followersCount: number | null = null;

    // Enhanced pattern matching for HTML scraping
    const patterns = [
      // JSON data patterns
      /"followerCount"\s*:\s*"?(\d+)"?/gi,
      /"subscriber_count"\s*:\s*"?(\d+)"?/gi,
      /"fanCount"\s*:\s*"?(\d+)"?/gi,
      /"page_likes"\s*:\s*"?(\d+)"?/gi,
      // Text patterns with K/M/B notation
      /(\d+[.,]\d+[KMB]?)\s*(?:people follow|followers?|likes?|fans?)/gi,
      /(\d+[KMB]?)\s*(?:people follow|followers?|likes?|fans?)/gi,
      // Escaped JSON patterns
      /followerCount&quot;:&quot;(\d+)&quot;/gi,
      /\\"followerCount\\":(\d+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = Array.from(htmlContent.matchAll(pattern));
      for (const match of matches) {
        if (match && match[1]) {
          let countStr = match[1];

          const multiplier: Record<string, number> = {
            'K': 1000,
            'M': 1000000,
            'B': 1000000000
          };

          const lastChar = countStr.charAt(countStr.length - 1).toUpperCase();
          if (multiplier[lastChar]) {
            const baseNum = parseFloat(countStr.slice(0, -1).replace(/[.,]/g, ''));
            followersCount = Math.round(baseNum * multiplier[lastChar]);
          } else {
            const parsed = parseInt(countStr.replace(/[.,]/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) {
              followersCount = parsed;
            }
          }

          if (followersCount && followersCount > 0) {
            console.log(`✅ [ScrapingDog] Found Facebook followers: ${followersCount}`);
            return followersCount;
          }
        }
      }
    }

    console.log(`⚠️ [ScrapingDog] Could not extract Facebook followers count from HTML`);
    console.log(`💡 [ScrapingDog] Facebook blocks automated scraping. Manual verification: ${facebookUrl}`);
    return null;
  } catch (error) {
    console.error(`❌ [ScrapingDog] Failed to fetch Facebook followers:`, error);
    return null;
  }
}

/**
 * Fetch TikTok follower count using ScrapingDog
 * Note: TikTok may have dedicated API endpoint. Check ScrapingDog docs for tiktok/profile/ endpoint
 */
export async function fetchTikTokFollowers(username: string): Promise<number | null> {
  try {
    // Clean up username - remove @ symbol if present
    const cleanUsername = username.replace(/^@/, '');

    console.log(`📱 [ScrapingDog] Fetching TikTok followers for @${cleanUsername}...`);

    // Try dedicated TikTok API endpoint first
    let apiUrl = `https://api.scrapingdog.com/tiktok/profile/?api_key=${SCRAPINGDOG_API_KEY}&username=${encodeURIComponent(cleanUsername)}`;

    let response = await fetch(apiUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    });

    // If dedicated endpoint doesn't work, fall back to web scraper
    if (!response.ok) {
      console.warn(`⚠️ [ScrapingDog] TikTok dedicated API failed, trying web scraper...`);
      const tiktokUrl = `https://www.tiktok.com/@${cleanUsername}`;
      apiUrl = `${SCRAPINGDOG_BASE_URL}?api_key=${SCRAPINGDOG_API_KEY}&url=${encodeURIComponent(tiktokUrl)}&dynamic=true&premium=true`;

      response = await fetch(apiUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(45000),
      });
    }

    if (!response.ok) {
      console.error(`❌ [ScrapingDog] TikTok API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const contentType = response.headers.get('content-type');
    let followersCount: number | null = null;

    // Check if response is JSON (structured data from dedicated API)
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`📄 [ScrapingDog] Received TikTok profile data:`, data);

      // Try different field names for follower count
      followersCount = data.followerCount || data.follower_count || data.followers_count || data.followers;
    } else {
      // Parse HTML if using web scraper endpoint
      const htmlContent = await response.text();
      console.log(`📄 [ScrapingDog] Received HTML content (length: ${htmlContent.length})`);

      // Try different patterns to extract followers
      const jsonPatterns = [
        /"followerCount":(\d+)/g,
        /"follower_count":(\d+)/g,
        /followerCount["\']?\s*:\s*(\d+)/g,
        /"followerCount":"(\d+)"/g,
        /followerCount[\s]*=[\s]*(\d+)/g,
        /"followerCount"[\s]*:[\s]*"?(\d+)"?/g,
        /"stats"[^}]*"followerCount"[^}]*:[\s]*(\d+)/g,
        /followerCount&quot;:(\d+)/g,
        /\\"followerCount\\":(\d+)/g,
        /__UNIVERSAL_DATA_FOR_REHYDRATION__.*?"followerCount":(\d+)/,
      ];

      for (const pattern of jsonPatterns) {
        const matches = Array.from(htmlContent.matchAll(pattern));
        if (matches.length > 0) {
          for (const match of matches) {
            if (match && match[1]) {
              const count = parseInt(match[1], 10);
              if (count > 0) {
                followersCount = count;
                break;
              }
            }
          }
          if (followersCount) break;
        }
      }

      // Try meta tags if JSON patterns don't work
      if (!followersCount) {
        const metaMatch = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
        if (metaMatch && metaMatch[1]) {
          const descMatch = metaMatch[1].match(/(\d+[.,]?\d*[KMB]?)\s*(?:Followers?|followers?)/i);
          if (descMatch && descMatch[1]) {
            let countStr = descMatch[1].replace(/,/g, '');
            const multiplier: Record<string, number> = {
              'K': 1000,
              'M': 1000000,
              'B': 1000000000
            };

            const lastChar = countStr.charAt(countStr.length - 1).toUpperCase();
            if (multiplier[lastChar]) {
              const baseNum = parseFloat(countStr.slice(0, -1));
              followersCount = Math.round(baseNum * multiplier[lastChar]);
            } else {
              followersCount = parseInt(countStr, 10);
            }
          }
        }
      }
    }

    if (typeof followersCount === 'number' && followersCount >= 0) {
      console.log(`✅ [ScrapingDog] Found TikTok followers: ${followersCount}`);
      return followersCount;
    }

    console.log(`⚠️ [ScrapingDog] Could not extract TikTok followers count`);
    return null;
  } catch (error) {
    console.error(`❌ [ScrapingDog] Failed to fetch TikTok followers:`, error);
    return null;
  }
}

/**
 * Extract username from social media URL
 */
export function extractUsernameFromUrl(url: string, platform: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    switch (platform.toLowerCase()) {
      case 'instagram':
        const igMatch = pathname.match(/\/([^\/\?]+)/);
        return igMatch ? igMatch[1] : null;

      case 'facebook':
        const fbMatch = pathname.match(/\/([^\/\?]+)/);
        return fbMatch ? fbMatch[1] : null;

      case 'tiktok':
        const ttMatch = pathname.match(/\/@?([^\/\?]+)/);
        return ttMatch ? ttMatch[1] : null;

      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to extract username from URL: ${url}`, error);
    return null;
  }
}

/**
 * Fetch follower data for a social media profile using ScrapingDog
 */
export async function fetchFollowerData(
  platform: string,
  url: string,
  username?: string
): Promise<FollowerData> {
  const platformLower = platform.toLowerCase();
  const result: FollowerData = {
    platform,
    url,
    source: 'scrapingdog',
  };

  try {
    let extractedUsername = username;
    if (!extractedUsername) {
      extractedUsername = extractUsernameFromUrl(url, platform) || '';
    }

    if (!extractedUsername) {
      console.warn(`⚠️ [ScrapingDog] Could not extract username from ${url}`);
      result.error = 'Could not extract username from URL';
      return result;
    }

    let followers: number | null = null;

    switch (platformLower) {
      case 'instagram':
        followers = await fetchInstagramFollowers(extractedUsername);
        break;

      case 'facebook':
        followers = await fetchFacebookFollowers(extractedUsername);
        break;

      case 'tiktok':
        followers = await fetchTikTokFollowers(extractedUsername);
        break;

      default:
        result.error = `Platform ${platform} not supported by ScrapingDog integration`;
        console.warn(`⚠️ [ScrapingDog] ${result.error}`);
        return result;
    }

    if (followers !== null) {
      result.followers = followers;
      console.log(`✅ [ScrapingDog] Successfully fetched ${followers} followers for ${platform}`);
    } else {
      result.error = 'Could not extract follower count from page';
      console.warn(`⚠️ [ScrapingDog] ${result.error} for ${platform}`);
    }

    return result;
  } catch (error: any) {
    result.error = error.message || 'Unknown error occurred';
    console.error(`❌ [ScrapingDog] Error fetching follower data:`, error);
    return result;
  }
}
