import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Link,
  Zap,
  Loader2,
  ExternalLink,
  Users,
  Eye,
  Star,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SocialMediaData,
  socialMediaDetector,
} from "@/utils/socialMediaDetector";

const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID as
  | string
  | undefined;
const FACEBOOK_CLIENT_SECRET = import.meta.env.VITE_FACEBOOK_CLIENT_SECRET as
  | string
  | undefined;
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID as
  | string
  | undefined;
// const _LINKEDIN_CLIENT_SECRET = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET as string | undefined;
const X_CLIENT_ID = import.meta.env.VITE_X_CLIENT_ID as string | undefined;
const REDIRECT_URI =
  (import.meta.env.VITE_REDIRECT_URI as string | undefined) ?? "";

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  placeholder: string;
  description: string;
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: "facebook",
    name: "Facebook",
    icon: Facebook,
    color: "bg-blue-600",
    placeholder: "https://facebook.com/yourbusiness",
    description: "Page insights and engagement metrics",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "bg-gradient-to-br from-purple-600 to-pink-600",
    placeholder: "https://instagram.com/yourbusiness",
    description: "Profile analytics and content performance",
  },
  {
    id: "threads",
    name: "Threads",
    icon: MessageCircle,
    color: "bg-black",
    placeholder: "https://threads.net/@yourbusiness",
    description: "Conversation engagement and community metrics",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    color: "bg-blue-400",
    placeholder: "https://twitter.com/yourbusiness",
    description: "Tweet engagement and follower analytics",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-700",
    placeholder: "https://linkedin.com/company/yourbusiness",
    description: "Professional network and company insights",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "bg-red-600",
    placeholder: "https://youtube.com/@yourbusiness",
    description: "Video content and subscriber metrics",
  },
];

