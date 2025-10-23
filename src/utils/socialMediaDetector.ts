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
    // 🧠 General Social Networks
    { name: 'facebook', domains: ['facebook.com', 'fb.com'], patterns: [/(?:https?:\/\/)?(?:www\.|m\.)?(?:facebook|fb)\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 25 },
    { name: 'instagram', domains: ['instagram.com'], patterns: [/(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 20 },
    { name: 'twitter', domains: ['twitter.com', 'x.com'], patterns: [/(?:https?:\/\/)?(?:www\.|mobile\.)?(?:twitter|x)\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 20 },
    { name: 'tiktok', domains: ['tiktok.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._-]+)/gi], baseScore: 18 },
    { name: 'snapchat', domains: ['snapchat.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([a-zA-Z0-9._-]+)/gi], baseScore: 12 },
    { name: 'pinterest', domains: ['pinterest.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 15 },
    { name: 'linkedin', domains: ['linkedin.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9._-]+)/gi], baseScore: 15 },
    { name: 'reddit', domains: ['reddit.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?reddit\.com\/(?:r|user)\/([a-zA-Z0-9._-]+)/gi], baseScore: 12 },
    { name: 'threads', domains: ['threads.net'], patterns: [/(?:https?:\/\/)?(?:www\.)?threads\.net\/@?([a-zA-Z0-9._-]+)/gi], baseScore: 15 },
    { name: 'tumblr', domains: ['tumblr.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.tumblr\.com/gi], baseScore: 10 },

    // 💬 Messaging & Communication Platforms
    { name: 'whatsapp', domains: ['wa.me', 'whatsapp.com'], patterns: [/(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com)\/([0-9]+)/gi], baseScore: 8 },
    { name: 'telegram', domains: ['t.me', 'telegram.me'], patterns: [/(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9._-]+)/gi], baseScore: 10 },
    { name: 'discord', domains: ['discord.gg', 'discord.com'], patterns: [/(?:https?:\/\/)?(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9]+)/gi], baseScore: 12 },
    { name: 'signal', domains: ['signal.group'], patterns: [/(?:https?:\/\/)?signal\.group\/([a-zA-Z0-9_-]+)/gi], baseScore: 7 },
    { name: 'viber', domains: ['viber.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?viber\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 6 },
    { name: 'wechat', domains: ['weixin.qq.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?weixin\.qq\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 8 },
    { name: 'line', domains: ['line.me'], patterns: [/(?:https?:\/\/)?line\.me\/([a-zA-Z0-9._-]+)/gi], baseScore: 7 },
    { name: 'skype', domains: ['skype.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?skype\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 6 },

    // 🎥 Video & Streaming Platforms
    { name: 'youtube', domains: ['youtube.com', 'youtu.be'], patterns: [/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c\/|channel\/|user\/|@)([a-zA-Z0-9._-]+)/gi], baseScore: 15 },
    { name: 'twitch', domains: ['twitch.tv'], patterns: [/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9._-]+)/gi], baseScore: 14 },
    { name: 'vimeo', domains: ['vimeo.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 10 },
    { name: 'dailymotion', domains: ['dailymotion.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 8 },
    { name: 'rumble', domains: ['rumble.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?rumble\.com\/(?:c|user)\/([a-zA-Z0-9._-]+)/gi], baseScore: 9 },
    { name: 'bilibili', domains: ['bilibili.com', 'space.bilibili.com'], patterns: [/(?:https?:\/\/)?space\.bilibili\.com\/([0-9]+)/gi], baseScore: 8 },
    { name: 'trovo', domains: ['trovo.live'], patterns: [/(?:https?:\/\/)?(?:www\.)?trovo\.live\/([a-zA-Z0-9._-]+)/gi], baseScore: 7 },

    // 🎶 Music & Audio Sharing Platforms
    { name: 'soundcloud', domains: ['soundcloud.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 12 },
    { name: 'spotify', domains: ['spotify.com'], patterns: [/(?:https?:\/\/)?open\.spotify\.com\/(?:user|artist)\/([a-zA-Z0-9]+)/gi], baseScore: 12 },
    { name: 'audiomack', domains: ['audiomack.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?audiomack\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 8 },
    { name: 'mixcloud', domains: ['mixcloud.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?mixcloud\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 9 },
    { name: 'bandcamp', domains: ['bandcamp.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.bandcamp\.com/gi], baseScore: 10 },
    { name: 'reverbnation', domains: ['reverbnation.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?reverbnation\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 7 },
    { name: 'lastfm', domains: ['last.fm'], patterns: [/(?:https?:\/\/)?(?:www\.)?last\.fm\/user\/([a-zA-Z0-9._-]+)/gi], baseScore: 8 },

    // 🧑‍💻 Developer & Tech Communities
    { name: 'github', domains: ['github.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 14 },
    { name: 'gitlab', domains: ['gitlab.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?gitlab\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 12 },
    { name: 'stackoverflow', domains: ['stackoverflow.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?stackoverflow\.com\/users\/([0-9]+)/gi], baseScore: 10 },
    { name: 'devto', domains: ['dev.to'], patterns: [/(?:https?:\/\/)?dev\.to\/([a-zA-Z0-9._-]+)/gi], baseScore: 11 },
    { name: 'hashnode', domains: ['hashnode.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.hashnode\.dev/gi], baseScore: 9 },
    { name: 'codepen', domains: ['codepen.io'], patterns: [/(?:https?:\/\/)?codepen\.io\/([a-zA-Z0-9._-]+)/gi], baseScore: 10 },
    { name: 'behance', domains: ['behance.net'], patterns: [/(?:https?:\/\/)?(?:www\.)?behance\.net\/([a-zA-Z0-9._-]+)/gi], baseScore: 11 },
    { name: 'dribbble', domains: ['dribbble.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?dribbble\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 11 },
    { name: 'producthunt', domains: ['producthunt.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?producthunt\.com\/@([a-zA-Z0-9._-]+)/gi], baseScore: 9 },
    { name: 'indiehackers', domains: ['indiehackers.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?indiehackers\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 8 },

    // 📷 Photography & Design Networks
    { name: 'flickr', domains: ['flickr.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?flickr\.com\/(?:people|photos)\/([a-zA-Z0-9@._-]+)/gi], baseScore: 9 },
    { name: '500px', domains: ['500px.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?500px\.com\/(?:p\/)?([a-zA-Z0-9._-]+)/gi], baseScore: 10 },
    { name: 'deviantart', domains: ['deviantart.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9._-]+)\.deviantart\.com/gi], baseScore: 9 },
    { name: 'artstation', domains: ['artstation.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?artstation\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 10 },
    { name: 'unsplash', domains: ['unsplash.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?unsplash\.com\/@([a-zA-Z0-9._-]+)/gi], baseScore: 9 },
    { name: 'vsco', domains: ['vsco.co'], patterns: [/(?:https?:\/\/)?(?:www\.)?vsco\.co\/([a-zA-Z0-9._-]+)/gi], baseScore: 8 },

    // 📰 Blogging & Writing Platforms
    { name: 'medium', domains: ['medium.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?medium\.com\/@([a-zA-Z0-9._-]+)/gi], baseScore: 13 },
    { name: 'substack', domains: ['substack.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.substack\.com/gi], baseScore: 12 },
    { name: 'wordpress', domains: ['wordpress.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.wordpress\.com/gi], baseScore: 10 },
    { name: 'blogger', domains: ['blogger.com', 'blogspot.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.blogspot\.com/gi], baseScore: 8 },
    { name: 'ghost', domains: ['ghost.io'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.ghost\.io/gi], baseScore: 9 },
    { name: 'wattpad', domains: ['wattpad.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?wattpad\.com\/user\/([a-zA-Z0-9._-]+)/gi], baseScore: 7 },
    { name: 'quora', domains: ['quora.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?quora\.com\/profile\/([a-zA-Z0-9._-]+)/gi], baseScore: 10 },

    // 🧩 Community & Forums
    { name: 'discourse', domains: ['discourse.org'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.discourse\.org/gi], baseScore: 7 },
    { name: 'slack', domains: ['slack.com'], patterns: [/(?:https?:\/\/)?([a-zA-Z0-9._-]+)\.slack\.com/gi], baseScore: 8 },
    { name: 'patreon', domains: ['patreon.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?patreon\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 11 },
    { name: 'kofi', domains: ['ko-fi.com'], patterns: [/(?:https?:\/\/)?ko-fi\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 9 },
    { name: 'buymeacoffee', domains: ['buymeacoffee.com'], patterns: [/(?:https?:\/\/)?(?:www\.)?buymeacoffee\.com\/([a-zA-Z0-9._-]+)/gi], baseScore: 9 }
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

      // STEP 1: Try direct fetch first (fastest, works for static sites)
      try {
        console.log('📡 Attempting direct fetch...');
        const directResponse = await fetch(websiteUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

      // STEP 2: Try public CORS proxies (works for most sites)
      if (!htmlContent) {
        console.log('🔄 Trying public CORS proxy services...');
        const proxies = [
          { name: 'AllOrigins', url: `https://api.allorigins.win/raw?url=${encodeURIComponent(websiteUrl)}` },
          { name: 'ThingProxy', url: `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(websiteUrl)}` },
          { name: 'CORS.SH', url: `https://cors.sh/${websiteUrl}`, headers: { 'x-cors-api-key': 'temp_demo' } },
          { name: 'Corsproxy.io', url: `https://corsproxy.io/?${encodeURIComponent(websiteUrl)}` },
          { name: 'CodeTabs', url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(websiteUrl)}` }
        ];

        for (const proxy of proxies) {
          try {
            console.log(`📡 Trying ${proxy.name}...`);
            const response = await fetch(proxy.url, {
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                ...(proxy.headers || {})
              },
              signal: AbortSignal.timeout(15000)
            });

            if (response.ok) {
              const data = await response.text();
              if (data && data.length > 100) {
                htmlContent = data;
                fetchMethod = `CORS proxy (${proxy.name})`;
                console.log(`✅ ${proxy.name} succeeded! HTML length: ${htmlContent.length}`);
                break;
              } else {
                console.warn(`⚠️ ${proxy.name} returned minimal content`);
              }
            } else {
              console.warn(`⚠️ ${proxy.name} failed with status: ${response.status}`);
            }
          } catch (proxyError: any) {
            console.warn(`❌ ${proxy.name} error:`, proxyError.message);
            continue;
          }
        }
      }

      // STEP 3: Try web scraping APIs (for JavaScript-rendered sites)
      if (!htmlContent) {
        console.log('🔄 Trying web scraping APIs for JavaScript rendering...');

        // Try ScraperAPI (free tier available)
        try {
          console.log('📡 Trying ScraperAPI...');
          const scraperApiKey = import.meta.env.VITE_SCRAPERAPI_KEY;
          if (scraperApiKey) {
            const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(websiteUrl)}&render=true`;
            const response = await fetch(scraperUrl, { signal: AbortSignal.timeout(30000) });
            if (response.ok) {
              htmlContent = await response.text();
              fetchMethod = 'ScraperAPI (JavaScript rendered)';
              console.log(`✅ ScraperAPI succeeded! HTML length: ${htmlContent.length}`);
            }
          }
        } catch (error: any) {
          console.warn('⚠️ ScraperAPI failed:', error.message);
        }
      }

      // STEP 4: Try ScrapingBee (alternative scraping service)
      if (!htmlContent) {
        try {
          console.log('📡 Trying ScrapingBee...');
          const scrapingBeeKey = import.meta.env.VITE_SCRAPINGBEE_API_KEY;
          if (scrapingBeeKey) {
            const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(websiteUrl)}&render_js=true`;
            const response = await fetch(scrapingBeeUrl, { signal: AbortSignal.timeout(30000) });
            if (response.ok) {
              htmlContent = await response.text();
              fetchMethod = 'ScrapingBee (JavaScript rendered)';
              console.log(`✅ ScrapingBee succeeded! HTML length: ${htmlContent.length}`);
            }
          }
        } catch (error: any) {
          console.warn('⚠️ ScrapingBee failed:', error.message);
        }
      }

      // STEP 5: Try Supabase Edge Function (if available)
      if (!htmlContent) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
          try {
            console.log('📡 Trying Supabase Edge Function...');
            const response = await fetch(`${supabaseUrl}/functions/v1/fetch-rendered-html`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
              },
              body: JSON.stringify({ url: websiteUrl }),
              signal: AbortSignal.timeout(30000)
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.html) {
                htmlContent = result.html;
                fetchMethod = `Supabase Edge Function (${result.method})`;
                console.log(`✅ Supabase Edge Function succeeded`);
              }
            }
          } catch (edgeError: any) {
            console.warn('⚠️ Supabase Edge Function failed:', edgeError.message);
          }
        }
      }

      // STEP 6: Try RapidAPI web scraping services
      if (!htmlContent) {
        try {
          console.log('📡 Trying RapidAPI web scraper...');
          const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
          if (rapidApiKey) {
            const response = await fetch('https://web-scraping-api1.p.rapidapi.com/v1/scrape', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': 'web-scraping-api1.p.rapidapi.com'
              },
              body: JSON.stringify({
                url: websiteUrl,
                render_js: true
              }),
              signal: AbortSignal.timeout(30000)
            });

            if (response.ok) {
              const result = await response.json();
              if (result.html) {
                htmlContent = result.html;
                fetchMethod = 'RapidAPI Web Scraper (JavaScript rendered)';
                console.log(`✅ RapidAPI succeeded! HTML length: ${htmlContent.length}`);
              }
            }
          }
        } catch (error: any) {
          console.warn('⚠️ RapidAPI failed:', error.message);
        }
      }

      // STEP 7: Check if we got any content
      if (!htmlContent || htmlContent.length < 100) {
        console.error('❌ Failed to fetch website HTML');
        console.error('   Website:', websiteUrl);
        console.error('   All methods failed:');
        console.error('   ✗ Direct fetch');
        console.error('   ✗ 5 CORS proxy services');
        console.error('   ✗ ScraperAPI');
        console.error('   ✗ ScrapingBee');
        console.error('   ✗ Supabase Edge Function');
        console.error('   ✗ RapidAPI Web Scraper');
        console.error('   This website may be blocking automated access or have strict CORS/bot protection');
        return [];
      }

      console.log(`✅ Successfully fetched website HTML using: ${fetchMethod}`);
      console.log(`📄 HTML content length: ${htmlContent.length} characters`);

      // STEP 8: Extract social links from the HTML
      const extractedProfiles = await this.extractSocialLinksFromHTML(htmlContent);

      // STEP 9: If no social links found and the HTML suggests JavaScript rendering, inform the user
      if (extractedProfiles.length === 0) {
        const isJavaScriptSite = this.detectJavaScriptRenderedSite(htmlContent);
        if (isJavaScriptSite) {
          console.warn('⚠️ This website appears to use JavaScript rendering (React/Next.js/Vue)');
          console.warn('   Social media links may be added dynamically after page load');
          console.warn('   The initial HTML does not contain social media links');
          console.warn('   💡 SOLUTIONS:');
          console.warn('   1. Use ScraperAPI: https://www.scraperapi.com (1000 free requests)');
          console.warn('   2. Use ScrapingBee: https://www.scrapingbee.com (1000 free requests)');
          console.warn('   3. Use RapidAPI: https://rapidapi.com/hub (various scraping APIs)');
          console.warn('   4. Deploy Supabase Edge Function with ScrapingBee integration');
          console.warn('   5. Manually add your social media URLs on the connection page');
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

  private async extractSocialLinksFromHTML(html: string): Promise<SocialMediaProfile[]> {
    const profiles: SocialMediaProfile[] = [];
    const foundUrls = new Set<string>();

    console.log('🔍 Starting social media extraction from HTML...');

    // Helper function to normalize URLs for deduplication AND storage
    const normalizeForDedup = (url: string): string => {
      return this.normalizeUrl(url)
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/^m\./, '')
        .replace(/\/$/, '')
        .split('?')[0]
        .split('#')[0];
    };

    // Helper function to create clean URL for storage (with https://)
    const createCleanUrl = (url: string): string => {
      const normalized = this.normalizeUrl(url)
        .replace(/^www\./, '')
        .replace(/^m\./, '')
        .replace(/\/$/, '')
        .split('?')[0]
        .split('#')[0];
      return normalized;
    };

    // STEP 1: Extract ALL href attributes that might contain social media links
    const allHrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);
    let hrefCount = 0;

    for (const match of allHrefMatches) {
      hrefCount++;
      const url = match[1];

      // Check if this URL contains any social media domain
      const socialDomains = this.socialPlatforms.flatMap(p => p.domains);
      const containsSocialDomain = socialDomains.some(domain => url.toLowerCase().includes(domain));

      if (containsSocialDomain) {
        const normalizedForDedup = normalizeForDedup(url);

        if (!foundUrls.has(normalizedForDedup)) {
          foundUrls.add(normalizedForDedup);
          const platform = this.identifyPlatform(url);

          if (platform) {
            const username = this.extractUsername(url, platform);
            const cleanUrl = createCleanUrl(url);
            console.log(`✅ Found ${platform.name} link: ${url} → cleaned: ${cleanUrl} (username: ${username})`);

            profiles.push({
              platform: platform.name,
              url: cleanUrl,
              username,
              completeness: 70 // Higher confidence for href-extracted links
            });
          }
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
          const normalizedForDedup = normalizeForDedup(url);

          if (!foundUrls.has(normalizedForDedup)) {
            foundUrls.add(normalizedForDedup);
            const username = match[1];
            const cleanUrl = createCleanUrl(url);

            console.log(`✅ Found ${platform.name} via pattern: ${url} → cleaned: ${cleanUrl} (username: ${username})`);

            profiles.push({
              platform: platform.name,
              url: cleanUrl,
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
    // Note: Facebook share links are allowed through because they redirect to actual profiles when clicked
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

    // Platform-specific checks FIRST (before general banned list)
    if (platform === 'facebook') {
      // Allow profile.php URLs (these are valid Facebook profile URLs with numeric IDs)
      if (u.includes('profile.php?id=')) return true;
      // Block Facebook-specific non-profile URLs
      if (u.includes('facebook.com/') && (u.endsWith('/tr') || u.includes('/events/'))) return false;
    }

    // General banned patterns (but already checked platform-specific exceptions above)
    const banned = [
      '/tr', '/watch', '/embed', '/intent', '/sharer.php', 'sharer.php',
      '/oauth', '/dialog', '/plugins/', '/shorts', '/hashtag', '/home', '/i/', '/privacy', '/help'
    ];
    if (banned.some(b => u.includes(b))) return false;

    // Allow Facebook share links since they're valid (they redirect to actual profiles when clicked)
    if (platform === 'facebook' && u.includes('/share/')) {
      return true;
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
    // Fetch real follower counts and engagement data for each profile
    return Promise.all(profiles.map(async (profile) => {
      try {
        const enhancedProfile = { ...profile };

        // Only fetch real data if we don't already have it from earlier enhancement
        if (!enhancedProfile.followers) {
          const realData = await this.fetchRealFollowerCount(profile.platform, profile.url);

          if (realData && realData.followers > 0) {
            enhancedProfile.followers = realData.followers;
            enhancedProfile.engagement = realData.engagement;
            enhancedProfile.verified = realData.verified;
            enhancedProfile.completeness = enhancedProfile.completeness || 90;
          } else {
            // Keep as undefined if we can't fetch real data
            enhancedProfile.completeness = enhancedProfile.completeness || 70;
          }
        }

        return enhancedProfile;
      } catch (error) {
        console.warn(`Failed to enhance profile ${profile.url}:`, error);
        return profile;
      }
    }));
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
      console.log(`📊 Fetching real follower count for ${platform}: ${url}`);

      // METHOD 1: Try scraping the profile page directly (WORKS WITHOUT API KEYS!)
      const scrapedStats = await this.scrapeProfileStats(platform, url);
      if (scrapedStats) {
        console.log(`✅ Got stats from scraping: ${scrapedStats.followers} followers`);
        return scrapedStats;
      }

      // METHOD 2: Try RapidAPI Social Media Stats APIs (if key is configured)
      const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      if (rapidApiKey) {
        const stats = await this.fetchFromRapidAPI(platform, url, rapidApiKey);
        if (stats) {
          console.log(`✅ Got stats from RapidAPI: ${stats.followers} followers`);
          return stats;
        }
      }

      // METHOD 3: Try YouTube API directly (for YouTube only, if key is configured)
      if (platform === 'youtube') {
        const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (youtubeApiKey) {
          const stats = await this.fetchYouTubeStats(url, youtubeApiKey);
          if (stats) {
            console.log(`✅ Got YouTube stats from YouTube API: ${stats.followers} subscribers`);
            return stats;
          }
        }
      }

      // METHOD 4: Try Supabase Edge Function (fallback, if configured)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-social-stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({ platform, url }),
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log(`✅ Got stats from Supabase: ${result.data.followers} followers`);
            return {
              followers: result.data.followers || 0,
              engagement: result.data.engagement || 0,
              verified: result.data.verified || false
            };
          }
        }
      }

      console.warn(`⚠️ Could not fetch stats for ${platform} - all methods failed`);
      return null;
    } catch (error) {
      console.error(`❌ Error fetching real data for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Fetch social media stats from RapidAPI
   * Multiple RapidAPI services available for different platforms
   */
  private async fetchFromRapidAPI(platform: string, url: string, apiKey: string): Promise<{ followers: number; engagement: number; verified: boolean } | null> {
    try {
      // Different RapidAPI endpoints for different platforms
      if (platform === 'instagram') {
        // Instagram Profile API on RapidAPI
        const username = url.split('/').filter(Boolean).pop();
        const response = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            return {
              followers: data.data.follower_count || 0,
              engagement: 0,
              verified: data.data.is_verified || false
            };
          }
        }
      } else if (platform === 'twitter' || platform === 'x') {
        // Twitter/X API on RapidAPI
        const username = url.split('/').filter(Boolean).pop();
        const response = await fetch(`https://twitter154.p.rapidapi.com/user/details?username=${username}`, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'twitter154.p.rapidapi.com'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.followers_count) {
            return {
              followers: data.followers_count || 0,
              engagement: 0,
              verified: data.is_blue_verified || false
            };
          }
        }
      } else if (platform === 'tiktok') {
        // TikTok API on RapidAPI
        const username = url.split('@').pop()?.split('/')[0];
        const response = await fetch(`https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${username}`, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data?.user) {
            return {
              followers: data.data.user.followerCount || 0,
              engagement: 0,
              verified: data.data.user.verified || false
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.warn(`⚠️ RapidAPI fetch failed for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Fetch YouTube stats using YouTube Data API v3
   */
  private async fetchYouTubeStats(url: string, apiKey: string): Promise<{ followers: number; engagement: number; verified: boolean } | null> {
    try {
      // Extract channel ID or username from URL
      let channelId = '';

      if (url.includes('/channel/')) {
        channelId = url.split('/channel/')[1].split('/')[0].split('?')[0];
      } else if (url.includes('/@')) {
        // Need to resolve @username to channel ID first
        const username = url.split('/@')[1].split('/')[0].split('?')[0];
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${username}&key=${apiKey}`,
          { signal: AbortSignal.timeout(10000) }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            channelId = searchData.items[0].id;
          }
        }
      }

      if (!channelId) return null;

      // Fetch channel statistics
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const stats = data.items[0].statistics;
          return {
            followers: parseInt(stats.subscriberCount) || 0,
            engagement: 0,
            verified: false
          };
        }
      }

      return null;
    } catch (error) {
      console.warn('⚠️ YouTube API fetch failed:', error);
      return null;
    }
  }

  /**
   * Scrape profile page for follower count (WORKS WITHOUT ANY API KEYS!)
   * This method tries to extract follower counts from the HTML
   */
  private async scrapeProfileStats(platform: string, url: string): Promise<{ followers: number; engagement: number; verified: boolean } | null> {
    try {
      console.log(`🔍 Attempting to scrape ${platform} profile for stats...`);
      let html = '';
      let usedProxy = false;

      // Try multiple CORS proxies in sequence
      const proxies = [
        null, // Direct fetch first (no proxy)
        `https://api.allorigins.win/raw?url=`,
        `https://corsproxy.io/?`,
        `https://api.codetabs.com/v1/proxy?quest=`
      ];

      for (const proxy of proxies) {
        try {
          const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
          const response = await fetch(fetchUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            signal: AbortSignal.timeout(proxy ? 15000 : 10000)
          });

          if (response.ok) {
            html = await response.text();
            if (html && html.length > 100) {
              usedProxy = proxy !== null;
              console.log(`✅ Fetched HTML via ${proxy ? 'CORS proxy' : 'direct fetch'} (${html.length} chars)`);
              break;
            }
          }
        } catch (error) {
          continue; // Try next proxy
        }
      }

      if (!html || html.length < 100) {
        console.warn(`⚠️ Could not fetch HTML for ${platform} profile`);
        return null;
      }

      // Platform-specific scraping patterns (multiple patterns per platform for better success rate)
      let followers = 0;
      let verified = false;

      if (platform === 'instagram') {
        // Pattern 1: JSON data in script tag
        let match = html.match(/"edge_followed_by":\s*{\s*"count":\s*(\d+)/);
        if (match) followers = parseInt(match[1]);

        // Pattern 2: Meta tags
        if (!followers) {
          match = html.match(/content="(\d+)\s+Followers/i);
          if (match) followers = parseInt(match[1]);
        }

        // Pattern 3: Formatted count (1.5M followers)
        if (!followers) {
          match = html.match(/(\d+(?:\.\d+)?[KkMm]?)\s+followers/i);
          if (match) followers = this.parseFormattedNumber(match[1]);
        }

        // Check for verified badge
        verified = html.includes('"is_verified":true') || html.includes('Verified');

      } else if (platform === 'twitter' || platform === 'x') {
        // Pattern 1: JSON data
        let match = html.match(/"followers_count":(\d+)/);
        if (match) followers = parseInt(match[1]);

        // Pattern 2: Formatted text
        if (!followers) {
          match = html.match(/(\d+(?:\.\d+)?[KkMm]?)\s+Followers/i);
          if (match) followers = this.parseFormattedNumber(match[1]);
        }

        // Check for verified
        verified = html.includes('"verified":true') || html.includes('Verified account');

      } else if (platform === 'linkedin') {
        // Pattern 1: With commas
        let match = html.match(/(\d+(?:,\d+)*)\s+followers/i);
        if (match) followers = parseInt(match[1].replace(/,/g, ''));

        // Pattern 2: Formatted (1.5K followers)
        if (!followers) {
          match = html.match(/(\d+(?:\.\d+)?[KkMm]?)\s+followers/i);
          if (match) followers = this.parseFormattedNumber(match[1]);
        }

      } else if (platform === 'facebook') {
        // Pattern 1: Page likes with formatting
        let match = html.match(/(\d+(?:,\d+)*(?:\.\d+)?[KkMm]?)\s+(?:likes|people like this|followers)/i);
        if (match) followers = this.parseFormattedNumber(match[1].replace(/,/g, ''));

        // Pattern 2: Meta tags
        if (!followers) {
          match = html.match(/content="(\d+)\s+people like this/i);
          if (match) followers = parseInt(match[1]);
        }

      } else if (platform === 'youtube') {
        // Pattern 1: Subscriber count
        let match = html.match(/(\d+(?:\.\d+)?[KkMmBb]?)\s+subscribers/i);
        if (match) followers = this.parseFormattedNumber(match[1]);

        // Pattern 2: JSON data
        if (!followers) {
          match = html.match(/"subscriberCountText".*?"simpleText":"([\d.KMB]+)\s+subscribers"/i);
          if (match) followers = this.parseFormattedNumber(match[1]);
        }

      } else if (platform === 'tiktok') {
        // Pattern 1: Follower count
        let match = html.match(/"followerCount":(\d+)/);
        if (match) followers = parseInt(match[1]);

        // Pattern 2: Formatted count
        if (!followers) {
          match = html.match(/(\d+(?:\.\d+)?[KkMm]?)\s+Followers/i);
          if (match) followers = this.parseFormattedNumber(match[1]);
        }

        verified = html.includes('"verified":true');
      }

      if (followers > 0) {
        console.log(`✅ Successfully scraped ${platform}: ${followers} followers ${verified ? '(verified)' : ''}`);
        return {
          followers,
          engagement: 0,
          verified
        };
      }

      console.warn(`⚠️ Could not extract follower count from ${platform} HTML`);
      return null;
    } catch (error) {
      console.warn(`⚠️ Profile scraping failed for ${platform}:`, error);
      return null;
    }
  }

  /**
   * Parse formatted numbers like "1.5K", "2M", "500" into actual numbers
   */
  private parseFormattedNumber(str: string): number {
    const cleaned = str.toLowerCase().replace(/,/g, '');

    if (cleaned.includes('b')) {
      return Math.floor(parseFloat(cleaned) * 1000000000);
    } else if (cleaned.includes('m')) {
      return Math.floor(parseFloat(cleaned) * 1000000);
    } else if (cleaned.includes('k')) {
      return Math.floor(parseFloat(cleaned) * 1000);
    } else {
      return parseInt(cleaned) || 0;
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