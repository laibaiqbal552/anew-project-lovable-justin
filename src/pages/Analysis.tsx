import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import SplashScreen from '@/components/SplashScreen';
import {
  BarChart3,
  Users,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  Loader2,
  Download,
  Eye,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
}

const Analysis = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentStepName, setCurrentStepName] = useState('Initializing...');
  const [showSplash] = useState(false);
  const cancelProgressRef = useRef(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    // {
    //   id: 'website',
    //   title: 'Website Analysis',
    //   description: 'Analyzing SEO, performance, and content quality',
    //   icon: Globe,
    //   status: 'pending',
    //   progress: 0
    // },
    {
      id: 'social',
      title: 'Social Media Audit',
      description: 'Evaluating social presence and engagement',
      icon: Users,
      status: 'pending',
      progress: 0
    },
    {
      id: 'reputation',
      title: 'Online Reputation',
      description: 'Scanning reviews and brand mentions',
      icon: Shield,
      status: 'pending',
      progress: 0
    },
    {
      id: 'visibility',
      title: 'Brand Visibility',
      description: 'Checking search rankings and online presence',
      icon: TrendingUp,
      status: 'pending',
      progress: 0
    },
    {
      id: 'consistency',
      title: 'Digital Consistency',
      description: 'Verifying brand alignment across platforms',
      icon: Zap,
      status: 'pending',
      progress: 0
    },
    {
      id: 'scoring',
      title: 'Generating Score',
      description: 'Calculating your brand equity score',
      icon: BarChart3,
      status: 'pending',
      progress: 0
    }
  ]);

  useEffect(() => {
    checkUserAndBusiness();
  }, []);

  useEffect(() => {
    if (businessId && business) {
      startAnalysis();
    }
  }, [businessId, business]);

  const checkUserAndBusiness = async () => {
    try {
      const currentBusinessId = localStorage.getItem('currentBusinessId');
      if (!currentBusinessId) {
        console.log('No business ID found, redirecting to setup');
        navigate('/setup');
        return;
      }
      setBusinessId(currentBusinessId);

      // Check if this is a guest user
      const isGuest = localStorage.getItem('isGuestUser') === 'true';

      if (isGuest) {
        // Guest mode - load business data from localStorage
        console.log('Guest mode detected, loading from localStorage');
        const businessName = localStorage.getItem('businessName') || 'Your Business';
        const businessWebsiteUrl = localStorage.getItem('businessWebsiteUrl') || '';
        const businessIndustry = localStorage.getItem('businessIndustry') || '';
        const businessAddress = localStorage.getItem('businessAddress') || '';
        const businessPhone = localStorage.getItem('businessPhone') || '';
        const businessDescription = localStorage.getItem('businessDescription') || '';

        console.log('🔍 Loading guest business data:', {
          businessName,
          businessWebsiteUrl,
          businessIndustry,
          businessAddress,
          businessPhone,
          businessDescription
        });

        const guestBusiness = {
          id: currentBusinessId,
          name: businessName,
          business_name: businessName,
          website_url: businessWebsiteUrl,
          industry: businessIndustry,
          address: businessAddress,
          phone: businessPhone,
          description: businessDescription,
        };
        console.log('✅ Guest business object created:', guestBusiness);
        setBusiness(guestBusiness);
        setUser(null); // Guest users remain unauthenticated
      } else {
        // Authenticated mode - load from database
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.log('No authenticated user, redirecting to home');
          navigate('/');
          return;
        }
        setUser(user);

        // Load business details from database
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', currentBusinessId)
          .single();

        if (businessError) {
          console.error('Error loading business:', businessError);
          navigate('/setup');
          return;
        }

        setBusiness(businessData);
      }
    } catch (err) {
      console.error('Error checking user and business:', err);
      navigate('/');
    }
  };

  const startAnalysis = async () => {
    if (!businessId) return;

    try {
      console.log('Starting brand analysis for business:', businessId);

      const isGuest = localStorage.getItem('isGuestUser') === 'true';
      let reportIdToUse = null;

      if (!isGuest) {
        // Authenticated user - create report in database
        const { data: report, error: reportError } = await supabase
          .from('brand_reports')
          .insert({
            business_id: businessId,
            report_type: 'comprehensive',
            overall_score: 0,
            analysis_data: {},
            report_status: 'processing',
            processing_started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (reportError) {
          console.error('Error creating report:', reportError);
          throw reportError;
        }

        reportIdToUse = report.id;
        setReportId(report.id);
        console.log('Brand report created:', report.id);
      } else {
        // Guest user - use temporary ID (won't save to database)
        reportIdToUse = `guest_report_${Date.now()}`;
        setReportId(reportIdToUse);
        console.log('Guest mode: Using temporary report ID:', reportIdToUse);
      }

      // Start the real analysis using Edge Function
      cancelProgressRef.current = false;
      // Start progress UI and analysis in parallel
      simulateProgressUI(); // Show progress UI immediately - doesn't block
      // Wait for actual analysis to complete
      await runRealAnalysis(reportIdToUse);

      // After analysis completes, navigate to dashboard
      if (reportIdToUse) {
        localStorage.setItem('currentReportId', reportIdToUse);
      }
      navigate('/dashboard');

    } catch (err: any) {
      console.error('Failed to start analysis:', err);
      toast.error('Failed to start analysis. Please try again.');
    }
  };

  const analyzeWebsiteWithPageSpeed = async (url: string) => {
    try {
      console.log('Analyzing website with PageSpeed Insights via Edge Function...');

      // Call the backend Edge Function to fetch PageSpeed data
      // This avoids CORS issues since the backend can make unrestricted requests
      const { data, error } = await supabase.functions.invoke('pagespeed-analyzer', {
        body: { url }
      });

      if (error) {
        console.error('❌ PageSpeed Edge Function error:', error);
        // If it's a 401/auth error, provide helpful message
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.warn('⚠️ PageSpeed auth issue - using fallback data. Please check Supabase configuration.');
          return null; // Return null to use fallback
        }
        throw new Error(error.message || 'PageSpeed analysis failed');
      }

      if (!data || !data.success) {
        console.error('❌ PageSpeed analysis returned error:', data?.error);
        throw new Error(data?.error || 'PageSpeed analysis failed');
      }

      console.log('✅ PageSpeed analysis successful:', data.result);
      return data.result;

    } catch (error) {
      console.error('❌ PageSpeed analysis failed:', error);
      // Return null so caller knows it failed - will use fallback data
      return null;
    }
  };

  const analyzeSEOWithSEMrush = async (url: string) => {
    try {
      console.log('Analyzing SEO with SEMrush via Edge Function...');

      // Call the backend Edge Function to fetch SEMrush data
      const { data, error } = await supabase.functions.invoke('semrush-analyzer', {
        body: { domain: url }
      });

      if (error) {
        console.error('❌ SEMrush Edge Function error:', error);
        // If it's a 401/auth error, provide helpful message
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.warn('⚠️ SEMrush auth issue - using fallback data. Please check Supabase configuration.');
          return null; // Return null to use fallback
        }
        throw new Error(error.message || 'SEMrush analysis failed');
      }

      if (!data || !data.success) {
        console.error('❌ SEMrush analysis returned error:', data?.error);
        throw new Error(data?.error || 'SEMrush analysis failed');
      }

      console.log('✅ SEMrush analysis successful:', data.result);

      // Show debug info if available
      if (data.debug) {
        console.log('🔍 SEMrush Debug Info:', data.debug);
        if (data.debug.note) {
          console.log('📌 Note:', data.debug.note);
        }
      }

      return data.result;

    } catch (error) {
      console.error('❌ SEMrush analysis failed:', error);
      // Return null so caller knows it failed - will use fallback data
      return null;
    }
  };

  const runRealAnalysis = async (reportId: string) => {
    try {
      console.log('Starting comprehensive brand analysis...');

      // Analyze website with PageSpeed Insights and SEMrush in parallel
      let pageSpeedResults = null;
      let semrushResults = null;

      if (business?.website_url) {
        console.log('Running parallel analysis with PageSpeed Insights and SEMrush...');
        const [pageSpeedRes, semrushRes] = await Promise.all([
          analyzeWebsiteWithPageSpeed(business.website_url),
          analyzeSEOWithSEMrush(business.website_url)
        ]);

        pageSpeedResults = pageSpeedRes;
        semrushResults = semrushRes;

        console.log('PageSpeed analysis completed:', pageSpeedResults);
        console.log('SEMrush analysis completed:', semrushResults);
        console.log('🔍 SEMrush Results Details:', {
          hasSemrushResults: !!semrushResults,
          semrushKeys: semrushResults ? Object.keys(semrushResults) : [],
          semrushData: semrushResults
        });
      }

      // Get detected social media data
      const detectedSocialData = localStorage.getItem('detectedSocialMedia');
      let socialMediaData = { score: 0, platforms: [], detectionMethods: [] };
      if (detectedSocialData) {
        try {
          const parsed = JSON.parse(detectedSocialData);
          socialMediaData = {
            score: parsed.score || 0,
            platforms: parsed.platforms || [],
            detectionMethods: parsed.detectionMethods || []
          };
          console.log('Using enhanced social media data:', socialMediaData);
        } catch (error) {
          console.log('Failed to parse social media data:', error);
        }
      }

      // Analyze reputation and additional metrics (Google, Trustpilot, Competitors, Social Media)
      let reputationData = { average_rating: 0, total_reviews: 0, sentiment_score: 70, response_rate: '0%' };
      let comprehensiveAnalysisData: any = null;

      if (business?.name) {
        try {
          console.log('🚀 STARTING COMPREHENSIVE ANALYSIS');
          console.log('📍 Business Data:', {
            businessName: business.name,
            address: business.address,
            industry: business.industry,
            websiteUrl: business.website_url,
            hasAddress: !!business.address,
            hasIndustry: !!business.industry
          });

          // IMPORTANT: Only call if we have address and industry
          if (!business.address || !business.industry) {
            console.warn('⚠️ SKIPPING COMPREHENSIVE ANALYSIS: Missing address or industry');
            console.warn('   Address:', business.address || 'MISSING');
            console.warn('   Industry:', business.industry || 'MISSING');
          } else {
            console.log('✅ Address and industry present, calling comprehensive-brand-analysis...');

            // Call comprehensive analysis which includes Google Reviews, Trustpilot, Competitors, and Social Metrics
            const { data: comprehensiveData, error: comprehensiveError } = await supabase.functions.invoke('comprehensive-brand-analysis', {
              body: {
                businessName: business.name,
                websiteUrl: business.website_url,
                address: business.address,
                phoneNumber: business.phone,
                industry: business.industry || 'business',
                latitude: business.latitude,
                longitude: business.longitude,
                socialProfiles: socialMediaData.platforms,
                reportId
              }
            });

            console.log('📡 RESPONSE FROM EDGE FUNCTION:', {
              hasData: !!comprehensiveData,
              hasError: !!comprehensiveError,
              comprehensiveError
            });

            if (comprehensiveData?.data) {
              comprehensiveAnalysisData = comprehensiveData.data;
              console.log('✅ COMPREHENSIVE ANALYSIS COMPLETED');
              console.log('📊 FULL RESPONSE DATA:', JSON.stringify(comprehensiveAnalysisData, null, 2).substring(0, 1000));
              console.log('🏢 Competitors object:', comprehensiveAnalysisData.competitors);
              console.log('🏢 Competitors found:', comprehensiveAnalysisData.competitors?.competitors?.length || 0);
              console.log('⭐ Google Reviews:', comprehensiveAnalysisData.googleReviews);
              console.log('⭐ Trustpilot Reviews:', comprehensiveAnalysisData.trustpilotReviews);

              // Extract reputation data from combined analysis
              if (comprehensiveAnalysisData.combinedReputation) {
                reputationData = {
                  average_rating: comprehensiveAnalysisData.combinedReputation.average_rating || 0,
                  total_reviews: comprehensiveAnalysisData.combinedReputation.total_reviews || 0,
                  sentiment_score: comprehensiveAnalysisData.combinedReputation.sentiment_score || 70,
                  response_rate: (comprehensiveAnalysisData.combinedReputation.response_rate || 0) + '%'
                };
              }
            } else if (comprehensiveError) {
              console.warn('⚠️ COMPREHENSIVE ANALYSIS ERROR:', comprehensiveError);
            } else {
              console.warn('⚠️ NO DATA RETURNED FROM COMPREHENSIVE ANALYSIS');
            }
          }
        } catch (error) {
          console.warn('❌ COMPREHENSIVE ANALYSIS EXCEPTION:', error);
        }
      } else {
        console.warn('⚠️ NO BUSINESS NAME - SKIPPING COMPREHENSIVE ANALYSIS');
      }

      // Calculate comprehensive brand scores
      const calculateWebsiteStrength = () => {
        if (!pageSpeedResults && !semrushResults) return 25;

        let score = 0;
        if (pageSpeedResults) {
          const mobileAvg = (
            pageSpeedResults.mobile.performance +
            pageSpeedResults.mobile.accessibility +
            pageSpeedResults.mobile.bestPractices +
            pageSpeedResults.mobile.seo
          ) / 4;

          const desktopAvg = (
            pageSpeedResults.desktop.performance +
            pageSpeedResults.desktop.accessibility +
            pageSpeedResults.desktop.bestPractices +
            pageSpeedResults.desktop.seo
          ) / 4;

          score = (mobileAvg + desktopAvg) / 2;
        }

        // Enhance with SEMrush domain authority if available
        if (semrushResults?.domain_authority) {
          score = (score * 0.6) + (semrushResults.domain_authority * 0.4);
        }

        return Math.round(score);
      };

      const websiteScore = calculateWebsiteStrength();
      const socialScore = socialMediaData.score;
      const seoScore = semrushResults?.seo_health_score || 0;
      const reputationScore = Math.round((websiteScore * 0.6 + socialScore * 0.4) * 0.8);
      const visibilityScore = semrushResults?.search_visibility
        ? semrushResults.search_visibility
        : (pageSpeedResults ? Math.round((pageSpeedResults.mobile.seo + pageSpeedResults.desktop.seo) / 2 * 0.9) : 20);
      const consistencyScore = pageSpeedResults ? Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices + pageSpeedResults.mobile.accessibility + pageSpeedResults.desktop.accessibility) / 4) : 30;
      const positioningScore = Math.round((websiteScore * 0.7 + socialScore * 0.3) * 0.85);

      const overallScore = Math.round((websiteScore + seoScore + reputationScore + visibilityScore + consistencyScore + positioningScore) / 6);

      // Create comprehensive analysis data
      const analysisData = {
        website: pageSpeedResults ? {
          mobile: pageSpeedResults.mobile,
          desktop: pageSpeedResults.desktop,
          loadingTime: pageSpeedResults.loadingTime,
          seo_score: Math.round((pageSpeedResults.mobile.seo + pageSpeedResults.desktop.seo) / 2),
          performance_score: Math.round((pageSpeedResults.mobile.performance + pageSpeedResults.desktop.performance) / 2),
          accessibility: Math.round((pageSpeedResults.mobile.accessibility + pageSpeedResults.desktop.accessibility) / 2),
          bestPractices: Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices) / 2),
          content_quality: Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices) / 2),
          technical_issues: null
        } : null,
        seo: semrushResults ? {
          domain_authority: semrushResults.domain_authority,
          organic_keywords: semrushResults.organic_keywords,
          organic_traffic: semrushResults.organic_traffic,
          backlinks_count: semrushResults.backlinks_count,
          referring_domains: semrushResults.referring_domains,
          authority_score: semrushResults.authority_score,
          seo_health_score: semrushResults.seo_health_score,
          search_visibility: semrushResults.search_visibility,
          recommendations: semrushResults.recommendations
        } : null,
        social: {
          total_followers: socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.followers || 0), 0),
          engagement_rate: socialMediaData.platforms.length > 0
            ? (socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.engagement || 0), 0) / socialMediaData.platforms.length).toFixed(2) + '%'
            : '0%',
          platforms_active: socialMediaData.platforms.length,
          posting_frequency: 'Regular',
          detected_platforms: socialMediaData.platforms,
          detection_methods: socialMediaData.detectionMethods,
          verified_profiles: socialMediaData.platforms.filter((p: any) => p.verified).length,
          completeness_avg: socialMediaData.platforms.length > 0
            ? Math.round(socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.completeness || 0), 0) / socialMediaData.platforms.length)
            : 0
        },
        reputation: {
          average_rating: reputationData.average_rating,
          total_reviews: reputationData.total_reviews,
          sentiment_score: reputationData.sentiment_score,
          response_rate: reputationData.response_rate
        },
        // Additional metrics from comprehensive analysis
        // These will be populated when edge functions are deployed with API keys configured
        googleReviews: comprehensiveAnalysisData?.googleReviews,
        trustpilotReviews: comprehensiveAnalysisData?.trustpilotReviews,
        competitors: comprehensiveAnalysisData?.competitors,
        socialMediaMetrics: comprehensiveAnalysisData?.socialMedia
      };

      // Ensure all expected fields exist in analysisData for Dashboard compatibility
      if (!analysisData.googleReviews) {
        analysisData.googleReviews = null;
      }
      if (!analysisData.trustpilotReviews) {
        analysisData.trustpilotReviews = null;
      }
      if (!analysisData.competitors) {
        analysisData.competitors = null;
      }
      if (!analysisData.socialMediaMetrics) {
        analysisData.socialMediaMetrics = null;
      }

      // Build recommendations from both APIs
      const recommendations = [
        {
          category: 'Website',
          priority: 'High',
          action: 'Improve page loading speed by optimizing images and enabling compression',
          impact: 'Could improve website score by 10-15 points'
        },
        {
          category: 'Social Media',
          priority: 'Medium',
          action: 'Increase posting frequency and engage more with followers',
          impact: 'Could boost social presence score by 8-12 points'
        },
        {
          category: 'Online Reputation',
          priority: 'High',
          action: 'Respond to all customer reviews and address negative feedback',
          impact: 'Could improve reputation score by 5-10 points'
        }
      ];

      // Add SEMrush-based recommendations
      if (semrushResults?.recommendations && Array.isArray(semrushResults.recommendations)) {
        const seoRecommendations = semrushResults.recommendations.map((rec: string) => ({
          category: 'SEO & Authority',
          priority: rec.includes('high') || rec.includes('critical') ? 'High' : 'Medium',
          action: rec,
          impact: 'Could improve SEO health score'
        }));
        recommendations.push(...seoRecommendations.slice(0, 2)); // Add top 2 SEO recommendations
      }

      // Generate score breakdowns for all 6 score cards
      const scoreBreakdowns = {
        website: {
          factors: ['Performance', 'Accessibility', 'Best Practices', 'SEO'],
          strengths: pageSpeedResults ? [
            `Desktop Performance: ${pageSpeedResults.desktop.performance}/100 - Excellent page load speed`,
            `Mobile Performance: ${pageSpeedResults.mobile.performance}/100 - Mobile experience is responsive`,
            `Accessibility: ${Math.round((pageSpeedResults.mobile.accessibility + pageSpeedResults.desktop.accessibility) / 2)}/100 - Good for all users`,
            `Best Practices: ${Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices) / 2)}/100 - Code quality is solid`
          ] : [],
          weaknesses: pageSpeedResults ? [
            pageSpeedResults.mobile.performance < 70 ? 'Mobile performance: Consider optimizing images and reducing script size' : '',
            pageSpeedResults.desktop.performance < 70 ? 'Desktop performance: Minimize CSS and JavaScript files' : '',
            pageSpeedResults.mobile.accessibility < 80 ? 'Accessibility: Add ARIA labels to interactive elements' : '',
            pageSpeedResults.desktop.seo < 80 ? 'SEO: Improve meta descriptions and heading structure' : ''
          ].filter(Boolean) : []
        },
        social: {
          factors: ['Followers', 'Engagement', 'Posting Frequency', 'Platform Diversity'],
          strengths: socialMediaData.platforms.length > 0 ? (() => {
            const totalFollowers = socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.followers || 0), 0);
            const verifiedCount = socialMediaData.platforms.filter((p: any) => p.verified).length;
            const avgCompleteness = Math.round(socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.completeness || 0), 0) / Math.max(socialMediaData.platforms.length, 1));
            const result = [];

            if (socialMediaData.platforms.length >= 3) {
              result.push(`Active on ${socialMediaData.platforms.length} platforms - Good multi-channel presence`);
            }
            if (totalFollowers > 5000) {
              result.push(`Total followers: ${totalFollowers.toLocaleString()} - Strong audience reach`);
            } else if (totalFollowers > 1000) {
              result.push(`Total followers: ${totalFollowers.toLocaleString()} - Growing audience`);
            }
            if (verifiedCount > 0) {
              result.push(`Verified profiles: ${verifiedCount} - Enhanced credibility`);
            }
            if (avgCompleteness > 80) {
              result.push(`Average profile completeness: ${avgCompleteness}% - Well-optimized profiles`);
            }

            return result.length > 0 ? result : ['Social media profiles detected but need optimization'];
          })() : ['No active social media profiles detected yet'],
          weaknesses: socialMediaData.platforms.length > 0 ? (() => {
            const totalFollowers = socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.followers || 0), 0);
            const verifiedCount = socialMediaData.platforms.filter((p: any) => p.verified).length;
            const avgCompleteness = Math.round(socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.completeness || 0), 0) / Math.max(socialMediaData.platforms.length, 1));
            const weaknesses = [];

            if (socialMediaData.platforms.length < 3) {
              weaknesses.push('Limited platform coverage: Expand to LinkedIn, Instagram, or TikTok');
            }
            if (totalFollowers < 1000) {
              weaknesses.push(`Low follower count (${totalFollowers}): Implement growth strategy and consistent posting`);
            } else if (totalFollowers < 5000) {
              weaknesses.push('Moderate audience size: Continue growth initiatives');
            }
            if (verifiedCount === 0) {
              weaknesses.push('No verified profiles: Apply for verification badges on major platforms');
            }
            if (avgCompleteness < 70) {
              weaknesses.push(`Low profile completeness (${avgCompleteness}%): Add complete bios, links, and professional images`);
            }

            return weaknesses.length > 0 ? weaknesses : [];
          })() : ['No social media presence: Set up at least 3 social accounts']
        },
        reputation: {
          factors: ['Reviews', 'Ratings', 'Sentiment', 'Response Rate'],
          strengths: reputationData.total_reviews > 0 ? [
            `Average rating: ${reputationData.average_rating}/5 - Strong customer satisfaction`,
            `Response rate: ${reputationData.response_rate} - Actively engaging with feedback`,
            `Sentiment score: ${reputationData.sentiment_score}/100 - Positive brand perception`,
            `Review frequency: Regular - Good customer engagement`
          ] : ['No reputation data available yet'],
          weaknesses: reputationData.total_reviews > 0 ? [
            reputationData.total_reviews < 50 ? 'Encourage more customer reviews' : '',
            'Monitor negative sentiment: Address customer concerns promptly',
            'Increase review request frequency: Ask satisfied customers to leave reviews'
          ].filter(Boolean) : ['Set up Google Business Profile to start collecting reviews']
        },
        visibility: {
          factors: ['Search Rankings', 'Keyword Visibility', 'Organic Traffic', 'Search Presence'],
          strengths: semrushResults && (semrushResults.organic_keywords > 0 || semrushResults.organic_traffic > 0) ? (() => {
            const strengths = [];
            if (semrushResults.organic_keywords > 1000) {
              strengths.push(`Organic keywords: ${semrushResults.organic_keywords.toLocaleString()} - Excellent keyword ranking diversity`);
            } else if (semrushResults.organic_keywords > 100) {
              strengths.push(`Organic keywords: ${semrushResults.organic_keywords.toLocaleString()} - Good keyword coverage`);
            }
            if (semrushResults.organic_traffic > 10000) {
              strengths.push(`Estimated traffic: ${semrushResults.organic_traffic.toLocaleString()} monthly - Strong organic reach`);
            } else if (semrushResults.organic_traffic > 1000) {
              strengths.push(`Estimated traffic: ${semrushResults.organic_traffic.toLocaleString()} monthly - Growing organic traffic`);
            }
            if (semrushResults.search_visibility > 50) {
              strengths.push(`Search visibility: ${semrushResults.search_visibility}/100 - Highly visible in search results`);
            } else if (semrushResults.search_visibility > 20) {
              strengths.push(`Search visibility: ${semrushResults.search_visibility}/100 - Visible in search results`);
            }
            return strengths.length > 0 ? strengths : ['Some SEO metrics detected but need improvement'];
          })() : [],
          weaknesses: semrushResults ? (() => {
            const weaknesses = [];
            if (semrushResults.organic_keywords === 0 || semrushResults.organic_keywords < 50) {
              weaknesses.push('No or very limited keyword coverage: Create more target-keyword content and optimize for search');
            } else if (semrushResults.organic_keywords < 100) {
              weaknesses.push('Limited keyword coverage: Create more target-keyword content');
            }
            if (semrushResults.organic_traffic === 0 || semrushResults.organic_traffic < 500) {
              weaknesses.push('No or very low organic traffic: Improve SEO, content strategy, and backlink profile');
            } else if (semrushResults.organic_traffic < 5000) {
              weaknesses.push('Low organic traffic: Improve SEO and content strategy');
            }
            if (semrushResults.search_visibility === 0 || semrushResults.search_visibility < 10) {
              weaknesses.push('No or very low search visibility: Focus on on-page SEO and top-priority keywords');
            } else if (semrushResults.search_visibility < 30) {
              weaknesses.push('Low search visibility: Focus on top-priority keywords');
            }
            return weaknesses.length > 0 ? weaknesses : [];
          })() : []
        },
        consistency: {
          factors: ['Brand Messaging', 'Visual Branding', 'Voice & Tone', 'Design Standards'],
          strengths: pageSpeedResults ? (() => {
            const bestPractices = Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices) / 2);
            const accessibility = Math.round((pageSpeedResults.mobile.accessibility + pageSpeedResults.desktop.accessibility) / 2);
            const strengths = [];

            if (bestPractices > 80) {
              strengths.push(`Technical consistency: ${bestPractices}/100 - Excellent implementation standards`);
            } else if (bestPractices > 60) {
              strengths.push(`Technical consistency: ${bestPractices}/100 - Good implementation standards`);
            }
            if (accessibility > 80) {
              strengths.push(`Design compliance: ${accessibility}/100 - Excellent user experience`);
            } else if (accessibility > 60) {
              strengths.push(`Design compliance: ${accessibility}/100 - Good user experience`);
            }

            return strengths.length > 0 ? strengths : ['Website design detected but needs improvement'];
          })() : [],
          weaknesses: pageSpeedResults ? (() => {
            const bestPractices = Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices) / 2);
            const accessibility = Math.round((pageSpeedResults.mobile.accessibility + pageSpeedResults.desktop.accessibility) / 2);
            const weaknesses = [];

            if (bestPractices < 80) {
              weaknesses.push(`Update design patterns: Technical consistency is ${bestPractices}/100 (target 80+)`);
            }
            if (accessibility < 80) {
              weaknesses.push(`Improve accessibility: Ensure color contrast and typography consistency (${accessibility}/100)`);
            }
            if (bestPractices < 60 || accessibility < 60) {
              weaknesses.push('Create comprehensive brand guidelines documentation');
            }

            return weaknesses.length > 0 ? weaknesses : [];
          })() : []
        },
        positioning: {
          factors: ['Market Differentiation', 'Competitive Advantage', 'Target Audience Clarity', 'Value Proposition'],
          strengths: (() => {
            const strengths = [];
            if (websiteScore > 75) {
              strengths.push(`Overall brand strength: ${websiteScore}/100 - Excellent market position`);
            } else if (websiteScore > 60) {
              strengths.push(`Overall brand strength: ${websiteScore}/100 - Good market position`);
            }
            if (socialScore > 70) {
              strengths.push(`Social integration: ${socialScore}/100 - Strong digital presence`);
            } else if (socialScore > 50) {
              strengths.push(`Social integration: ${socialScore}/100 - Good digital presence`);
            }
            return strengths.length > 0 ? strengths : ['Brand foundation exists, needs development'];
          })(),
          weaknesses: (() => {
            const weaknesses = [];
            if (websiteScore < 60) {
              weaknesses.push(`Strengthen website presence: Current score ${websiteScore}/100 (target 70+)`);
            } else if (websiteScore < 75) {
              weaknesses.push(`Improve website quality: Current score ${websiteScore}/100 (target 80+)`);
            }
            if (socialScore < 50) {
              weaknesses.push(`Build social media strategy: Current score ${socialScore}/100 - Major opportunity`);
            } else if (socialScore < 70) {
              weaknesses.push(`Enhance social media: Current score ${socialScore}/100 (target 75+)`);
            }
            if (websiteScore < 60 || socialScore < 50) {
              weaknesses.push('Clarify unique value proposition and competitive differentiation');
            }
            return weaknesses.length > 0 ? weaknesses : [];
          })()
        }
      };

      // Store results in localStorage for guest users or database for authenticated users
      const isGuest = localStorage.getItem('isGuestUser') === 'true';

      if (isGuest) {
        // Guest user - store results in localStorage
        console.log('Guest mode: Storing results in localStorage');
        console.log('🔍 Analysis Data SEO Object:', {
          hasSeo: !!analysisData.seo,
          seoData: analysisData.seo
        });
        localStorage.setItem('guestAnalysisResults', JSON.stringify({
          overall_score: overallScore,
          website_score: websiteScore,
          social_score: socialScore,
          reputation_score: reputationScore,
          visibility_score: visibilityScore,
          consistency_score: consistencyScore,
          positioning_score: positioningScore,
          analysis_data: analysisData,
          score_breakdowns: scoreBreakdowns,
          recommendations: recommendations,
          report_status: 'completed',
          processing_completed_at: new Date().toISOString()
        }));
      } else {
        // Authenticated user - save to database
        if (reportId) {
          const { error: updateError } = await supabase
            .from('brand_reports')
            .update({
              overall_score: overallScore,
              website_score: websiteScore,
              social_score: socialScore,
              reputation_score: reputationScore,
              visibility_score: visibilityScore,
              consistency_score: consistencyScore,
              positioning_score: positioningScore,
              analysis_data: analysisData,
              score_breakdowns: scoreBreakdowns,
              recommendations: recommendations,
              report_status: 'completed',
              processing_completed_at: new Date().toISOString()
            })
            .eq('id', reportId);

          if (updateError) {
            console.error('Error updating report:', updateError);
          }

          // Kick off enhanced insights via Edge Function to generate score_breakdowns
          try {
            console.log('Calling run-brand-analysis function...');
            const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('run-brand-analysis', {
              body: { businessId, reportId }
            });

            console.log('Enhanced insights response:', { enhancedData, enhancedError });

            if (enhancedError) {
              console.error('Enhanced insights function error:', enhancedError);
              toast.error('Failed to generate detailed insights: ' + enhancedError.message);
            } else if (enhancedData?.success && enhancedData.results) {
              console.log('Enhanced insights received, updating report...');
              const r = enhancedData.results;
              const { error: secondUpdateErr } = await supabase
                .from('brand_reports')
                .update({
                  // Prefer enhanced results where available
                  overall_score: r.overall_score ?? overallScore,
                  website_score: r.website_score ?? websiteScore,
                  social_score: r.social_score ?? socialScore,
                  reputation_score: r.reputation_score ?? reputationScore,
                  visibility_score: r.visibility_score ?? visibilityScore,
                  consistency_score: r.consistency_score ?? consistencyScore,
                  positioning_score: r.positioning_score ?? positioningScore,
                  score_breakdowns: r.score_breakdowns,
                  analysis_data: r.analysis_data ?? analysisData,
                  recommendations: r.recommendations ?? recommendations,
                  data_quality: r.data_quality,
                  api_integration_status: r.api_integration_status,
                })
                .eq('id', reportId);

              if (secondUpdateErr) {
                console.error('Failed to save enhanced insights:', secondUpdateErr);
                toast.error('Failed to save detailed insights to database');
              } else {
                console.log('✅ Enhanced insights with score breakdowns saved successfully');
              }
            } else {
              console.warn('Enhanced insights not returned from function, response:', enhancedData);
            }
          } catch (e: any) {
            console.error('Failed to generate enhanced insights:', e);
            toast.error('Error generating detailed insights: ' + e.message);
          }
        }
      }

      // Analysis complete - stop simulation and lock UI
      console.log('✅ Analysis complete! Setting analysisComplete state to true');
      cancelProgressRef.current = true;
      setOverallProgress(100);

      // Complete all steps
      setAnalysisSteps(prev => prev.map(step => ({
        ...step,
        status: 'completed',
        progress: 100
      })));

      console.log('✅ About to show completion toast and button');
      toast.success('Brand analysis completed successfully!');

      // Set completion last to trigger button display
      setAnalysisComplete(true);

    } catch (error) {
      console.error('Real analysis failed, falling back to simulation:', error);
      toast.error('Analysis encountered issues, but we generated results based on available data.');

      // Fallback to simulation if analysis fails
      cancelProgressRef.current = true;
      await simulateAnalysis();
    }
  };

  const simulateProgressUI = async () => {
    // This provides immediate UI feedback while the real analysis runs in background
    const steps = [...analysisSteps];
    for (let i = 0; i < steps.length; i++) {
      if (cancelProgressRef.current) break;
      // Start processing current step
      steps[i].status = 'processing';
      setAnalysisSteps([...steps]);
      setCurrentStep(i);
      setCurrentStepName(steps[i].title);

      // Simulate progress for current step over 20 seconds (real analysis takes time)
      for (let progress = 0; progress <= 100; progress += 10) {
        if (cancelProgressRef.current) break;
        steps[i].progress = progress;
        setAnalysisSteps([...steps]);
        setOverallProgress(((i * 100) + progress) / steps.length);

        // Wait before next progress update
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Don't complete the step here - let the real analysis complete it
      // Small delay before next step
      if (cancelProgressRef.current) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  };

  const simulateAnalysis = async () => {
    // Fallback simulation (original code) - only used if Edge Function fails
    const steps = [...analysisSteps];

    for (let i = 0; i < steps.length; i++) {
      if (cancelProgressRef.current) break;
      // Start processing current step
      steps[i].status = 'processing';
      setAnalysisSteps([...steps]);
      setCurrentStep(i);
      // Simulate progress for current step
      for (let progress = 0; progress <= 100; progress += 20) {
        if (cancelProgressRef.current) break;
        steps[i].progress = progress;
        setAnalysisSteps([...steps]);
        setOverallProgress(((i * 100) + progress) / steps.length);
        // Wait before next progress update
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Complete current step
      steps[i].status = 'completed';
      setAnalysisSteps([...steps]);

      // Small delay before next step
      if (cancelProgressRef.current) break;
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Analysis complete
    setAnalysisComplete(true);
    setOverallProgress(100);

    // Update report status with mock data if real analysis failed
    if (reportId) {
      await updateReportWithMockResults();
    }

    toast.success('Brand analysis completed successfully!');
  };

  const updateReportWithMockResults = async () => {
    if (!reportId || !business) return;

    try {
      // When real analysis fails, mark scores as unavailable (N/A)
      // Do not generate random/mock data to maintain data integrity
      const unavailableScore = null;

      const mockAnalysisData = {
        website: {
          seo_score: unavailableScore,
          performance_score: unavailableScore,
          content_quality: unavailableScore,
          technical_issues: unavailableScore
        },
        social: {
          total_followers: unavailableScore,
          engagement_rate: 'N/A',
          platforms_active: unavailableScore,
          posting_frequency: 'N/A'
        },
        reputation: {
          average_rating: unavailableScore,
          total_reviews: unavailableScore,
          sentiment_score: unavailableScore,
          response_rate: 'N/A'
        }
      };

      const mockRecommendations = [
        {
          category: 'Analysis',
          priority: 'Medium',
          action: 'Unable to complete full analysis. Please verify website accessibility and try again.',
          impact: 'Ensure all APIs are properly configured and accessible'
        }
      ];

      await supabase
        .from('brand_reports')
        .update({
          overall_score: unavailableScore,
          website_score: unavailableScore,
          social_score: unavailableScore,
          reputation_score: unavailableScore,
          visibility_score: unavailableScore,
          consistency_score: unavailableScore,
          positioning_score: unavailableScore,
          analysis_data: mockAnalysisData,
          recommendations: mockRecommendations,
          report_status: 'failed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      console.log('Report marked as failed - no mock data generated');
    } catch (err) {
      console.error('Error updating report:', err);
    }
  };

  const handleViewReport = () => {
    if (reportId) {
      localStorage.setItem('currentReportId', reportId);
      navigate('/dashboard');
    }
  };

  const handleDownloadReport = () => {
    toast.info('Download functionality coming soon!');
  };

  useEffect(() => {
    // When analysisComplete flips true, ensure spinners stop and steps are completed
    if (analysisComplete) {
      cancelProgressRef.current = true;
      setAnalysisSteps(prev => prev.map(s => ({ ...s, status: 'completed', progress: 100 })));
    }
  }, [analysisComplete]);

  if (!user || !businessId || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your business data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Splash Screen Overlay */}
      <SplashScreen
        isVisible={showSplash}
        progress={overallProgress}
        currentStep={currentStepName}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Analyzing Your Brand Equity
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're analyzing <strong>{business.business_name}</strong> across the internet
          </p>
          <p className="text-sm text-gray-500 mt-2">Website: {business.website_url || 'N/A'}</p>
        </div>

        {/* Analysis Progress */}
        <Card className="shadow-lg border-0 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-50 to-blue-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {analysisComplete ? (
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Brand Analysis {analysisComplete ? 'Complete' : 'in Progress'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {analysisComplete
                      ? 'Your comprehensive brand equity report is ready. Redirecting to dashboard...'
                      : 'Scanning your digital presence across all channels'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-brand-600">{Math.round(overallProgress)}%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Overall Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                <span className="text-sm font-medium text-gray-600">
                  {analysisComplete ? 'Analysis Complete' : `${Math.round(overallProgress)}%`}
                </span>
              </div>
              <Progress value={overallProgress} className="h-4" />
            </div>

            {/* Step-by-Step Analysis */}
            <div className="space-y-3">
              {analysisSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="group animate-fade-in"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div
                    className={`p-4 rounded-lg transition-all duration-300 ${
                      step.status === 'completed'
                        ? 'bg-green-50 border border-green-200 shadow-md'
                        : step.status === 'processing'
                        ? 'bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-300 shadow-lg'
                        : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Step Icon and Number */}
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-md transition-all duration-300 ${
                          step.status === 'completed'
                            ? 'bg-gradient-to-br from-green-400 to-green-600 text-white scale-110'
                            : step.status === 'processing'
                            ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white animate-pulse'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 animate-scale-in" />
                          ) : step.status === 'processing' ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                      </div>

                      {/* Step Details */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{step.title}</h3>
                            <p className="text-sm text-gray-600 mt-0.5">{step.description}</p>
                          </div>
                          <Badge className={`ml-2 shrink-0 ${
                            step.status === 'completed'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : step.status === 'processing'
                              ? 'bg-brand-100 text-brand-700 border-brand-300 animate-pulse'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}>
                            {step.status === 'completed' ? '✓ Complete'
                             : step.status === 'processing' ? '◉ Processing'
                             : '○ Pending'}
                          </Badge>
                        </div>

                        {/* Step Progress Bar */}
                        {step.status !== 'pending' && (
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600">Progress</span>
                              <span className="text-xs font-medium text-gray-700">{step.progress}%</span>
                            </div>
                            <Progress value={step.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Message */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>What we're checking:</strong> Website performance, SEO metrics, social media presence, online reputation, brand visibility, and digital consistency.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Complete Actions */}
        {analysisComplete && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Brand Analysis is Complete!
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We've analyzed your brand across all digital touchpoints and generated a comprehensive report with actionable insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleViewReport}
                  className="btn-primary flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Your Report
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Info */}
        {!analysisComplete && (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Analysis in progress...</strong> This typically takes 2-3 minutes. 
              We're gathering data from multiple sources to provide you with the most accurate brand equity assessment.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default Analysis;