const SocialConnection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [socialUrls, setSocialUrls] = useState<Record<string, string>>({});
  const [connectedAccounts, setConnectedAccounts] = useState<
    Record<string, boolean>
  >({});
  const [activeTab, setActiveTab] = useState("detected");
  const [detectedSocialData, setDetectedSocialData] =
    useState<SocialMediaData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasRunDetection, setHasRunDetection] = useState(false);
  const [siteUrl, setSiteUrl] = useState<string>("");
  const [bizName, setBizName] = useState<string>("");
  const [, setIsAuthenticated] = useState(false);
  const [, setFacebookAccessToken] = useState<string | null>(null);
  const [, setIsFetchingFacebookData] = useState(false);

  useEffect(() => {
    checkUserAndBusiness();
  }, []);

  useEffect(() => {
    // Run social media detection when the page loads and we have business data
    if (businessId && !hasRunDetection) {
      runSocialMediaDetection();
    }
  }, [businessId, hasRunDetection]);

  const checkUserAndBusiness = async () => {
    try {
      // Check if we have registration data in localStorage (step 2 completed but not yet created account)
      const registrationData = localStorage.getItem("registrationData");
      const businessWebsiteUrl = localStorage.getItem("businessWebsiteUrl");
      const businessName = localStorage.getItem("businessName");
      const isGuest = localStorage.getItem("isGuestUser") === "true";

      // For guest users, skip Supabase auth entirely
      if (isGuest) {
        console.log(
          "Guest user detected in SocialConnection - skipping Supabase auth"
        );
        const tempBusinessId =
          localStorage.getItem("currentBusinessId") || `guest_${Date.now()}`;
        setBusinessId(tempBusinessId);
        setSiteUrl(businessWebsiteUrl || "");
        setBizName(businessName || "");
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
      }

      if (error || !user) {
        // Allow access if we have registration data (user is in the middle of the flow)
        if (registrationData && businessWebsiteUrl && businessName) {
          console.log(
            "No authenticated user yet, but registration data found - allowing access"
          );
          // Create a temporary business ID for the flow
          const tempBusinessId = `temp_${Date.now()}`;
          localStorage.setItem("currentBusinessId", tempBusinessId);
          setBusinessId(tempBusinessId);
          setSiteUrl(businessWebsiteUrl);
          setBizName(businessName);
          return;
        }

        console.log(
          "No authenticated user and no registration data, redirecting to home"
        );
        navigate("/");
        return;
      }
      setUser(user);

      const currentBusinessId = localStorage.getItem("currentBusinessId");
      if (!currentBusinessId) {
        console.log("No business ID found, redirecting to setup");
        navigate("/setup");
        return;
      }
      setBusinessId(currentBusinessId);

      // Ensure we use canonical business data from DB (avoid typos in localStorage)
      const { data: business, error: bizErr } = await supabase
        .from("businesses")
        .select("business_name, website_url")
        .eq("id", currentBusinessId)
        .maybeSingle();
      if (!bizErr && business) {
        const normalizedUrl = business.website_url?.startsWith("http")
          ? business.website_url
          : `https://${business.website_url}`;
        if (normalizedUrl) {
          localStorage.setItem("businessWebsiteUrl", normalizedUrl);
          setSiteUrl(normalizedUrl);
        }
        if (business.business_name) {
          localStorage.setItem("businessName", business.business_name);
          setBizName(business.business_name);
        }
        console.log("Using website URL from DB for detection:", normalizedUrl);
      }

      // Load existing social accounts
      await loadExistingSocialAccounts(currentBusinessId);

      // CRITICAL FIX: Check if the cached detection data matches the current business
      const cachedBusinessId = localStorage.getItem(
        "detectedSocialMediaBusinessId"
      );
      const detectedData = localStorage.getItem("detectedSocialMedia");

      // Only use cached data if it's for the CURRENT business
      if (detectedData && cachedBusinessId === currentBusinessId) {
        try {
          const parsed: SocialMediaData = JSON.parse(detectedData);
          setDetectedSocialData(parsed);
          console.log(
            "Loaded detected social media data for current business:",
            parsed
          );

          // If we have detected profiles, prefill the manual URLs
          if (parsed.platforms && parsed.platforms.length > 0) {
            const urlMap: Record<string, string> = {};
            parsed.platforms.forEach((profile) => {
              urlMap[profile.platform] = profile.url;
            });
            setSocialUrls((prev) => ({ ...prev, ...urlMap }));

            // Ensure detected profiles are persisted to DB as well
            await saveDetectedProfiles(parsed.platforms);
          }
        } catch (error) {
          console.log("Failed to parse detected social media data:", error);
        }
      } else {
        // Clear old cached data if it's from a different business
        console.log(
          "Clearing cached social media data from different business"
        );
        localStorage.removeItem("detectedSocialMedia");
        localStorage.removeItem("detectedSocialMediaBusinessId");
      }
    } catch (err) {
      console.error("Error checking user and business:", err);
      navigate("/");
    }
  };

  // Fetch Twitter followers using Supabase edge function (server-side to avoid CORS)
  const fetchTwitterFollowersDirectly = async (username: string): Promise<number | null> => {
    try {
      console.log(`📱 Fetching Twitter followers for @${username} via edge function...`);

      const response = await supabase.functions.invoke('fetch-twitter-followers', {
        body: { username },
      });

      console.log(`📊 Edge function response:`, response);

      if (response.error) {
        console.error(`❌ Edge function error:`, response.error);
        return null;
      }

      // Check if response.data has followers_count
      if (response.data) {
        console.log(`📄 Response data:`, JSON.stringify(response.data));

        const followersCount = response.data.followers_count;

        if (followersCount && followersCount > 0) {
          console.log(`✅ Twitter followers for @${username}: ${followersCount}`);
          return followersCount;
        } else {
          console.warn(`⚠️ No followers count in response for @${username}, data:`, response.data);
        }
      } else {
        console.warn(`⚠️ No data in response for @${username}`, response);
      }

      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch Twitter followers:`, error);
      return null;
    }
  };

  // Fetch LinkedIn followers by scraping the profile page
  const fetchLinkedInFollowers = async (usernameOrUrl: string): Promise<number | null> => {
    try {
      // Determine if input is a full URL or just username
      let linkedInUrl: string;

      if (usernameOrUrl.startsWith('http://') || usernameOrUrl.startsWith('https://')) {
        // It's already a full URL, use it as-is
        linkedInUrl = usernameOrUrl;
      } else {
        // It's just a username, build the URL
        const cleanUsername = usernameOrUrl.toLowerCase().trim();
        linkedInUrl = cleanUsername.includes('company/')
          ? `https://www.linkedin.com/company/${cleanUsername.replace('company/', '')}`
          : `https://www.linkedin.com/in/${cleanUsername}`;
      }

      console.log(`💼 Fetching LinkedIn followers from: ${linkedInUrl}`);
      console.log(`🔗 LinkedIn URL:`, linkedInUrl);

      // Try to fetch LinkedIn profile
      let htmlContent = '';

      // Method 1: Try direct fetch
      try {
        console.log(`📡 Attempting direct fetch...`);
        const directResponse = await fetch(linkedInUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (directResponse.ok) {
          htmlContent = await directResponse.text();
          console.log(`✅ Direct fetch succeeded`);
        }
      } catch (directError) {
        console.log(`⚠️ Direct fetch failed, trying CORS proxies...`);

        // Method 2: Try multiple CORS proxy services
        const corsProxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(linkedInUrl)}`,
          `https://cors-anywhere.herokuapp.com/${linkedInUrl}`,
          `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(linkedInUrl)}`
        ];

        for (const corsProxyUrl of corsProxies) {
          try {
            console.log(`📡 Trying CORS proxy: ${corsProxyUrl.substring(0, 50)}...`);
            const corsResponse = await fetch(corsProxyUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });
            if (corsResponse.ok) {
              htmlContent = await corsResponse.text();
              console.log(`✅ CORS proxy succeeded (length: ${htmlContent.length})`);
              break;
            }
          } catch (corsError) {
            console.log(`⚠️ CORS proxy failed, trying next...`);
          }
        }
      }

      if (!htmlContent) {
        console.warn(`⚠️ Could not fetch LinkedIn page for ${linkedInUrl}`);
        return null;
      }

      console.log(`📄 Searching for followers in HTML (length: ${htmlContent.length})`);

      // Extract followers count from LinkedIn page
      let followersCount = null;

      // Pattern 1: Look for follower count in JSON-LD or meta data
      const jsonPatterns = [
        /"numberOfFollowers"["\s]*:["\s]*(\d+)/,
        /followers["\s]*:["\s]*(\d+)/i,
        /"followers"["\s]*:["\s]*"?(\d+)"?/i,
        /followers["\s]+=\s*(\d+)/i
      ];

      for (const pattern of jsonPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
          followersCount = parseInt(match[1], 10);
          console.log(`✅ Found followers using pattern: ${followersCount}`);
          if (followersCount > 0) break;
        }
      }

      // Pattern 2: Look in meta tags (og:description)
      if (!followersCount) {
        const metaMatch = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
        if (metaMatch && metaMatch[1]) {
          const descMatch = metaMatch[1].match(/(\d+[KMB]?)\s*(?:followers?|connections?)/i);
          if (descMatch && descMatch[1]) {
            let countStr = descMatch[1];
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
            console.log(`✅ Found followers in meta: ${followersCount}`);
          }
        }
      }

      // Pattern 3: Look for text patterns with K, M, B notation
      if (!followersCount) {
        const textPatterns = [
          /(\d+[.,]\d+[KMB])\s*(?:followers?|connections?)/i,
          /(\d+[KMB])\s*(?:followers?|connections?)/i,
          /\b(\d+)\s*(?:followers?|connections?)\b/i
        ];

        for (const pattern of textPatterns) {
          const match = htmlContent.match(pattern);
          if (match && match[1]) {
            let countStr = match[1].replace(/[.,]/g, '');
            console.log(`🔍 Found potential count: ${countStr}`);

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

            if (followersCount > 0) {
              console.log(`✅ Converted to: ${followersCount}`);
              break;
            }
          }
        }
      }

      if (followersCount && followersCount > 0) {
        console.log(`✅ LinkedIn followers: ${followersCount}`);
        return followersCount;
      }

      console.log(`⚠️ Could not extract followers count from HTML`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch LinkedIn followers:`, error);
      return null;
    }
  };

  // Fetch Instagram followers by scraping public profile
  const fetchInstagramFollowers = async (username: string): Promise<number | null> => {
    try {
      const instagramUrl = `https://www.instagram.com/${username}/`;
      console.log(`📸 Fetching Instagram followers for @${username}`);
      console.log(`🔗 Instagram URL: ${instagramUrl}`);

      let htmlContent = '';

      // Try multiple CORS proxies
      const corsProxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(instagramUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(instagramUrl)}`,
        `https://cors-anywhere.herokuapp.com/${instagramUrl}`
      ];

      for (const corsProxyUrl of corsProxies) {
        try {
          console.log(`📡 Trying CORS proxy...`);
          const corsResponse = await fetch(corsProxyUrl, {
            signal: AbortSignal.timeout(10000),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (corsResponse.ok) {
            htmlContent = await corsResponse.text();
            console.log(`✅ CORS proxy succeeded (length: ${htmlContent.length})`);
            break;
          }
        } catch (corsError) {
          console.log(`⚠️ CORS proxy failed, trying next...`);
        }
      }

      if (!htmlContent) {
        console.warn(`⚠️ Could not fetch Instagram page for @${username}`);
        return null;
      }

      console.log(`📄 Searching for followers in HTML (length: ${htmlContent.length})`);

      // Extract followers from Instagram JSON data in HTML
      let followersCount = null;

      // Pattern 1: Look for edge_followed_by in JSON
      const jsonPattern = /"edge_followed_by":\s*{\s*"count":\s*(\d+)/;
      const match = htmlContent.match(jsonPattern);
      if (match && match[1]) {
        followersCount = parseInt(match[1], 10);
        console.log(`✅ Found Instagram followers: ${followersCount}`);
      }

      // Pattern 2: Alternative JSON structure
      if (!followersCount) {
        const altPattern = /"followed_by_count":\s*(\d+)/;
        const altMatch = htmlContent.match(altPattern);
        if (altMatch && altMatch[1]) {
          followersCount = parseInt(altMatch[1], 10);
          console.log(`✅ Found Instagram followers (alt pattern): ${followersCount}`);
        }
      }

      // Pattern 3: Meta tag content
      if (!followersCount) {
        const metaPattern = /"follower_count":\s*(\d+)/;
        const metaMatch = htmlContent.match(metaPattern);
        if (metaMatch && metaMatch[1]) {
          followersCount = parseInt(metaMatch[1], 10);
          console.log(`✅ Found Instagram followers (meta): ${followersCount}`);
        }
      }

      if (followersCount && followersCount > 0) {
        return followersCount;
      }

      console.log(`⚠️ Could not extract Instagram followers count`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch Instagram followers:`, error);
      return null;
    }
  };

  // Fetch Facebook page followers by scraping
  const fetchFacebookFollowers = async (pageName: string): Promise<number | null> => {
    try {
      const facebookUrl = `https://www.facebook.com/${pageName}`;
      console.log(`📘 Fetching Facebook followers for ${pageName}`);
      console.log(`🔗 Facebook URL: ${facebookUrl}`);

      let htmlContent = '';

      // Try multiple CORS proxies
      const corsProxies = [
        `https://api.allorigins.win/raw?url=${encodeURIComponent(facebookUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(facebookUrl)}`,
        `https://cors-anywhere.herokuapp.com/${facebookUrl}`
      ];

      for (const corsProxyUrl of corsProxies) {
        try {
          console.log(`📡 Trying CORS proxy...`);
          const corsResponse = await fetch(corsProxyUrl, {
            signal: AbortSignal.timeout(10000),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          if (corsResponse.ok) {
            htmlContent = await corsResponse.text();
            console.log(`✅ CORS proxy succeeded (length: ${htmlContent.length})`);
            break;
          }
        } catch (corsError) {
          console.log(`⚠️ CORS proxy failed, trying next...`);
        }
      }

      if (!htmlContent) {
        console.warn(`⚠️ Could not fetch Facebook page for ${pageName}`);
        return null;
      }

      console.log(`📄 Searching for followers in HTML (length: ${htmlContent.length})`);

      // Extract followers from Facebook JSON or meta data
      let followersCount = null;

      // Pattern 1: Look for follower count in JSON-LD
      const patterns = [
        /"followerCount":"(\d+)"/,
        /"subscriber_count":"(\d+)"/,
        /"fanCount":"(\d+)"/,
        /(\d+[.,]\d+[KMB]?)\s*(?:people follow|followers?|likes?)/i,
        /(\d+[KMB]?)\s*(?:people follow|followers?|likes?)/i
      ];

      for (const pattern of patterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
          let countStr = match[1];

          // Handle K, M, B notation
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
            followersCount = parseInt(countStr.replace(/[.,]/g, ''), 10);
          }

          console.log(`✅ Found Facebook followers using pattern: ${followersCount}`);
          if (followersCount > 0) break;
        }
      }

      if (followersCount && followersCount > 0) {
        return followersCount;
      }

      console.log(`⚠️ Could not extract Facebook followers count`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch Facebook followers:`, error);
      return null;
    }
  };

  // Fetch YouTube subscribers directly from YouTube API
  const fetchYouTubeSubscribers = async (channelId: string): Promise<number | null> => {
    try {
      const youtubeApiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      console.log(`🔑 YouTube API Key available:`, !!youtubeApiKey);
      if (youtubeApiKey) {
        console.log(`🔑 YouTube API Key (first 20 chars):`, youtubeApiKey.substring(0, 20) + '...');
      }

      if (!youtubeApiKey) {
        console.error('❌ VITE_YOUTUBE_API_KEY not configured in environment');
        return null;
      }

      console.log(`🔍 Fetching YouTube data for channel: ${channelId}`);
      const url = `https://www.googleapis.com/youtube/v3/channels?id=${encodeURIComponent(channelId)}&part=statistics&key=${youtubeApiKey}`;
      console.log(`📡 YouTube API URL:`, url.substring(0, 80) + '...');

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ YouTube API error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      console.log(`📊 YouTube API Response:`, data);

      const subscriberCount = data.items?.[0]?.statistics?.subscriberCount;

      if (subscriberCount && subscriberCount !== 'unlisted') {
        const count = parseInt(subscriberCount, 10);
        console.log(`✅ YouTube subscribers for ${channelId}: ${count}`);
        return count;
      }
      console.log(`⚠️ YouTube subscribers unlisted or unavailable for ${channelId}`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch YouTube subscribers:`, error);
      return null;
    }
  };

  // Fetch TikTok followers by scraping the profile page
  const fetchTikTokFollowers = async (username: string): Promise<number | null> => {
    try {
      // Clean up username - remove @ symbol if present
      const cleanUsername = username.replace(/^@/, '');
      const tiktokUrl = `https://www.tiktok.com/@${cleanUsername}`;

      console.log(`📱 Fetching TikTok followers for @${cleanUsername}...`);
      console.log(`🔗 TikTok URL:`, tiktokUrl);

      // Try to fetch directly first
      let htmlContent = '';

      // Method 1: Try direct fetch
      try {
        console.log(`📡 Attempting direct fetch...`);
        const directResponse = await fetch(tiktokUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (directResponse.ok) {
          htmlContent = await directResponse.text();
          console.log(`✅ Direct fetch succeeded`);
        }
      } catch (directError) {
        console.log(`⚠️ Direct fetch failed, trying CORS proxy...`);

        // Method 2: Use CORS proxy (AllOrigins)
        try {
          const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(tiktokUrl)}`;
          const corsResponse = await fetch(corsProxyUrl);
          if (corsResponse.ok) {
            htmlContent = await corsResponse.text();
            console.log(`✅ CORS proxy fetch succeeded`);
          }
        } catch (corsError) {
          console.warn(`⚠️ CORS proxy also failed`);
        }
      }

      if (!htmlContent) {
        console.warn(`⚠️ Could not fetch TikTok page for @${cleanUsername}`);
        return null;
      }

      console.log(`📄 Searching for followers in HTML (length: ${htmlContent.length})`);

      // Extract followers count from HTML
      let followersCount = null;

      // Try different patterns to extract followers
      // Pattern 1: Look for followerCount in JSON data (most common in TikTok)
      const jsonPatterns = [
        /"followerCount":(\d+)/,
        /"follower_count":(\d+)/,
        /followerCount["\']?\s*:\s*(\d+)/,
        /"followerCount":"(\d+)"/,
        /followerCount[\s]*=[\s]*(\d+)/,
        /"followerCount"[\s]*:[\s]*"?(\d+)"?/,
        /"stats"[^}]*"followerCount"[^}]*:[\s]*(\d+)/
      ];

      for (const pattern of jsonPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1]) {
          followersCount = parseInt(match[1], 10);
          console.log(`✅ Found followers using pattern: ${pattern}, count: ${followersCount}`);
          if (followersCount > 0) break;
        }
      }

      // Pattern 2: Look in meta tags
      if (!followersCount) {
        const metaMatch = htmlContent.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
        if (metaMatch && metaMatch[1]) {
          const descMatch = metaMatch[1].match(/(\d+[KMB]?)\s*(?:Followers?|followers?)/i);
          if (descMatch && descMatch[1]) {
            let countStr = descMatch[1];
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
            console.log(`✅ Found followers in meta description: ${followersCount}`);
          }
        }
      }

      // Pattern 3: Look for follower count in text with K, M, B notation
      if (!followersCount) {
        const textPatterns = [
          /["']?followerCount["']?\s*[:=]\s*["']?([0-9.]+[KMB]?)["']?/i,
          /Followers?["\s:]+([0-9.]+[KMB]?)\b/i,
          /\b([0-9]+[.][0-9]+[KMB])\s*followers?\b/i,
        ];

        for (const pattern of textPatterns) {
          const match = htmlContent.match(pattern);
          if (match && match[1]) {
            let countStr = match[1];
            console.log(`🔍 Found potential count: ${countStr}`);

            // Convert K, M, B notation to actual numbers
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

            console.log(`✅ Converted to: ${followersCount}`);
            if (followersCount > 0) break;
          }
        }
      }

      // Pattern 4: Last resort - look for any large number in the page that could be followers
      if (!followersCount) {
        // Search for patterns like "stats":{...followerCount...}
        const statsMatch = htmlContent.match(/"stats"\s*:\s*\{[^}]*?"followerCount"\s*:\s*(\d+)/);
        if (statsMatch && statsMatch[1]) {
          followersCount = parseInt(statsMatch[1], 10);
          console.log(`✅ Found followers in stats object: ${followersCount}`);
        }
      }

      if (followersCount && followersCount > 0) {
        console.log(`✅ TikTok followers for @${cleanUsername}: ${followersCount}`);
        return followersCount;
      }

      console.log(`⚠️ Could not extract followers count for @${cleanUsername} from HTML`);
      return null;
    } catch (error) {
      console.error(`❌ Failed to fetch TikTok followers:`, error);
      return null;
    }
  };

  // Enrich all detected profiles with followers data
  const enrichSocialFollowers = async (platforms: any[]) => {
    const enrichedPlatforms = [...platforms];
    console.log(`🔄 Starting to enrich ${platforms.length} platforms with followers data`);

    for (let i = 0; i < enrichedPlatforms.length; i++) {
      const platform = enrichedPlatforms[i];
      const platformLower = platform.platform?.toLowerCase();

      try {
        // Twitter/X - Use direct API call
        if (platformLower === 'twitter' || platformLower === 'x') {
          let username = platform.username;

          if (!username && platform.url) {
            const match = platform.url.match(/(?:twitter\.com|x\.com)\/(@?([^/?]+))/);
            username = match ? match[2] : null;
          }

          if (!username) {
            console.warn(`⚠️ Could not extract username for Twitter profile`);
            continue;
          }

          console.log(`📱 Fetching Twitter followers for @${username}`);
          const followers = await fetchTwitterFollowersDirectly(username);

          if (followers !== null) {
            enrichedPlatforms[i] = {
              ...platform,
              followers: followers,
              source: 'twitter-api'
            };
          }
        }

        // YouTube - Use YouTube API directly
        else if (platformLower === 'youtube') {
          console.log(`📱 Fetching YouTube subscribers...`);

          let channelId = platform.username;

          // Try to extract channel ID from URL if not available
          if (!channelId && platform.url) {
            const match = platform.url.match(/(?:youtube\.com\/(?:c|channel|user)\/|@)([^/?]+)/);
            channelId = match ? match[1] : null;
          }

          if (channelId) {
            const subscribers = await fetchYouTubeSubscribers(channelId);
            if (subscribers !== null) {
              enrichedPlatforms[i] = {
                ...platform,
                followers: subscribers,
                source: 'youtube-api'
              };
            }
          } else {
            console.warn(`⚠️ Could not extract YouTube channel ID from ${platform.url}`);
          }
        }

        // TikTok - Use ScrapAPI for direct scraping
        else if (platformLower === 'tiktok') {
          let username = platform.username;

          if (!username && platform.url) {
            // Extract username from URL: https://www.tiktok.com/@username
            const match = platform.url.match(/(?:tiktok\.com\/@?)([^/?]+)/);
            username = match ? match[1] : null;
          }

          if (username) {
            const followers = await fetchTikTokFollowers(username);
            if (followers !== null) {
              enrichedPlatforms[i] = {
                ...platform,
                followers: followers,
                source: 'scrapapi'
              };
            } else {
              console.log(`⚠️ Could not fetch TikTok followers for @${username}`);
            }
          } else {
            console.warn(`⚠️ Could not extract TikTok username from ${platform.url}`);
          }
        }

        // LinkedIn - Fetch followers by scraping
        else if (platformLower === 'linkedin') {
          if (platform.url) {
            // Pass the full URL to preserve company vs personal profile distinction
            const followers = await fetchLinkedInFollowers(platform.url);
            if (followers !== null) {
              enrichedPlatforms[i] = {
                ...platform,
                followers: followers,
                source: 'linkedin-scrape'
              };
            } else {
              console.log(`⚠️ Could not fetch LinkedIn followers for ${platform.url}`);
            }
          } else {
            console.warn(`⚠️ LinkedIn URL not found for platform:`, platform);
          }
        }

        // Instagram & Facebook - Show detected profiles without follower counts
        // These platforms have strong anti-scraping measures and require login
        else if (platformLower === 'instagram' || platformLower === 'facebook') {
          console.log(`📱 ${platform.platform} profile detected: ${platform.url}`);
          console.log(`ℹ️ ${platform.platform} requires authentication - follower count unavailable via scraping`);
          // Keep the platform but mark it as detected without followers
          enrichedPlatforms[i] = {
            ...platform,
            followers: null,
            source: 'detected-no-auth',
            note: 'Follower count unavailable - requires authentication'
          };
        }
      } catch (error) {
        console.error(`Failed to fetch ${platform.platform} followers:`, error);
        // Continue with other platforms even if one fails
      }
    }

    console.log(`✅ Enrichment complete:`, enrichedPlatforms);
    return enrichedPlatforms;
  };

  const runSocialMediaDetection = async (overrideUrl?: string) => {
    if (hasRunDetection && !overrideUrl) return;

    setIsDetecting(true);
    if (!hasRunDetection) setHasRunDetection(true);

    try {
      const websiteUrl = (
        overrideUrl ||
        siteUrl ||
        localStorage.getItem("businessWebsiteUrl") ||
        ""
      ).trim();
      const businessName = (
        bizName ||
        localStorage.getItem("businessName") ||
        ""
      ).toString();

      if (!websiteUrl || !businessName) {
        console.warn("Missing business data for social media detection");
        return;
      }

      toast.info("Detecting social media profiles...", { duration: 3000 });
      console.log("Starting social media detection for:", {
        websiteUrl,
        businessName,
      });

      const socialMediaData = await socialMediaDetector.detectSocialMedia(
        websiteUrl,
        businessName
      );

      // Enrich detected platforms with followers data from all available APIs
      let enrichedData = { ...socialMediaData };
      if (socialMediaData.platforms.length > 0) {
        const enrichedPlatforms = await enrichSocialFollowers(
          socialMediaData.platforms
        );
        enrichedData = { ...socialMediaData, platforms: enrichedPlatforms };
      }

      setDetectedSocialData(enrichedData);

      // CRITICAL FIX: Store the business ID with the cached detection data
      localStorage.setItem(
        "detectedSocialMedia",
        JSON.stringify(enrichedData)
      );
      localStorage.setItem("detectedSocialMediaBusinessId", businessId || "");

      console.log("Social media detection completed:", enrichedData);

      if (enrichedData.platforms.length > 0) {
        toast.success(
          `Found ${enrichedData.platforms.length} social media profiles!`
        );

        // Prefill the manual URLs with detected profiles
        const urlMap: Record<string, string> = {};
        enrichedData.platforms.forEach((profile) => {
          urlMap[profile.platform] = profile.url;
        });
        setSocialUrls((prev) => ({ ...prev, ...urlMap }));

        // Auto-save detected profiles to the database for analysis
        await saveDetectedProfiles(enrichedData.platforms);
      } else {
        toast.info(
          "No social media profiles detected. You can add them manually."
        );
      }
    } catch (error) {
      console.error("Social media detection failed:", error);
      const fallbackData = {
        platforms: [],
        score: 0,
        detectionMethods: ["Error occurred during detection"],
        businessName: localStorage.getItem("businessName"),
      };
      localStorage.setItem("detectedSocialMedia", JSON.stringify(fallbackData));
      localStorage.setItem("detectedSocialMediaBusinessId", businessId || "");
      toast.error(
        "Social media detection encountered issues, but you can add profiles manually."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const loadExistingSocialAccounts = async (businessId: string) => {
    try {
      // Skip database operations for temporary/guest businesses
      const isTemporaryBusiness =
        businessId.startsWith("temp_") || businessId.startsWith("guest_");
      if (isTemporaryBusiness) {
        console.log(
          "Temporary/guest business - skipping database load for social accounts"
        );
        return;
      }

      const { data: accounts, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("business_id", businessId);

      if (error) throw error;

      console.log("Existing social accounts:", accounts);

      const urls: Record<string, string> = {};
      const connected: Record<string, boolean> = {};

      accounts?.forEach((account) => {
        if (account.account_url) {
          urls[account.platform] = account.account_url;
        }
        connected[account.platform] = account.is_connected;
      });

      setSocialUrls(urls);
      setConnectedAccounts(connected);
    } catch (err) {
      console.error("Error loading social accounts:", err);
    }
  };

  // Auto-save detected profiles to DB without overriding existing manual entries
  const saveDetectedProfiles = async (
    profiles: { platform: string; url: string }[]
  ) => {
    if (!businessId || !Array.isArray(profiles) || profiles.length === 0)
      return;

    // Skip database operations for temporary/guest businesses
    const isTemporaryBusiness =
      businessId.startsWith("temp_") || businessId.startsWith("guest_");
    if (isTemporaryBusiness) {
      console.log(
        "Temporary/guest business - skipping database save for detected profiles"
      );
      return;
    }

    try {
      for (const p of profiles) {
        const platform = p.platform;
        const url = (p.url || "").trim();
        if (!platform || !url) continue;

        const { data: existing, error: fetchErr } = await supabase
          .from("social_accounts")
          .select("id, account_url")
          .eq("business_id", businessId)
          .eq("platform", platform)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existing) {
          // Don't overwrite an existing URL; only fill if empty
          if (!existing.account_url) {
            const { error: updateErr } = await supabase
              .from("social_accounts")
              .update({ account_url: url, is_connected: false })
              .eq("id", existing.id);
            if (updateErr) throw updateErr;
          }
        } else {
          const { error: insertErr } = await supabase
            .from("social_accounts")
            .insert({
              business_id: businessId,
              platform,
              account_url: url,
              is_connected: false,
            });
          if (insertErr) throw insertErr;
        }
      }
      // Refresh local state
      await loadExistingSocialAccounts(businessId);
    } catch (e) {
      console.error("Failed to save detected profiles:", e);
    }
  };


  const handleOAuthConnect = async (platform: string) => {
    // This would initiate OAuth flow for each platform
    // For now, we'll show a placeholder message
    if (platform === "facebook") {
      handleConnect();
    } else if (platform === "linkedin") {
      handleLinkedInConnect();
    } else if (platform === "twitter") {
      handleXConnect();
    } else if (platform === "instagram") {
      handleInstagramConnect();
    } else {
      toast.info(
        `OAuth integration for ${platform} coming soon! Please use manual URL input for now.`
      );
    }
  };

  const handleLinkedInConnect = () => {
    localStorage.setItem("oauth_platform", "linkedin");
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const handleXConnect = () => {
    localStorage.setItem("oauth_platform", "twitter");
    const scope = "tweet.read users.read offline.access";
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${X_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(
      scope
    )}&state=xyz123&code_challenge=challenge&code_challenge_method=plain`;

    window.location.href = authUrl;
  };

  const handleConnect = () => {
    localStorage.setItem("oauth_platform", "facebook");
    // Using valid Facebook scopes - simplified for development
    // Valid scopes: email, public_profile, pages_read_engagement, pages_read_user_content
    const FB_AUTH_URL = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=email,public_profile,pages_read_engagement,pages_read_user_content&response_type=code`;
    console.log("🔵 Redirecting to Facebook OAuth:", FB_AUTH_URL);
    window.location.href = FB_AUTH_URL;
  };

  // Fetch comprehensive Facebook data including pages, insights, and Instagram connections
  const fetchFacebookData = async (accessToken: string) => {
    setIsFetchingFacebookData(true);

    try {
      console.log("🔵 Fetching comprehensive Facebook data...");
      console.log("=".repeat(80));

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
      );
      const userData = await userResponse.json();
      console.log("👤 User Info:", userData);

      // Get all pages the user manages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,picture,followers_count,fan_count,engagement,talking_about_count&access_token=${accessToken}`
      );
      const pagesData = await pagesResponse.json();
      console.log("📄 All Pages:", pagesData);

      // For each page, get detailed insights
      if (pagesData.data && Array.isArray(pagesData.data)) {
        console.log("=".repeat(80));
        console.log(`📊 FACEBOOK PAGES DETAILS (${pagesData.data.length} page${pagesData.data.length !== 1 ? 's' : ''})`);
        console.log("=".repeat(80));

        for (const page of pagesData.data) {
          const pageToken = page.access_token;
          console.log(`\n📱 Page: ${page.name}`);
          console.log(`   ID: ${page.id}`);
          console.log(`   Followers: ${page.followers_count || page.fan_count || 0}`);
          console.log(`   Talking About: ${page.talking_about_count || 0}`);
          console.log(`   Engagement: ${page.engagement || 0}`);

          // Get page insights
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}/insights?metric=page_views_total,page_fans,page_fan_adds_unique,page_engaged_users,page_post_engagements&access_token=${pageToken}`
          );
          const insightsData = await insightsResponse.json();
          console.log(`   📈 Insights:`, insightsData);

          // Get recent posts
          const postsResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}/posts?fields=id,message,story,created_time,permalink_url,likes.summary(true).limit(0),comments.summary(true).limit(0),shares&limit=5&access_token=${pageToken}`
          );
          const postsData = await postsResponse.json();
          console.log(`   📝 Recent Posts (5):`, postsData);

          // Get Instagram connected account if available
          const igResponse = await fetch(
            `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${pageToken}`
          );
          const igData = await igResponse.json();
          if (igData.instagram_business_account) {
            console.log(`   📸 Instagram Connected:`, igData.instagram_business_account);

            // Get Instagram insights
            const igInsightsResponse = await fetch(
              `https://graph.facebook.com/v21.0/${igData.instagram_business_account.id}?fields=id,username,name,biography,profile_picture_url,followers_count,ig_mention_count&access_token=${pageToken}`
            );
            const igInsightsData = await igInsightsResponse.json();
            console.log(`   📸 Instagram Details:`, igInsightsData);
          }
        }
      }

      console.log("=".repeat(80));
      console.log("✅ Facebook data fetch completed");
      console.log("=".repeat(80));

      setFacebookAccessToken(accessToken);
      toast.success("Facebook data fetched successfully! Check console for details.");

    } catch (error) {
      console.error("❌ Error fetching Facebook data:", error);
      toast.error("Failed to fetch Facebook data. Please check console for details.");
    } finally {
      setIsFetchingFacebookData(false);
    }
  };

  const exchangeCode = async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    const currentBusinessId = localStorage.getItem("currentBusinessId");
    const currentPlatform = localStorage.getItem("oauth_platform");

    if (!code || currentPlatform != "facebook") return;

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`
      );
      const tokens = await res.json();

      if (tokens.access_token) {
        const meRes = await fetch(
          `https://graph.facebook.com/me?fields=id,name,link&access_token=${tokens.access_token}`
        );
        const me = await meRes.json();

        const userData = {
          id: me.id,
          name: me.name,
          url: me.link ?? `https://facebook.com/${me.id}`,
          businessId: currentBusinessId ?? "",
        };

        console.log("Facebook User:", userData);

        await saveToDatabase(userData, tokens.access_token, "facebook");

        // Fetch comprehensive Facebook data
        await fetchFacebookData(tokens.access_token);
      }
    } catch (err) {
      console.error("Error connecting Facebook:", err);
    }
  };

  const exchangeInstaCode = async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    const currentPlatform = localStorage.getItem("oauth_platform");

    const currentBusinessId = localStorage.getItem("currentBusinessId");
    if (!code || currentPlatform != "instagram") return;

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`
      );
      const tokens = await res.json();

      if (tokens.access_token) {
        const meRes = await fetch(
          `https://graph.facebook.com/me?fields=id,name,link&access_token=${tokens.access_token}`
        );
        const me = await meRes.json();

        const userData = {
          id: me.id,
          name: me.name,
          url: me.link ?? `https://facebook.com/${me.id}`,
          businessId: currentBusinessId ?? "",
        };

        await saveToDatabase(userData, tokens.access_token, "instagram");
      }
    } catch (err) {
      console.error("Error connecting Facebook:", err);
    }
  };

  const exchangeXCode = async () => {
    const currentPlatform = localStorage.getItem("oauth_platform");
    const currentBusinessId = localStorage.getItem("currentBusinessId");
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (!code || currentPlatform != "twitter") return;
    const userData = {
      id: "",
      name: "",
      url: "",
      businessId: currentBusinessId ?? "",
    };

    await saveToDatabase(userData, code, "twitter");

    try {
      const res = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          mode: "no-cors",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ code }),
      });

      // THEY NEED OF SERVER-SIDE PROXY TO AVOID CORS
      const data = await res.json();
      if (data.access_token) {
        const profileRes = await fetch("https://api.twitter.com/2/users/me", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        const profile = await profileRes.json();
        console.log("Twitter Profile:", profile);
      }
    } catch (err) {
      console.error("LinkedIn OAuth Error:", err);
    }
  };

  const exchangeLinkedInCode = async () => {
    const currentPlatform = localStorage.getItem("oauth_platform");
    const urlParams = new URLSearchParams(window.location.search);
    const currentBusinessId = localStorage.getItem("currentBusinessId");

    const code = urlParams.get("code");

    if (!code || currentPlatform != "linkedin") return;
    const userData = {
      id: "",
      name: "",
      url: "",
      businessId: currentBusinessId ?? "",
    };

    await saveToDatabase(userData, code, "linkedin");

    try {
      const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          mode: "no-cors",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ code }),
      });

      // THEY NEED OF SERVER-SIDE PROXY TO AVOID CORS
      const data = await res.json();
      if (data.access_token) {
        const profileRes = await fetch("https://api.linkedin.com/v2/me", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });

        const profile = await profileRes.json();
        console.log("LinkedIn Profile Raw:", profile);

        const fullName = `${profile.localizedFirstName} ${profile.localizedLastName}`;
        const linkedinUrl = profile.vanityName
          ? `https://www.linkedin.com/in/${profile.vanityName}`
          : "https://www.linkedin.com";

        console.log("Name:", fullName);
        console.log("URL:", linkedinUrl);
      }
    } catch (err) {
      console.error("LinkedIn OAuth Error:", err);
    }
  };

  const saveBusinessIdToLocalStorage = () => {
    if (businessId) {
      localStorage.setItem("buisness_id", businessId || "");
    }
  };

  const handleInstagramConnect = () => {
    localStorage.setItem("oauth_platform", "instagram");
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    exchangeCode();
    exchangeInstaCode();
    exchangeLinkedInCode();
    exchangeXCode();
    saveBusinessIdToLocalStorage();
  }, []);

  const saveToDatabase = async (
    user: { id: string; name: string; url: string; businessId: String },
    token: string,
    platform: string
  ) => {
    // Skip database operations for temporary/guest businesses
    const businessIdStr = user.businessId.toString();
    const isTemporaryBusiness =
      businessIdStr.startsWith("temp_") || businessIdStr.startsWith("guest_");
    if (isTemporaryBusiness) {
      console.log(
        "Temporary/guest business - skipping database save for social account"
      );
      return;
    }

    const { data, error } = await supabase.from("social_accounts").insert([
      {
        platform: platform,
        account_id: user.id,
        account_url: user.url,
        access_token: token,
        is_connected: true,
        business_id: user.businessId,
      },
    ]);
    checkUserAndBusiness();

    if (error) {
      console.error("DB Save Error:", error);
    } else {
      console.log("Saved in DB:", data);
    }
  };

  const handleUrlChange = (platform: string, url: string) => {
    setSocialUrls((prev) => ({
      ...prev,
      [platform]: url,
    }));
  };

  const handleSaveUrls = async () => {
    if (!businessId) {
      toast.error("Business ID not found");
      return;
    }

    setIsLoading(true);

    try {
      // Check if this is a temporary or guest business ID (user hasn't created account or is in guest mode)
      const isTemporaryBusiness =
        businessId.startsWith("temp_") || businessId.startsWith("guest_");

      if (isTemporaryBusiness) {
        // For temporary/guest business (registration flow or guest mode), just save to localStorage
        console.log(
          "Temporary/guest business detected, saving social URLs to localStorage"
        );
        localStorage.setItem("socialUrls", JSON.stringify(socialUrls));
        toast.success("Social media information saved!");
      } else {
        // For real authenticated business, save to database
        for (const [platform, url] of Object.entries(socialUrls)) {
          const trimmed = url.trim();
          if (!trimmed) continue;

          const { data: existing, error: fetchErr } = await supabase
            .from("social_accounts")
            .select("id")
            .eq("business_id", businessId)
            .eq("platform", platform)
            .maybeSingle();

          if (fetchErr) throw fetchErr;

          if (existing) {
            const { error: updateErr } = await supabase
              .from("social_accounts")
              .update({ account_url: trimmed, is_connected: false })
              .eq("id", existing.id);
            if (updateErr) throw updateErr;
          } else {
            const { error: insertErr } = await supabase
              .from("social_accounts")
              .insert({
                business_id: businessId,
                platform,
                account_url: trimmed,
                is_connected: false,
              });
            if (insertErr) throw insertErr;
          }
        }

        toast.success("Social media accounts saved successfully!");
      }

      // Set flag to indicate returning from social media step
      localStorage.setItem("fromSocialMedia", "true");
      navigate("/start-scan");
    } catch (err: any) {
      console.error("Error saving social accounts:", err);
      toast.error("Failed to save social accounts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Set flag to indicate returning from social media step
    localStorage.setItem("fromSocialMedia", "true");
    navigate("/start-scan");
  };

  const handleBack = () => {
    navigate("/setup");
  };

  // Allow rendering if we have businessId (either from DB or temporary from registration flow)
  if (!businessId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Connect Your Social Media
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {isDetecting
              ? "We're automatically detecting your social media profiles..."
              : "Connect your social media accounts for deeper insights, or manually add your profile URLs"}
          </p>
          <div className="mt-6">
            <Progress
              value={50}
              className="w-full max-w-md mx-auto"
            />
            <p className="text-sm text-gray-500 mt-2">
              Step 2 of 4{/* {isAuthenticated ? '2' : '3'} */}
              {/* {isAuthenticated ? '3' : '4'} */}
            </p>
          </div>
          {isDetecting && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">
                Scanning for social media profiles...
              </span>
            </div>
          )}
        </div>

        {/* Connection Options */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Social Media Integration</CardTitle>
            <CardDescription>
              Choose how you'd like to connect your social media accounts for
              analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="detected"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Detected Profiles
                </TabsTrigger>
                <TabsTrigger
                  value="connect"
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Auto Connect
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Manual URLs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detected" className="mt-6">
                <div className="space-y-6">
                  {isDetecting ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Detecting Social Media Profiles
                        </h3>
                        <p className="text-sm text-gray-600">
                          Please wait while we scan your website for social
                          media links...
                        </p>
                      </div>
                    </div>
                  ) : detectedSocialData ? (
                    <>
                      {detectedSocialData.platforms.length > 0 ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <strong>
                              Great! We found{" "}
                              {detectedSocialData.platforms.length} social media
                              profile
                              {detectedSocialData.platforms.length === 1
                                ? ""
                                : "s"}{" "}
                              for your business.
                            </strong>
                            {detectedSocialData.detectionMethods.length > 0 && (
                              <span className="block text-sm text-gray-600 mt-1">
                                Detection methods:{" "}
                                {detectedSocialData.detectionMethods.join(", ")}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-orange-50 border-orange-200">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <strong>
                              Hmm, we found{" "}
                              {detectedSocialData.platforms.length} social media
                              profiles on your website.
                            </strong>
                            <span className="block text-sm text-gray-600 mt-1">
                              No worries! You can add them manually below or
                              connect them directly for better insights.
                            </span>
                          </AlertDescription>
                        </Alert>
                      )}

                      {detectedSocialData.platforms.length > 0 ? (
                        <div className="space-y-4">
                          {detectedSocialData.platforms.map(
                            (profile, index) => (
                              <Card
                                key={index}
                                className="relative overflow-hidden"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div
                                        className={`w-10 h-10 ${
                                          socialPlatforms.find(
                                            (p) => p.id === profile.platform
                                          )?.color || "bg-gray-500"
                                        } rounded-lg flex items-center justify-center text-white`}
                                      >
                                        {socialPlatforms.find(
                                          (p) => p.id === profile.platform
                                        )?.icon ? (
                                          React.createElement(
                                            socialPlatforms.find(
                                              (p) => p.id === profile.platform
                                            )!.icon,
                                            { className: "h-5 w-5" }
                                          )
                                        ) : (
                                          <Users className="h-5 w-5" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        {/* Followers Count Display */}
                                        <div className="mb-2 flex items-center gap-2">
                                          <Users className="h-4 w-4 text-gray-500" />
                                          <span className="text-sm font-medium text-gray-700">
                                            Followers: {profile.followers ? profile.followers.toLocaleString() : 'N/A'}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-1">
                                          <h3 className="font-semibold capitalize">
                                            {profile.platform}
                                          </h3>
                                          {profile.verified && (
                                            <Badge
                                              variant="secondary"
                                              className="bg-blue-100 text-blue-700"
                                            >
                                              <Star className="h-3 w-3 mr-1" />
                                              Verified
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="space-y-1">
                                          <a
                                            href={profile.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                          >
                                            {profile.username
                                              ? `@${profile.username}`
                                              : profile.url}
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-100 text-green-700"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Detected
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          )}

                        </div>
                      ) : (
                        <>
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              No social media profiles were automatically
                              detected. You can add them manually using the tabs
                              above.
                            </AlertDescription>
                          </Alert>
                          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
                            <Input
                              type="url"
                              placeholder="https://yourwebsite.com"
                              value={siteUrl}
                              onChange={(e) => setSiteUrl(e.target.value)}
                            />
                            <Button
                              onClick={() => runSocialMediaDetection(siteUrl)}
                              disabled={!siteUrl || isDetecting}
                            >
                              Retry detection
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No detection data available. This may occur if the
                          automated detection was skipped or failed.
                        </AlertDescription>
                      </Alert>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
                        <Input
                          type="url"
                          placeholder="https://yourwebsite.com"
                          value={siteUrl}
                          onChange={(e) => setSiteUrl(e.target.value)}
                        />
                        <Button
                          onClick={() => runSocialMediaDetection(siteUrl)}
                          disabled={!siteUrl || isDetecting}
                        >
                          Retry detection
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="connect" className="mt-6">
                <div className="space-y-6">
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recommended:</strong> Connect directly for
                      real-time data and deeper insights including engagement
                      rates, demographics, and performance metrics.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialPlatforms.map((platform) => (
                      <Card
                        key={platform.id}
                        className="relative overflow-hidden"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white`}
                              >
                                <platform.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {platform.name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {platform.description}
                                </p>
                              </div>
                            </div>
                            {connectedAccounts[platform.id] ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOAuthConnect(platform.id)}
                                disabled={isLoading}
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-6">
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Manual URLs provide basic public metrics. For
                      comprehensive analysis including engagement rates and
                      demographics, we recommend using the Auto Connect option.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {socialPlatforms.map((platform) => (
                      <div key={platform.id} className="space-y-2">
                        <Label
                          htmlFor={platform.id}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`w-5 h-5 ${platform.color} rounded flex items-center justify-center text-white`}
                          >
                            <platform.icon className="h-3 w-3" />
                          </div>
                          {platform.name} Profile URL
                        </Label>
                        <Input
                          id={platform.id}
                          type="url"
                          placeholder={platform.placeholder}
                          value={socialUrls[platform.id] || ""}
                          onChange={(e) =>
                            handleUrlChange(platform.id, e.target.value)
                          }
                          disabled={isLoading}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-8 border-t mt-8">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip for Now
                </Button>
              </div>
              <Button
                onClick={handleSaveUrls}
                className="btn-primary flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Review
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SocialConnection;
