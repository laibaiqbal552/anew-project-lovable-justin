export interface SocialMediaProfile {
  platform: string;
  url: string;
  username?: string;
  followers?: number;
  engagement?: number;
  verified?: boolean;
  completeness?: number;
  lastPost?: string;
}

export interface WebsiteQuality {
  contentRichness: number;
  hasRealContent: boolean;
  wordCount: number;
  hasImages: boolean;
  hasNavigation: boolean;
  hasContactInfo: boolean;
  isBlankWebsite: boolean;
  score: number;
}

export interface SocialMediaData {
  platforms: SocialMediaProfile[];
  score: number;
  detectionMethods: string[];
  businessName?: string;
  domain?: string;
  websiteQuality?: WebsiteQuality;
}

export class SocialMediaDetector {
  private readonly socialPlatforms = [
    {
      name: 'facebook',
      domains: ['facebook.com', 'fb.com'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?(?:facebook|fb)\.com\/([a-zA-Z0-9._-]+)/gi,
        /(?:https?:\/\/)?(?:m\.)?facebook\.com\/([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 25
    },
    {
      name: 'instagram',
      domains: ['instagram.com'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._-]+)/gi,
        /(?:https?:\/\/)?(?:m\.)?instagram\.com\/([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 20
    },
    {
      name: 'threads',
      domains: ['threads.net'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?threads\.net\/@([a-zA-Z0-9._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?threads\.net\/([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 15
    },
    {
      name: 'twitter',
      domains: ['twitter.com', 'x.com'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9._-]+)/gi,
        /(?:https?:\/\/)?(?:mobile\.)?twitter\.com\/([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 20
    },
    {
      name: 'linkedin',
      domains: ['linkedin.com'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 15
    },
    {
      name: 'youtube',
      domains: ['youtube.com'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)([a-zA-Z0-9._-]+)/gi,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 15
    },
    {
      name: 'tiktok',
      domains: ['tiktok.com'],
      patterns: [
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._-]+)/gi
      ],
      baseScore: 10
    }
  ];

  async detectSocialMedia(websiteUrl: string, businessName?: string): Promise<SocialMediaData> {
    const detectionMethods: string[] = [];
    const foundProfiles: SocialMediaProfile[] = [];

    try {
      // First, validate website content quality
      const websiteQuality = await this.validateWebsiteQuality(websiteUrl);

      // ONLY Method: Website Crawling - find social links ACTUALLY on the website
      const crawledProfiles = await this.crawlWebsiteForSocialLinks(websiteUrl);
      if (crawledProfiles.length > 0) {
        foundProfiles.push(...crawledProfiles);
        detectionMethods.push('Website Social Links');
      } else {
        console.log('No social media links found on website');
      }

      // NO FALLBACKS - Only show what's actually on the website!

      // Remove duplicates before enhancement
      const deduplicatedProfiles = this.removeDuplicates(foundProfiles);

      // Method 2: Enhanced social profiles from discovered links
      if (deduplicatedProfiles.length > 0) {
        const enhancedFromWebsite = await this.enhanceFoundSocialProfiles(deduplicatedProfiles);
        foundProfiles.splice(0, foundProfiles.length, ...enhancedFromWebsite);
        detectionMethods.push('Social Profile Analysis');
      } else {
        foundProfiles.splice(0, foundProfiles.length);
      }

      // Remove duplicates again after enhancement (in case enhancement created duplicates)
      const uniqueProfiles = this.removeDuplicates(foundProfiles);
      const enhancedProfiles = await this.enhanceProfiles(uniqueProfiles);
      const totalScore = this.calculateOverallScore(enhancedProfiles, websiteQuality);

      return {
        platforms: enhancedProfiles,
        score: totalScore,
        detectionMethods,
        businessName,
        domain: this.extractDomain(websiteUrl),
        websiteQuality
      };

    } catch (error) {
      console.error('Social media detection failed:', error);
      return {
        platforms: [],
        score: 0,
        detectionMethods: ['Error occurred during detection'],
        businessName,
        domain: this.extractDomain(websiteUrl)
      };
    }
  }

  private async crawlWebsiteForSocialLinks(websiteUrl: string): Promise<SocialMediaProfile[]> {
    try {
      console.log(`🌐 Starting to crawl website: ${websiteUrl}`);
      let htmlContent = '';
      let fetchMethod = '';

      // STEP 1: Try Supabase Edge Function with rendering support (best for JavaScript sites)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          console.log('📡 Trying Supabase Edge Function with rendering support...');
          const response = await fetch(`${supabaseUrl}/functions/v1/fetch-rendered-html`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey}`,
            },
            body: JSON.stringify({ url: websiteUrl }),
            signal: AbortSignal.timeout(30000) // 30 second timeout for rendering
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.html) {
              htmlContent = result.html;
              fetchMethod = `Edge Function (${result.method})`;
              console.log(`✅ Edge Function succeeded using: ${result.method}`);
              console.log(`📄 HTML content length: ${htmlContent.length} characters`);
            }
          } else {
            console.warn(`⚠️ Edge Function failed with status: ${response.status}`);
          }
        } catch (edgeError: any) {
          console.warn('⚠️ Edge Function failed:', edgeError.message);
        }
      }

      // STEP 2: Try direct fetch as fallback (fastest, works for sites with proper CORS headers)
      if (!htmlContent) {
        try {
          console.log('📡 Attempting direct fetch...');
          const directResponse = await fetch(websiteUrl, {
            mode: 'cors',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            signal: AbortSignal.timeout(10000)
          });

          if (directResponse.ok) {
            htmlContent = await directResponse.text();
            fetchMethod = 'Direct fetch';
            console.log(`✅ Direct fetch succeeded! HTML length: ${htmlContent.length}`);
          } else {
            console.warn(`⚠️ Direct fetch failed with status: ${directResponse.status}`);
          }
        } catch (directError: any) {
          console.warn('⚠️ Direct fetch failed (expected for CORS-restricted sites):', directError.message);
        }
      }

      // STEP 3: If direct fetch failed, try CORS proxies
      if (!htmlContent) {
        console.log('🔄 Trying CORS proxy services...');
        const proxies = [
          { name: 'corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(websiteUrl)}` },
          { name: 'api.codetabs.com', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(websiteUrl)}` },
          { name: 'allorigins.win', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(websiteUrl)}` }
        ];

        for (const proxy of proxies) {
          try {
            console.log(`📡 Trying proxy: ${proxy.name}...`);
            const response = await fetch(proxy.url, {
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
              signal: AbortSignal.timeout(15000)
            });

            if (response.ok) {
              const data = await response.text();
              if (data && data.length > 100) { // Ensure we got meaningful content
                htmlContent = data;
                fetchMethod = `CORS proxy (${proxy.name})`;
                console.log(`✅ Proxy ${proxy.name} succeeded! HTML length: ${htmlContent.length}`);
                break;
              } else {
                console.warn(`⚠️ Proxy ${proxy.name} returned minimal content`);
              }
            } else {
              console.warn(`⚠️ Proxy ${proxy.name} failed with status: ${response.status}`);
            }
          } catch (proxyError: any) {
            console.warn(`❌ Proxy ${proxy.name} error:`, proxyError.message);
            continue;
          }
        }
      }

      // STEP 4: Check if we got any content
      if (!htmlContent || htmlContent.length < 100) {
        console.error('❌ Failed to fetch website HTML');
        console.error('   Website:', websiteUrl);
        console.error('   All methods failed (Edge Function + direct + 3 CORS proxies)');
        console.error('   This website may be blocking automated access or have strict CORS policies');
        return [];
      }

      console.log(`✅ Successfully fetched website HTML using: ${fetchMethod}`);
      if (!fetchMethod.includes('Edge Function')) {
        console.log(`📄 HTML content length: ${htmlContent.length} characters`);
      }

      // STEP 5: Extract social links from the HTML
      const extractedProfiles = this.extractSocialLinksFromHTML(htmlContent);

      // STEP 6: If no social links found and the HTML suggests JavaScript rendering, inform the user
      if (extractedProfiles.length === 0) {
        const isJavaScriptSite = this.detectJavaScriptRenderedSite(htmlContent);
        if (isJavaScriptSite) {
          console.warn('⚠️ This website appears to use JavaScript rendering (React/Next.js/Vue)');
          console.warn('   Social media links may be added dynamically after page load');
          console.warn('   The initial HTML does not contain social media links');
          console.warn('   SOLUTION 1: Deploy the "fetch-rendered-html" Edge Function for JavaScript rendering support');
          console.warn('   SOLUTION 2: Manually add your social media URLs on the social connection page');
        }
      }

      console.log(`✅ Extraction complete: Found ${extractedProfiles.length} social profiles`);

      return extractedProfiles;
    } catch (error) {
      console.error('❌ Website crawling failed with error:', error);
      return [];
    }
  }

  private detectJavaScriptRenderedSite(html: string): boolean {
    // Check for common JavaScript framework indicators
    const jsFrameworkIndicators = [
      /<script[^>]*src=["'][^"']*react[^"']*["']/i,
      /<script[^>]*src=["'][^"']*next[^"']*["']/i,
      /<script[^>]*src=["'][^"']*vue[^"']*["']/i,
      /<script[^>]*src=["'][^"']*angular[^"']*["']/i,
      /BAILOUT_TO_CLIENT_SIDE_RENDERING/i,
      /__NEXT_DATA__/i,
      /__nuxt/i,
      /ng-version=/i,
      /data-reactroot/i,
      /data-react-helmet/i
    ];

    return jsFrameworkIndicators.some(pattern => pattern.test(html));
  }

  private extractSocialLinksFromHTML(html: string): SocialMediaProfile[] {
    const profiles: SocialMediaProfile[] = [];
    const foundUrls = new Set<string>();

    console.log('🔍 Starting social media extraction from HTML...');

    // STEP 1: Extract ALL href attributes that might contain social media links
    const allHrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);
    let hrefCount = 0;

    for (const match of allHrefMatches) {
      hrefCount++;
      const url = match[1];

      // Check if this URL contains any social media domain
      const socialDomains = ['facebook.com', 'fb.com', 'instagram.com', 'threads.net', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com'];
      const containsSocialDomain = socialDomains.some(domain => url.toLowerCase().includes(domain));

      if (containsSocialDomain && !foundUrls.has(url)) {
        foundUrls.add(url);
        const platform = this.identifyPlatform(url);

        if (platform) {
          const username = this.extractUsername(url, platform);
          console.log(`✅ Found ${platform.name} link: ${url} (username: ${username})`);

          profiles.push({
            platform: platform.name,
            url: this.normalizeUrl(url),
            username,
            completeness: 70 // Higher confidence for href-extracted links
          });
        }
      }
    }

    console.log(`📊 Scanned ${hrefCount} href attributes, found ${foundUrls.size} social media URLs`);

    // STEP 2: Use platform-specific regex patterns to catch any missed links
    this.socialPlatforms.forEach(platform => {
      platform.patterns.forEach(pattern => {
        const matches = html.matchAll(pattern);
        let platformMatches = 0;

        for (const match of matches) {
          platformMatches++;
          const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
          const normalizedUrl = this.normalizeUrl(url);

          if (!foundUrls.has(normalizedUrl)) {
            foundUrls.add(normalizedUrl);
            const username = match[1];

            console.log(`✅ Found ${platform.name} via pattern: ${normalizedUrl} (username: ${username})`);

            profiles.push({
              platform: platform.name,
              url: normalizedUrl,
              username,
              completeness: 60 // Pattern-matched profiles
            });
          }
        }

        if (platformMatches > 0) {
          console.log(`📊 Platform ${platform.name}: found ${platformMatches} pattern matches`);
        }
      });
    });

    // STEP 3: Filter out non-profile or tracking URLs
    const filtered = profiles.filter(p => {
      const isProfile = this.isLikelyProfileUrl(p.platform, p.url, p.username);
      if (!isProfile) {
        console.log(`❌ Filtered out non-profile URL: ${p.url}`);
      }
      return isProfile;
    });

    console.log(`📊 FINAL RESULTS: Found ${profiles.length} total links, ${filtered.length} valid profiles after filtering`);

    if (filtered.length > 0) {
      console.log('✅ Valid social profiles found:');
      filtered.forEach(p => console.log(`   - ${p.platform}: ${p.url}`));
    } else {
      console.warn('⚠️ No valid social media profiles found on website');
    }

    return filtered;
  }

  // REMOVED: _searchByBusinessName - We don't guess profiles based on business names
  // REMOVED: _searchByDomain - We don't guess profiles based on domain names
  // We ONLY show social media links that are actually found on the website

  // REMOVED: checkProfileExists - We don't create fake/simulated profiles
  // We ONLY show real social media links found on the actual website

  private buildProfileUrl(platform: string, username: string): string {
    const urlMap: Record<string, string> = {
      'facebook': `https://facebook.com/${username}`,
      'instagram': `https://instagram.com/${username}`,
      'threads': `https://threads.net/@${username}`,
      'twitter': `https://twitter.com/${username}`,
      'linkedin': `https://linkedin.com/company/${username}`,
      'youtube': `https://youtube.com/@${username}`,
      'tiktok': `https://tiktok.com/@${username}`
    };

    return urlMap[platform] || '';
  }

  // REMOVED: All heuristic/guessing helper methods
  // We ONLY use actual links found on the website

  private cleanBusinessName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  // REMOVED: _fallbackSocialDetection - We don't generate fake profiles
  // REMOVED: generateUsernameVariations - We don't guess usernames
  // We ONLY show social media links that are actually on the website HTML

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http')) {
      return `https://${url}`;
    }
    return url;
  }

  // Heuristic filter to exclude non-profile and tracking URLs
  private isLikelyProfileUrl(platform: string, url: string, username?: string): boolean {
    const u = url.toLowerCase();
    const banned = [
      '/tr', '/watch', '/embed', '/intent', '/share', '/sharer.php', 'sharer.php',
      '/oauth', '/dialog', '/plugins/', '/shorts', '/hashtag', '/home', '/i/', '/privacy', '/help'
    ];
    if (banned.some(b => u.includes(b))) return false;

    if (platform === 'facebook') {
      if (u.includes('facebook.com/') && (u.endsWith('/tr') || u.includes('/events/'))) return false;
    }
    if (platform === 'youtube') {
      if (u.includes('youtube.com/watch') || u.includes('youtube.com/embed')) return false;
    }
    if (platform === 'instagram') {
      if (u.includes('/p/') || u.includes('/reel') || u.includes('/explore')) return false;
    }
    if (platform === 'twitter' || platform === 'x') {
      if (u.includes('/intent') || u.includes('/hashtag') || u.includes('/home') || u.includes('/i/')) return false;
    }
    if (platform === 'linkedin') {
      if (u.includes('/feed') || u.includes('/sharing') || u.includes('shareArticle')) return false;
    }

    const badUsernames = ['watch', 'tr', 'share'];
    if (username && badUsernames.includes(username.toLowerCase())) return false;

    try {
      const parsed = new URL(u.startsWith('http') ? u : `https://${u}`);
      const segments = parsed.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return false;
    } catch {}

    return true;
  }

  private removeDuplicates(profiles: SocialMediaProfile[]): SocialMediaProfile[] {
    const seen = new Map<string, SocialMediaProfile>();

    profiles.forEach(profile => {
      // Normalize URL for comparison (remove trailing slashes, query params, www, protocol differences)
      const normalizedUrl = profile.url
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/^m\./, '') // Remove mobile prefix
        .replace(/\/$/, '')
        .split('?')[0]
        .split('#')[0];

      // Use normalized URL as key (not platform + url) to catch cross-platform duplicates
      const key = normalizedUrl;

      // If this exact URL already exists, keep only one
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        // Keep the one with more data (higher completeness or with follower count)
        const existingScore = (existing.completeness || 0) + (existing.followers ? 50 : 0);
        const newScore = (profile.completeness || 0) + (profile.followers ? 50 : 0);

        if (newScore > existingScore) {
          seen.set(key, profile);
        }
      } else {
        seen.set(key, profile);
      }
    });

    return Array.from(seen.values());
  }

  private async enhanceProfiles(profiles: SocialMediaProfile[]): Promise<SocialMediaProfile[]> {
    // Return profiles as-is - no random data generation
    // Engagement and lastPost will only be set if we have real data
    return profiles;
  }

  private calculateOverallScore(profiles: SocialMediaProfile[], websiteQuality?: WebsiteQuality): number {
    if (profiles.length === 0 && (!websiteQuality || websiteQuality.isBlankWebsite)) {
      return 0; // No social media and blank website = 0 score
    }

    let totalScore = 0;
    const platformScores = this.socialPlatforms.reduce((acc, platform) => {
      acc[platform.name] = platform.baseScore;
      return acc;
    }, {} as Record<string, number>);

    // Website quality penalty for blank websites
    let websiteQualityPenalty = 0;
    if (websiteQuality) {
      if (websiteQuality.isBlankWebsite) {
        websiteQualityPenalty = 50; // Major penalty for blank websites
      } else if (websiteQuality.score < 40) {
        websiteQualityPenalty = 20; // Moderate penalty for poor quality websites
      } else if (websiteQuality.score < 60) {
        websiteQualityPenalty = 10; // Small penalty for low quality websites
      }
    }

    profiles.forEach(profile => {
      let profileScore = platformScores[profile.platform] || 10;

      // Completeness bonus
      if (profile.completeness) {
        profileScore += (profile.completeness / 100) * 15;
      }

      // Follower count bonus
      if (profile.followers) {
        if (profile.followers > 10000) profileScore += 15;
        else if (profile.followers > 1000) profileScore += 10;
        else if (profile.followers > 100) profileScore += 5;
      }

      // Verified bonus
      if (profile.verified) {
        profileScore += 10;
      }

      // Engagement bonus
      if (profile.engagement && profile.engagement > 2) {
        profileScore += 5;
      }

      totalScore += profileScore;
    });

    // Penalty for having no profiles on major platforms
    const majorPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
    const foundMajorPlatforms = profiles.filter(p => majorPlatforms.includes(p.platform));

    if (foundMajorPlatforms.length === 0) {
      totalScore = Math.max(0, totalScore - 20);
    }

    // Apply website quality penalty
    totalScore = Math.max(0, totalScore - websiteQualityPenalty);

    return Math.min(Math.round(totalScore), 100);
  }

  // New helper methods for enhanced social media detection
  private identifyPlatform(url: string) {
    const lowerUrl = url.toLowerCase();
    return this.socialPlatforms.find(platform =>
      platform.domains.some(domain => lowerUrl.includes(domain))
    );
  }

  private extractUsername(url: string, platform: any): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract username based on platform-specific patterns
      if (platform.name === 'facebook') {
        const match = pathname.match(/\/([^\/\?]+)/);
        return match ? match[1] : '';
      } else if (platform.name === 'instagram') {
        const match = pathname.match(/\/([^\/\?]+)/);
        return match ? match[1] : '';
      } else if (platform.name === 'twitter') {
        const match = pathname.match(/\/([^\/\?]+)/);
        return match ? match[1] : '';
      } else if (platform.name === 'linkedin') {
        const match = pathname.match(/\/(company|in)\/([^\/\?]+)/);
        return match ? match[2] : '';
      } else if (platform.name === 'youtube') {
        const match = pathname.match(/\/(c|channel|user|@)\/([^\/\?]+)/) || pathname.match(/\/([^\/\?]+)/);
        return match ? match[2] || match[1] : '';
      } else if (platform.name === 'tiktok') {
        const match = pathname.match(/\/@([^\/\?]+)/);
        return match ? match[1] : '';
      } else if (platform.name === 'threads') {
        const match = pathname.match(/\/@([^\/\?]+)/);
        return match ? match[1] : '';
      }

      return '';
    } catch {
      return '';
    }
  }

  private async enhanceFoundSocialProfiles(profiles: SocialMediaProfile[]): Promise<SocialMediaProfile[]> {
    // For each found profile, try to get REAL follower counts ONLY
    return Promise.all(profiles.map(async (profile) => {
      try {
        const enhancedProfile = { ...profile };

        // Fetch REAL follower counts from each platform
        const realData = await this.fetchRealFollowerCount(profile.platform, profile.url);

        if (realData && realData.followers > 0) {
          // Only use real data if we successfully fetched it
          enhancedProfile.followers = realData.followers;
          enhancedProfile.engagement = realData.engagement;
          enhancedProfile.verified = realData.verified;
          enhancedProfile.completeness = 90;
        } else {
          // DO NOT use mock data - leave as undefined to show "unavailable"
          enhancedProfile.followers = undefined;
          enhancedProfile.engagement = undefined;
          enhancedProfile.verified = false;
          enhancedProfile.completeness = 70;
        }

        return enhancedProfile;
      } catch (error) {
        console.warn(`Failed to enhance profile ${profile.url}:`, error);
        // Return profile without follower data if enhancement fails
        profile.followers = undefined;
        profile.engagement = undefined;
        return profile;
      }
    }));
  }

  private async fetchRealFollowerCount(platform: string, url: string): Promise<{ followers: number; engagement: number; verified: boolean } | null> {
    try {
      console.log(`Fetching real follower count for ${platform}: ${url}`);

      // Call Supabase Edge Function to fetch stats
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase credentials not configured');
        return null;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-social-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ platform, url })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return {
            followers: result.data.followers || 0,
            engagement: result.data.engagement || 0,
            verified: result.data.verified || false
          };
        }
      } else {
        console.warn(`Failed to fetch stats for ${platform}: ${response.status}`);
      }

      return null;
    } catch (error) {
      console.error(`Error fetching real data for ${platform}:`, error);
      return null;
    }
  }


  private estimateFollowers(platform: string, username?: string): number {
    // Base follower estimates based on platform
    const baseFollowers = {
      'facebook': 2000,
      'instagram': 1500,
      'threads': 800,
      'twitter': 800,
      'linkedin': 500,
      'youtube': 1200,
      'tiktok': 600
    };

    const base = baseFollowers[platform as keyof typeof baseFollowers] || 500;

    // Adjust based on username patterns that suggest business/official accounts
    let multiplier = 1;
    if (username) {
      const businessPatterns = ['official', 'inc', 'corp', 'company', 'business', 'shop', 'store'];
      if (businessPatterns.some(pattern => username.toLowerCase().includes(pattern))) {
        multiplier = 2.5;
      }
    }

    return Math.floor(base * multiplier * (0.5 + Math.random()));
  }

  private estimateEngagement(platform: string): number {
    // Platform-typical engagement rates
    const engagementRates = {
      'instagram': 2.5,
      'threads': 2.8,
      'tiktok': 4.2,
      'facebook': 1.8,
      'twitter': 1.4,
      'linkedin': 1.1,
      'youtube': 3.1
    };

    const baseRate = engagementRates[platform as keyof typeof engagementRates] || 2.0;
    return parseFloat((baseRate * (0.6 + Math.random() * 0.8)).toFixed(2));
  }

  private checkVerifiedPatterns(url: string, username?: string): boolean {
    // Look for patterns that suggest verified/official accounts
    const verifiedPatterns = ['official', 'verified', 'inc', 'corp', 'company'];
    const urlLower = url.toLowerCase();
    const usernameLower = username?.toLowerCase() || '';

    return verifiedPatterns.some(pattern =>
      urlLower.includes(pattern) || usernameLower.includes(pattern)
    ) && Math.random() > 0.7; // Add some randomness
  }

  // Website Quality Validation
  private async validateWebsiteQuality(websiteUrl: string): Promise<WebsiteQuality> {
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)'
        }
      });

      if (!response.ok) {
        return this.createDefaultWebsiteQuality(false);
      }

      const html = await response.text();
      return this.analyzeWebsiteContent(html);
    } catch (error) {
      console.warn('Website quality validation failed:', error);
      return this.createDefaultWebsiteQuality(false);
    }
  }

  private analyzeWebsiteContent(html: string): WebsiteQuality {
    // Remove HTML tags and get text content
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').filter(word => word.length > 2).length;

    // Check for various content indicators
    const hasImages = /<img[^>]+>/gi.test(html);
    const hasNavigation = /nav[^>]*>|menu[^>]*>|navigation/gi.test(html);
    const hasContactInfo = /contact|email|phone|address|tel:/gi.test(html);

    // Check for common "blank" website indicators
    const blankIndicators = [
      /coming\s+soon/gi,
      /under\s+construction/gi,
      /site\s+not\s+found/gi,
      /default\s+page/gi,
      /placeholder/gi
    ];

    const hasBlankIndicators = blankIndicators.some(pattern => pattern.test(html));

    // Check for minimal content (like ms2go - just a logo)
    const hasMinimalContent = wordCount < 50 && !hasNavigation && !hasContactInfo;

    // Check for actual business content
    const businessContentPatterns = [
      /about\s+us/gi,
      /our\s+services/gi,
      /products/gi,
      /portfolio/gi,
      /testimonials/gi,
      /pricing/gi,
      /blog/gi,
      /news/gi
    ];

    const hasBusinessContent = businessContentPatterns.some(pattern => pattern.test(html));

    // Calculate content richness score
    let contentRichness = 0;
    if (wordCount > 500) contentRichness += 30;
    else if (wordCount > 200) contentRichness += 20;
    else if (wordCount > 50) contentRichness += 10;

    if (hasImages) contentRichness += 15;
    if (hasNavigation) contentRichness += 20;
    if (hasContactInfo) contentRichness += 15;
    if (hasBusinessContent) contentRichness += 20;

    // Determine if website is blank/minimal
    const isBlankWebsite = hasBlankIndicators || hasMinimalContent || wordCount < 30;
    const hasRealContent = !isBlankWebsite && (hasBusinessContent || wordCount > 100);

    // Calculate overall website quality score
    let score = contentRichness;
    if (isBlankWebsite) score = Math.min(score, 20);
    if (!hasRealContent) score = Math.min(score, 40);

    return {
      contentRichness,
      hasRealContent,
      wordCount,
      hasImages,
      hasNavigation,
      hasContactInfo,
      isBlankWebsite,
      score
    };
  }

  private createDefaultWebsiteQuality(hasContent: boolean = true): WebsiteQuality {
    return {
      contentRichness: hasContent ? 50 : 10,
      hasRealContent: hasContent,
      wordCount: hasContent ? 200 : 20,
      hasImages: hasContent,
      hasNavigation: hasContent,
      hasContactInfo: hasContent,
      isBlankWebsite: !hasContent,
      score: hasContent ? 50 : 10
    };
  }
}

export const socialMediaDetector = new SocialMediaDetector();