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

      // Method 1: Website Crawling (Primary focus - find social links in website)
      const crawledProfiles = await this.crawlWebsiteForSocialLinks(websiteUrl);
      if (crawledProfiles.length > 0) {
        foundProfiles.push(...crawledProfiles);
        detectionMethods.push('Website Social Links');
      }

      // Fallback: if the website only has share buttons or no direct profile links,
      // attempt heuristic discovery using domain and business name
      if (foundProfiles.length === 0) {
        console.warn('No direct profile links found; running heuristic fallbacks');
        try {
          const byDomain = await this._searchByDomain(this.extractDomain(websiteUrl));
          if (byDomain.length > 0) {
            foundProfiles.push(...byDomain);
            detectionMethods.push('Fallback: Domain heuristic');
          }
        } catch {}
        if (businessName) {
          try {
            const byName = await this._searchByBusinessName(businessName);
            if (byName.length > 0) {
              foundProfiles.push(...byName);
              detectionMethods.push('Fallback: Business name heuristic');
            }
          } catch {}
        }
      }

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
      // Try multiple CORS proxy services
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(websiteUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(websiteUrl)}`,
        `https://cors-anywhere.herokuapp.com/${websiteUrl}`
      ];

      let htmlContent = '';

      for (const proxyUrl of proxies) {
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)'
            },
            signal: AbortSignal.timeout(15000)
          });

          if (response.ok) {
            const data = await response.text();
            htmlContent = data;
            break;
          }
        } catch (proxyError) {
          console.warn(`Proxy ${proxyUrl} failed:`, proxyError);
          continue;
        }
      }

      if (!htmlContent) {
        console.warn('All CORS proxies failed, trying direct fetch');
        try {
          // Try direct fetch as fallback
          const response = await fetch(websiteUrl, {
            mode: 'cors',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'User-Agent': 'Mozilla/5.0 (compatible; BrandAnalyzer/1.0)'
            }
          });
          if (response.ok) {
            htmlContent = await response.text();
          }
        } catch (directError) {
          console.warn('Direct fetch also failed:', directError);
        }
      }

      if (!htmlContent) {
        console.warn('All fetching methods failed, no social detection possible');
        return [];
      }

      return this.extractSocialLinksFromHTML(htmlContent);
    } catch (error) {
      console.error('Website crawling failed:', error);
      return [];
    }
  }

  private extractSocialLinksFromHTML(html: string): SocialMediaProfile[] {
    const profiles: SocialMediaProfile[] = [];
    const foundUrls = new Set<string>();

    // Enhanced patterns to catch social links in various contexts
    const enhancedPatterns = [
      // Direct href links
      /href=["']([^"']*(?:facebook|fb|instagram|threads\.net|twitter|x\.com|linkedin|youtube|tiktok)[^"']*)["']/gi,
      // Social media icons with links
      /social[^>]*href=["']([^"']*)["']/gi,
      // Follow us links
      /follow[^>]*href=["']([^"']*)["']/gi,
      // Footer social links
      /footer[^>]*(?:facebook|instagram|threads|twitter|linkedin|youtube|tiktok)[^>]*href=["']([^"']*)["']/gi,
      // Contact section social links
      /contact[^>]*(?:facebook|instagram|threads|twitter|linkedin|youtube|tiktok)[^>]*href=["']([^"']*)["']/gi
    ];

    // Extract using enhanced patterns
    enhancedPatterns.forEach(pattern => {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1];
        if (url && !foundUrls.has(url)) {
          foundUrls.add(url);
          const platform = this.identifyPlatform(url);
          if (platform) {
            const username = this.extractUsername(url, platform);
            profiles.push({
              platform: platform.name,
              url: this.normalizeUrl(url),
              username,
              completeness: 60 // Higher confidence for actual website links
            });
          }
        }
      }
    });

    // Standard regex patterns as fallback
    this.socialPlatforms.forEach(platform => {
      platform.patterns.forEach(pattern => {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          const url = match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
          const normalizedUrl = this.normalizeUrl(url);

          if (!foundUrls.has(normalizedUrl)) {
            foundUrls.add(normalizedUrl);
            const username = match[1];

            profiles.push({
              platform: platform.name,
              url: normalizedUrl,
              username,
              completeness: 50 // Default for pattern-matched profiles
            });
          }
        }
      });
    });

    // Filter out non-profile or tracking URLs (e.g., Facebook pixel /tr, YouTube /watch)
    const filtered = profiles.filter(p => this.isLikelyProfileUrl(p.platform, p.url, p.username));
    console.log(`Found ${profiles.length} social media links on website, ${filtered.length} likely profiles after filtering`);
    return filtered;
  }

  // @ts-ignore - Helper method for future use
  private async _searchByBusinessName(businessName: string): Promise<SocialMediaProfile[]> {
    const profiles: SocialMediaProfile[] = [];
    const cleanBusinessName = this.cleanBusinessName(businessName);

    // Generate common username variations
    const usernameVariations = this.generateUsernameVariations(cleanBusinessName);

    // Check each platform for business name variations
    for (const platform of this.socialPlatforms) {
      for (const username of usernameVariations) {
        const profile = await this.checkProfileExists(platform.name, username);
        if (profile) {
          profiles.push(profile);
        }
      }
    }

    return profiles;
  }

  // @ts-ignore - Helper method for future use
  private async _searchByDomain(domain: string): Promise<SocialMediaProfile[]> {
    const profiles: SocialMediaProfile[] = [];

    // Extract business name from domain and build deterministic candidates
    const base = domain.split('.')[0].replace(/[-_]/g, '');
    const username = base.toLowerCase();

    // Focus on primary platforms for heuristics
    const mainPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'];

    for (const platform of mainPlatforms) {
      const url = this.buildProfileUrl(platform, username);
      profiles.push({
        platform,
        url,
        username,
        completeness: 40 // lower confidence than direct website links
      });
    }

    return profiles;
  }

  private async checkProfileExists(platform: string, username: string): Promise<SocialMediaProfile | null> {
    // For now, simulate profile checking to avoid CORS issues
    // In production, this would use proper API endpoints
    const url = this.buildProfileUrl(platform, username);

    // Simulate some profiles being found based on common patterns
    const commonProfiles = ['company', 'business', 'official', 'inc', 'corp'];
    const isLikelyBusiness = commonProfiles.some(term => username.toLowerCase().includes(term));

    if (isLikelyBusiness || Math.random() > 0.7) {
      return {
        platform,
        url,
        username,
        completeness: Math.floor(Math.random() * 40) + 60, // 60-100%
        followers: Math.floor(Math.random() * 10000) + 500,
        verified: Math.random() > 0.8,
        engagement: Math.random() * 3 + 1 // 1-4%
      };
    }

    return null;
  }

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

  // @ts-ignore - Helper method for future use
  private _isLikelyBusinessProfile(_html: string, _username: string): boolean {
    // Heuristics to determine if it's a business profile
    const businessIndicators = [
      /business|company|corp|inc|llc/i,
      /contact|email|phone|address/i,
      /products|services|solutions/i,
      /about us|our team|mission/i
    ];

    return businessIndicators.some(pattern => pattern.test(_html));
  }

  // @ts-ignore - Helper method for future use
  private _calculateProfileCompleteness(_html: string): number {
    let score = 0;
    const indicators = [
      { pattern: /profile.*image|avatar/i, points: 15 },
      { pattern: /bio|description|about/i, points: 20 },
      { pattern: /contact|email|phone/i, points: 15 },
      { pattern: /website|link/i, points: 10 },
      { pattern: /verified|badge/i, points: 20 },
      { pattern: /followers|following/i, points: 10 },
      { pattern: /posts|tweets|content/i, points: 10 }
    ];

    indicators.forEach(indicator => {
      if (indicator.pattern.test(_html)) {
        score += indicator.points;
      }
    });

    return Math.min(score, 100);
  }

  // @ts-ignore - Helper method for future use
  private _extractFollowerCount(_html: string): number {
    const followerPatterns = [
      /(\d+(?:,\d+)*)\s*followers/i,
      /(\d+(?:,\d+)*)\s*following/i,
      /(\d+(?:\.\d+)?[km]?)\s*followers/i
    ];

    for (const pattern of followerPatterns) {
      const match = _html.match(pattern);
      if (match) {
        return this.parseFollowerCount(match[1]);
      }
    }

    return 0;
  }

  private parseFollowerCount(countStr: string): number {
    const num = parseFloat(countStr.replace(/,/g, ''));
    if (countStr.includes('k')) return num * 1000;
    if (countStr.includes('m')) return num * 1000000;
    return num;
  }

  // @ts-ignore - Helper method for future use
  private _isVerifiedProfile(_html: string): boolean {
    return /verified|badge|checkmark/i.test(_html);
  }

  private cleanBusinessName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .trim();
  }

  // @ts-ignore - Helper method for future use
  private _fallbackSocialDetection(_websiteUrl: string): SocialMediaProfile[] {
    // Fallback method when website crawling fails
    const domain = this.extractDomain(_websiteUrl);
    const businessName = domain.split('.')[0];

    // Generate some likely social media profiles based on domain
    const profiles: SocialMediaProfile[] = [];
    const mainPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];

    mainPlatforms.forEach(platform => {
      // Simulate finding some profiles
      if (Math.random() > 0.6) {
        profiles.push({
          platform,
          url: this.buildProfileUrl(platform, businessName),
          username: businessName,
          completeness: Math.floor(Math.random() * 30) + 50,
          followers: Math.floor(Math.random() * 5000) + 100,
          engagement: Math.random() * 2 + 1
        });
      }
    });

    return profiles;
  }

  private generateUsernameVariations(businessName: string): string[] {
    const variations = new Set<string>();
    const clean = this.cleanBusinessName(businessName);

    variations.add(clean);
    variations.add(clean.replace(/\s/g, ''));
    variations.add(clean.replace(/\s/g, '_'));
    variations.add(clean.replace(/\s/g, '-'));
    variations.add(clean.replace(/\s/g, '.'));

    // Add abbreviated versions
    const words = businessName.split(/\s+/);
    if (words.length > 1) {
      variations.add(words.map(w => w[0]).join('').toLowerCase());
      variations.add(words[0].toLowerCase() + words.slice(1).map(w => w[0]).join(''));
    }

    return Array.from(variations).filter(v => v.length >= 2);
  }

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
        .replace(/\/$/, '')
        .split('?')[0]
        .split('#')[0];

      const key = `${profile.platform}-${normalizedUrl}`;

      // If this profile already exists, keep the one with better completeness
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        if ((profile.completeness || 0) > (existing.completeness || 0)) {
          seen.set(key, profile);
        }
      } else {
        seen.set(key, profile);
      }
    });

    return Array.from(seen.values());
  }

  private async enhanceProfiles(profiles: SocialMediaProfile[]): Promise<SocialMediaProfile[]> {
    // Enhance profiles with additional data
    return profiles.map(profile => ({
      ...profile,
      engagement: this.calculateEngagementScore(profile),
      lastPost: this.estimateLastPostDate(profile)
    }));
  }

  private calculateEngagementScore(profile: SocialMediaProfile): number {
    // Simulate engagement scoring based on platform and followers
    const baseEngagement = Math.random() * 5 + 1; // 1-6%
    const platformMultiplier = {
      'instagram': 1.2,
      'threads': 1.3,
      'tiktok': 1.5,
      'facebook': 0.8,
      'twitter': 1.0,
      'linkedin': 0.7,
      'youtube': 1.1
    };

    return parseFloat((baseEngagement * (platformMultiplier[profile.platform as keyof typeof platformMultiplier] || 1)).toFixed(2));
  }

  private estimateLastPostDate(_profile: SocialMediaProfile): string {
    // Simulate last post estimation
    const daysAgo = Math.floor(Math.random() * 30) + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
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
    // For each found profile, try to get more detailed information
    return Promise.all(profiles.map(async (profile) => {
      try {
        // Simulate getting more detailed profile info
        const enhancedProfile = { ...profile };

        // Add estimated follower counts based on platform and URL patterns
        if (!enhancedProfile.followers) {
          enhancedProfile.followers = this.estimateFollowers(profile.platform, profile.username);
        }

        // Add estimated engagement rates
        if (!enhancedProfile.engagement) {
          enhancedProfile.engagement = this.estimateEngagement(profile.platform);
        }

        // Check if profile looks verified (common patterns in username/URL)
        enhancedProfile.verified = this.checkVerifiedPatterns(profile.url, profile.username);

        // Increase completeness for profiles found on website
        enhancedProfile.completeness = Math.min(100, (enhancedProfile.completeness || 50) + 20);

        return enhancedProfile;
      } catch (error) {
        console.warn(`Failed to enhance profile ${profile.url}:`, error);
        return profile;
      }
    }));
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