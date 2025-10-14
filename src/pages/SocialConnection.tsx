import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SocialMediaData, socialMediaDetector } from '@/utils/socialMediaDetector';

const FACEBOOK_CLIENT_ID = import.meta.env.VITE_FACEBOOK_CLIENT_ID as string | undefined;
const FACEBOOK_CLIENT_SECRET = import.meta.env.VITE_FACEBOOK_CLIENT_SECRET as string | undefined;
const LINKEDIN_CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID as string | undefined;
// const _LINKEDIN_CLIENT_SECRET = import.meta.env.VITE_LINKEDIN_CLIENT_SECRET as string | undefined;
const X_CLIENT_ID = import.meta.env.VITE_X_CLIENT_ID as string | undefined;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string | undefined ?? '';

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
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    placeholder: 'https://facebook.com/yourbusiness',
    description: 'Page insights and engagement metrics'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'bg-gradient-to-br from-purple-600 to-pink-600',
    placeholder: 'https://instagram.com/yourbusiness',
    description: 'Profile analytics and content performance'
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: MessageCircle,
    color: 'bg-black',
    placeholder: 'https://threads.net/@yourbusiness',
    description: 'Conversation engagement and community metrics'
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: Twitter,
    color: 'bg-blue-400',
    placeholder: 'https://twitter.com/yourbusiness',
    description: 'Tweet engagement and follower analytics'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    placeholder: 'https://linkedin.com/company/yourbusiness',
    description: 'Professional network and company insights'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'bg-red-600',
    placeholder: 'https://youtube.com/@yourbusiness',
    description: 'Video content and subscriber metrics'
  },
];

const SocialConnection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [socialUrls, setSocialUrls] = useState<Record<string, string>>({});
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('detected');
  const [detectedSocialData, setDetectedSocialData] = useState<SocialMediaData | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasRunDetection, setHasRunDetection] = useState(false);
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [bizName, setBizName] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      const { data: { user }, error } = await supabase.auth.getUser();

      // Check if we have registration data in localStorage (step 2 completed but not yet created account)
      const registrationData = localStorage.getItem('registrationData');
      const businessWebsiteUrl = localStorage.getItem('businessWebsiteUrl');
      const businessName = localStorage.getItem('businessName');

      if (user) {
        setIsAuthenticated(true);
      }

      if (error || !user) {
        // Allow access if we have registration data (user is in the middle of the flow)
        if (registrationData && businessWebsiteUrl && businessName) {
          console.log('No authenticated user yet, but registration data found - allowing access');
          // Create a temporary business ID for the flow
          const tempBusinessId = `temp_${Date.now()}`;
          localStorage.setItem('currentBusinessId', tempBusinessId);
          setBusinessId(tempBusinessId);
          setSiteUrl(businessWebsiteUrl);
          setBizName(businessName);
          return;
        }

        console.log('No authenticated user and no registration data, redirecting to home');
        navigate('/');
        return;
      }
      setUser(user);

      const currentBusinessId = localStorage.getItem('currentBusinessId');
      if (!currentBusinessId) {
        console.log('No business ID found, redirecting to setup');
        navigate('/setup');
        return;
      }
      setBusinessId(currentBusinessId);

      // Ensure we use canonical business data from DB (avoid typos in localStorage)
      const { data: business, error: bizErr } = await supabase
        .from('businesses')
        .select('business_name, website_url')
        .eq('id', currentBusinessId)
        .maybeSingle();
      if (!bizErr && business) {
        const normalizedUrl = business.website_url?.startsWith('http')
          ? business.website_url
          : `https://${business.website_url}`;
        if (normalizedUrl) {
          localStorage.setItem('businessWebsiteUrl', normalizedUrl);
          setSiteUrl(normalizedUrl);
        }
        if (business.business_name) {
          localStorage.setItem('businessName', business.business_name);
          setBizName(business.business_name);
        }
        console.log('Using website URL from DB for detection:', normalizedUrl);
      }

      // Load existing social accounts
      await loadExistingSocialAccounts(currentBusinessId);

      // CRITICAL FIX: Check if the cached detection data matches the current business
      const cachedBusinessId = localStorage.getItem('detectedSocialMediaBusinessId');
      const detectedData = localStorage.getItem('detectedSocialMedia');
      
      // Only use cached data if it's for the CURRENT business
      if (detectedData && cachedBusinessId === currentBusinessId) {
        try {
          const parsed: SocialMediaData = JSON.parse(detectedData);
          setDetectedSocialData(parsed);
          console.log('Loaded detected social media data for current business:', parsed);

          // If we have detected profiles, prefill the manual URLs
          if (parsed.platforms && parsed.platforms.length > 0) {
            const urlMap: Record<string, string> = {};
            parsed.platforms.forEach(profile => {
              urlMap[profile.platform] = profile.url;
            });
            setSocialUrls(prev => ({ ...prev, ...urlMap }));

            // Ensure detected profiles are persisted to DB as well
            await saveDetectedProfiles(parsed.platforms);
          }
        } catch (error) {
          console.log('Failed to parse detected social media data:', error);
        }
      } else {
        // Clear old cached data if it's from a different business
        console.log('Clearing cached social media data from different business');
        localStorage.removeItem('detectedSocialMedia');
        localStorage.removeItem('detectedSocialMediaBusinessId');
      }

    } catch (err) {
      console.error('Error checking user and business:', err);
      navigate('/');
    }
  };

  const runSocialMediaDetection = async (overrideUrl?: string) => {
    if (hasRunDetection && !overrideUrl) return;

    setIsDetecting(true);
    if (!hasRunDetection) setHasRunDetection(true);

    try {
      const websiteUrl = (overrideUrl || siteUrl || localStorage.getItem('businessWebsiteUrl') || '').trim();
      const businessName = (bizName || localStorage.getItem('businessName') || '').toString();

      if (!websiteUrl || !businessName) {
        console.warn('Missing business data for social media detection');
        return;
      }

      toast.info('Detecting social media profiles...', { duration: 3000 });
      console.log('Starting social media detection for:', { websiteUrl, businessName });

      const socialMediaData = await socialMediaDetector.detectSocialMedia(
        websiteUrl,
        businessName
      );

      setDetectedSocialData(socialMediaData);
      
      // CRITICAL FIX: Store the business ID with the cached detection data
      localStorage.setItem('detectedSocialMedia', JSON.stringify(socialMediaData));
      localStorage.setItem('detectedSocialMediaBusinessId', businessId || '');

      console.log('Social media detection completed:', socialMediaData);

      if (socialMediaData.platforms.length > 0) {
        toast.success(`Found ${socialMediaData.platforms.length} social media profiles!`);

        // Prefill the manual URLs with detected profiles
        const urlMap: Record<string, string> = {};
        socialMediaData.platforms.forEach(profile => {
          urlMap[profile.platform] = profile.url;
        });
        setSocialUrls(prev => ({ ...prev, ...urlMap }));

        // Auto-save detected profiles to the database for analysis
        await saveDetectedProfiles(socialMediaData.platforms);
      } else {
        toast.info('No social media profiles detected. You can add them manually.');
      }

    } catch (error) {
      console.error('Social media detection failed:', error);
      const fallbackData = {
        platforms: [],
        score: 0,
        detectionMethods: ['Error occurred during detection'],
        businessName: localStorage.getItem('businessName')
      };
      localStorage.setItem('detectedSocialMedia', JSON.stringify(fallbackData));
      localStorage.setItem('detectedSocialMediaBusinessId', businessId || '');
      toast.error('Social media detection encountered issues, but you can add profiles manually.');
    } finally {
      setIsDetecting(false);
    }
  };

  const loadExistingSocialAccounts = async (businessId: string) => {
    try {
      const { data: accounts, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('business_id', businessId);

      if (error) throw error;

      console.log('Existing social accounts:', accounts);
      

      const urls: Record<string, string> = {};
      const connected: Record<string, boolean> = {};

      accounts?.forEach(account => {
        if (account.account_url) {
          urls[account.platform] = account.account_url;
        }
        connected[account.platform] = account.is_connected;
      });

      setSocialUrls(urls);
      setConnectedAccounts(connected);
    } catch (err) {
      console.error('Error loading social accounts:', err);
    }
  };
  
  // Auto-save detected profiles to DB without overriding existing manual entries
  const saveDetectedProfiles = async (profiles: { platform: string; url: string }[]) => {
    if (!businessId || !Array.isArray(profiles) || profiles.length === 0) return;
    try {
      for (const p of profiles) {
        const platform = p.platform;
        const url = (p.url || '').trim();
        if (!platform || !url) continue;

        const { data: existing, error: fetchErr } = await supabase
          .from('social_accounts')
          .select('id, account_url')
          .eq('business_id', businessId)
          .eq('platform', platform)
          .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existing) {
          // Don't overwrite an existing URL; only fill if empty
          if (!existing.account_url) {
            const { error: updateErr } = await supabase
              .from('social_accounts')
              .update({ account_url: url, is_connected: false })
              .eq('id', existing.id);
            if (updateErr) throw updateErr;
          }
        } else {
          const { error: insertErr } = await supabase
            .from('social_accounts')
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
      console.error('Failed to save detected profiles:', e);
    }
  };

  const handleOAuthConnect = async (platform: string) => {
    // This would initiate OAuth flow for each platform
    // For now, we'll show a placeholder message
    if(platform === 'facebook') {
        handleConnect();
      } else if(platform === 'linkedin') {
        handleLinkedInConnect();
      } else if(platform === 'twitter') {
        handleXConnect();
      } else if (platform === 'instagram') {
        handleInstagramConnect();
      } else {
      toast.info(`OAuth integration for ${platform} coming soon! Please use manual URL input for now.`);
    }
  };

  const handleLinkedInConnect = () => {
    localStorage.setItem('oauth_platform', 'linkedin');
    const scope = "openid profile email";
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  const handleXConnect = () => {
    localStorage.setItem('oauth_platform', 'twitter');
    const scope = "tweet.read users.read offline.access";
    const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${X_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&scope=${encodeURIComponent(scope)}&state=xyz123&code_challenge=challenge&code_challenge_method=plain`;

    window.location.href = authUrl;
  };

  const handleConnect = () => {
    localStorage.setItem('oauth_platform', 'facebook');
    const FB_AUTH_URL = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=public_profile`;
    window.location.href = FB_AUTH_URL;
  };

  const exchangeCode = async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    const currentBusinessId = localStorage.getItem('currentBusinessId');
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
            businessId: currentBusinessId ?? '',
          };

          console.log("Facebook User:", userData);
  
          await saveToDatabase(userData, tokens.access_token, 'facebook');
        }
      } catch (err) {
        console.error("Error connecting Facebook:", err);
      }
  };

  const exchangeInstaCode = async () => {
    const code = new URLSearchParams(window.location.search).get("code");
    const currentPlatform = localStorage.getItem("oauth_platform");

    const currentBusinessId = localStorage.getItem('currentBusinessId');
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
            businessId: currentBusinessId ?? '',
          };

          await saveToDatabase(userData, tokens.access_token, 'instagram');
        }
      } catch (err) {
        console.error("Error connecting Facebook:", err);
      }
  };

   const exchangeXCode = async () => {
    const currentPlatform = localStorage.getItem("oauth_platform");
    const currentBusinessId = localStorage.getItem('currentBusinessId');
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (!code || currentPlatform != "twitter") return;
        const userData = {
          id: "",
          name: "",
          url: "",
          businessId: currentBusinessId ?? '',
        };
              
        await saveToDatabase(userData, code, 'twitter');
        
        try {
          const res = await fetch("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded",mode: 'no-cors', "Access-Control-Allow-Origin":"*" },
            body: JSON.stringify({ code }),
          });
          
          // THEY NEED OF SERVER-SIDE PROXY TO AVOID CORS
          const data = await res.json();
          if (data.access_token) {
            const profileRes = await fetch(
              "https://api.twitter.com/2/users/me",
              {
                headers: {
                  Authorization: `Bearer ${data.access_token}`,
                },
              }
            );

            const profile = await profileRes.json();
            console.log("Twitter Profile:", profile);
          }
        } catch (err) {
          console.error("LinkedIn OAuth Error:", err);
        };
   };



  const exchangeLinkedInCode = async () => {
    const currentPlatform = localStorage.getItem("oauth_platform");
    const urlParams = new URLSearchParams(window.location.search);
    const currentBusinessId = localStorage.getItem('currentBusinessId');

    const code = urlParams.get("code");
    
    if (!code || currentPlatform != "linkedin" ) return;
        const userData = {
          id: "",
          name: "",
          url: "",
          businessId: currentBusinessId ?? '',
        };
              
        await saveToDatabase(userData, code, 'linkedin');
        
        try {
          const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
            method: "POST",
            headers: { "Content-Type": "application/json",mode: 'no-cors', "Access-Control-Allow-Origin":"*" },
            body: JSON.stringify({ code }),
          });
          
          // THEY NEED OF SERVER-SIDE PROXY TO AVOID CORS
          const data = await res.json();
          if (data.access_token) {
            const profileRes = await fetch(
              "https://api.linkedin.com/v2/me",
              {
                headers: {
                  Authorization: `Bearer ${data.access_token}`,
                },
              }
            );

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
        };
  };  

  const saveBusinessIdToLocalStorage = () => {
    if (businessId) {
      localStorage.setItem('buisness_id', businessId || '');
    }
  }

  const handleInstagramConnect = () => {
    localStorage.setItem('oauth_platform', 'instagram');
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

  const saveToDatabase = async (user: { id: string; name: string; url: string, businessId: String }, token: string, platform:string) => {
    const { data, error } = await supabase.from("social_accounts").insert([
      {
        platform: platform,
        account_id: user.id,
        account_url: user.url,
        access_token: token,
        is_connected: true,
        business_id: user.businessId
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
    setSocialUrls(prev => ({
      ...prev,
      [platform]: url
    }));
  };

  const handleSaveUrls = async () => {
    if (!businessId) {
      toast.error('Business ID not found');
      return;
    }

    setIsLoading(true);

    try {
      // Check if this is a temporary business ID (user hasn't created account yet)
      const isTemporaryBusiness = businessId.startsWith('temp_');

      if (isTemporaryBusiness) {
        // For temporary business (registration flow), just save to localStorage
        console.log('Temporary business detected, saving social URLs to localStorage');
        localStorage.setItem('socialUrls', JSON.stringify(socialUrls));
        toast.success('Social media information saved!');
      } else {
        // For real business, save to database
        for (const [platform, url] of Object.entries(socialUrls)) {
          const trimmed = url.trim()
          if (!trimmed) continue

          const { data: existing, error: fetchErr } = await supabase
            .from('social_accounts')
            .select('id')
            .eq('business_id', businessId)
            .eq('platform', platform)
            .maybeSingle()

          if (fetchErr) throw fetchErr

          if (existing) {
            const { error: updateErr } = await supabase
              .from('social_accounts')
              .update({ account_url: trimmed, is_connected: false })
              .eq('id', existing.id)
            if (updateErr) throw updateErr
          } else {
            const { error: insertErr } = await supabase
              .from('social_accounts')
              .insert({
                business_id: businessId,
                platform,
                account_url: trimmed,
                is_connected: false,
              })
            if (insertErr) throw insertErr
          }
        }

        toast.success('Social media accounts saved successfully!');
      }

      // Set flag to indicate returning from social media step
      localStorage.setItem('fromSocialMedia', 'true');
      navigate('/start-scan');

    } catch (err: any) {
      console.error('Error saving social accounts:', err);
      toast.error('Failed to save social accounts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Set flag to indicate returning from social media step
    localStorage.setItem('fromSocialMedia', 'true');
    navigate('/start-scan');
  };

  const handleBack = () => {
    navigate('/setup');
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
              ? 'We\'re automatically detecting your social media profiles...'
              : 'Connect your social media accounts for deeper insights, or manually add your profile URLs'
            }
          </p>
          <div className="mt-6">
            <Progress value={isAuthenticated ? 50 : 60} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Step {isAuthenticated ? '2' : '3'} of {isAuthenticated ? '4' : '5'}</p>
          </div>
          {isDetecting && (
            <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Scanning for social media profiles...</span>
            </div>
          )}
        </div>

        

        {/* Connection Options */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Social Media Integration</CardTitle>
            <CardDescription>
              Choose how you'd like to connect your social media accounts for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="detected" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Detected Profiles
                </TabsTrigger>
                <TabsTrigger value="connect" className="flex items-center gap-2">
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
                          Please wait while we scan your website for social media links...
                        </p>
                      </div>
                    </div>
                  ) : detectedSocialData ? (
                    <>
                      {detectedSocialData.platforms.length > 0 ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <strong>Great! We found {detectedSocialData.platforms.length} social media profile{detectedSocialData.platforms.length === 1 ? '' : 's'} for your business.</strong>
                            {detectedSocialData.detectionMethods.length > 0 && (
                              <span className="block text-sm text-gray-600 mt-1">
                                Detection methods: {detectedSocialData.detectionMethods.join(', ')}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert className="bg-orange-50 border-orange-200">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <strong>Hmm, we found {detectedSocialData.platforms.length} social media profiles on your website.</strong>
                            <span className="block text-sm text-gray-600 mt-1">
                              No worries! You can add them manually below or connect them directly for better insights.
                            </span>
                          </AlertDescription>
                        </Alert>
                      )}

                      {detectedSocialData.platforms.length > 0 ? (
                        <div className="space-y-4">
                          {detectedSocialData.platforms.map((profile, index) => (
                            <Card key={index} className="relative overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${
                                      socialPlatforms.find(p => p.id === profile.platform)?.color || 'bg-gray-500'
                                    } rounded-lg flex items-center justify-center text-white`}>
                                      {socialPlatforms.find(p => p.id === profile.platform)?.icon ? (
                                        React.createElement(socialPlatforms.find(p => p.id === profile.platform)!.icon, { className: "h-5 w-5" })
                                      ) : (
                                        <Users className="h-5 w-5" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold capitalize">{profile.platform}</h3>
                                        {profile.verified && (
                                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
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
                                          {profile.username ? `@${profile.username}` : profile.url}
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                        <div className="flex flex-col gap-1">
                                          {profile.followers !== undefined && profile.followers > 0 ? (
                                            <span className="flex items-center gap-1 font-semibold text-brand-600 text-sm">
                                              <Users className="h-4 w-4" />
                                              {profile.followers.toLocaleString()} {profile.platform === 'youtube' ? 'subscribers' : 'followers'}
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1 text-gray-500 text-xs">
                                              <Users className="h-3 w-3" />
                                              Connect account to see follower count
                                            </span>
                                          )}
                                          {profile.engagement !== undefined && profile.engagement > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-gray-600">
                                              <Eye className="h-3 w-3" />
                                              {profile.engagement.toFixed(1)}% engagement
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Detected
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <>
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              No social media profiles were automatically detected. You can add them manually using the tabs above.
                            </AlertDescription>
                          </Alert>
                          <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
                            <Input
                              type="url"
                              placeholder="https://yourwebsite.com"
                              value={siteUrl}
                              onChange={(e) => setSiteUrl(e.target.value)}
                            />
                            <Button onClick={() => runSocialMediaDetection(siteUrl)} disabled={!siteUrl || isDetecting}>
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
                          No detection data available. This may occur if the automated detection was skipped or failed.
                        </AlertDescription>
                      </Alert>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start">
                        <Input
                          type="url"
                          placeholder="https://yourwebsite.com"
                          value={siteUrl}
                          onChange={(e) => setSiteUrl(e.target.value)}
                        />
                        <Button onClick={() => runSocialMediaDetection(siteUrl)} disabled={!siteUrl || isDetecting}>
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
                      <strong>Recommended:</strong> Connect directly for real-time data and deeper insights including engagement rates, demographics, and performance metrics.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {socialPlatforms.map((platform) => (
                      <Card key={platform.id} className="relative overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white`}>
                                <platform.icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{platform.name}</h3>
                                <p className="text-sm text-gray-600">{platform.description}</p>
                              </div>
                            </div>
                            {connectedAccounts[platform.id] ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
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
                      Manual URLs provide basic public metrics. For comprehensive analysis including engagement rates and demographics, we recommend using the Auto Connect option.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    {socialPlatforms.map((platform) => (
                      <div key={platform.id} className="space-y-2">
                        <Label htmlFor={platform.id} className="flex items-center gap-2">
                          <div className={`w-5 h-5 ${platform.color} rounded flex items-center justify-center text-white`}>
                            <platform.icon className="h-3 w-3" />
                          </div>
                          {platform.name} Profile URL
                        </Label>
                        <Input
                          id={platform.id}
                          type="url"
                          placeholder={platform.placeholder}
                          value={socialUrls[platform.id] || ''}
                          onChange={(e) => handleUrlChange(platform.id, e.target.value)}
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