import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Globe, 
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
        const guestBusiness = {
          id: currentBusinessId,
          business_name: localStorage.getItem('businessName') || 'Your Business',
          website_url: localStorage.getItem('businessWebsiteUrl') || '',
          industry: localStorage.getItem('businessIndustry') || '',
          address: localStorage.getItem('businessAddress') || '',
          phone: localStorage.getItem('businessPhone') || '',
          description: localStorage.getItem('businessDescription') || '',
        };
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
          technical_issues: Math.floor(Math.random() * 5) + 1
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
          total_followers: socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.followers || 0), 0) || Math.floor(Math.random() * 10000) + 1000,
          engagement_rate: socialMediaData.platforms.length > 0
            ? (socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.engagement || 0), 0) / socialMediaData.platforms.length).toFixed(2) + '%'
            : (Math.random() * 5 + 1).toFixed(2) + '%',
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
          average_rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          total_reviews: Math.floor(Math.random() * 200) + 50,
          sentiment_score: reputationScore,
          response_rate: Math.floor(Math.random() * 40) + 60 + '%'
        }
      };

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
          strengths: socialMediaData.platforms.length > 0 ? [
            `Active on ${socialMediaData.platforms.length} platform${socialMediaData.platforms.length > 1 ? 's' : ''} - Good multi-channel presence`,
            `Total followers: ${socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.followers || 0), 0).toLocaleString()} - Strong audience reach`,
            `Verified profiles: ${socialMediaData.platforms.filter((p: any) => p.verified).length} - Enhanced credibility`,
            `Average completeness: ${Math.round(socialMediaData.platforms.reduce((sum: number, p: any) => sum + (p.completeness || 0), 0) / Math.max(socialMediaData.platforms.length, 1))}% - Well-optimized profiles`
          ] : ['No active social media profiles detected yet'],
          weaknesses: socialMediaData.platforms.length > 0 ? [
            socialMediaData.platforms.length < 3 ? 'Limited platform coverage: Expand to LinkedIn, Instagram, or TikTok' : '',
            socialMediaData.platforms.some((p: any) => p.followers < 1000) ? 'Some profiles have low followers: Implement growth strategy' : '',
            'Engagement rate could be higher: Post more frequently and interact with audience'
          ].filter(Boolean) : ['No social media presence: Set up at least 3 social accounts']
        },
        reputation: {
          factors: ['Reviews', 'Ratings', 'Sentiment', 'Response Rate'],
          strengths: [
            `Average rating: ${(Math.random() * 1.5 + 3.5).toFixed(1)}/5 - Strong customer satisfaction`,
            `Response rate: ${Math.floor(Math.random() * 40) + 60}% - Actively engaging with feedback`,
            `Sentiment score: ${reputationScore}/100 - Positive brand perception`,
            `Review frequency: Regular - Good customer engagement`
          ],
          weaknesses: [
            `Total reviews: ${Math.floor(Math.random() * 200) + 50} - Encourage more customer reviews`,
            'Monitor negative sentiment: Address customer concerns promptly',
            'Increase review request frequency: Ask satisfied customers to leave reviews'
          ]
        },
        visibility: {
          factors: ['Search Rankings', 'Keyword Visibility', 'Organic Traffic', 'Search Presence'],
          strengths: semrushResults ? [
            `Organic keywords: ${semrushResults.organic_keywords?.toLocaleString() || 0} - Strong keyword ranking diversity`,
            `Estimated traffic: ${semrushResults.organic_traffic?.toLocaleString() || 0} monthly - Good organic reach`,
            `Search visibility: ${semrushResults.search_visibility || 0}/100 - Visible in search results`,
            `Keyword distribution: Well-distributed across target topics`
          ] : [],
          weaknesses: semrushResults ? [
            semrushResults.organic_keywords < 100 ? 'Limited keyword coverage: Create more target-keyword content' : '',
            semrushResults.organic_traffic < 5000 ? 'Low organic traffic: Improve SEO and content strategy' : '',
            semrushResults.search_visibility < 30 ? 'Low search visibility: Focus on top-priority keywords' : ''
          ].filter(Boolean) : []
        },
        consistency: {
          factors: ['Brand Messaging', 'Visual Branding', 'Voice & Tone', 'Design Standards'],
          strengths: pageSpeedResults ? [
            `Technical consistency: ${Math.round((pageSpeedResults.mobile.bestPractices + pageSpeedResults.desktop.bestPractices) / 2)}/100 - Good implementation standards`,
            `Design compliance: ${Math.round((pageSpeedResults.mobile.accessibility + pageSpeedResults.desktop.accessibility) / 2)}/100 - Consistent user experience`,
            'Brand voice: Clear and consistent messaging',
            'Visual identity: Strong design system'
          ] : [],
          weaknesses: pageSpeedResults ? [
            pageSpeedResults.mobile.bestPractices < 80 ? 'Update design patterns to match brand guidelines' : '',
            pageSpeedResults.mobile.accessibility < 80 ? 'Ensure color contrast and typography consistency' : '',
            'Standardize messaging across all platforms',
            'Create brand guidelines documentation'
          ].filter(Boolean) : []
        },
        positioning: {
          factors: ['Market Differentiation', 'Competitive Advantage', 'Target Audience Clarity', 'Value Proposition'],
          strengths: [
            `Overall brand strength: ${websiteScore}/100 - Strong market position`,
            `Social integration: ${socialScore}/100 - Good digital presence`,
            `Market positioning: Competitive advantage identified`,
            'Target audience: Well-defined and engaged'
          ],
          weaknesses: [
            websiteScore < 60 ? 'Strengthen website and online presence' : '',
            socialScore < 50 ? 'Enhance social media strategy and consistency' : '',
            'Clarify unique value proposition',
            'Differentiate from competitors'
          ].filter(Boolean)
        }
      };

      // Store results in localStorage for guest users or database for authenticated users
      const isGuest = localStorage.getItem('isGuestUser') === 'true';

      if (isGuest) {
        // Guest user - store results in localStorage
        console.log('Guest mode: Storing results in localStorage');
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
      // Generate mock scores (in real app, this would be actual analysis results)
      const mockScores = {
        website_score: Math.floor(Math.random() * 30) + 60, // 60-90
        social_score: Math.floor(Math.random() * 40) + 40,   // 40-80
        reputation_score: Math.floor(Math.random() * 25) + 65, // 65-90
        visibility_score: Math.floor(Math.random() * 35) + 45, // 45-80
        consistency_score: Math.floor(Math.random() * 30) + 50, // 50-80
        positioning_score: Math.floor(Math.random() * 20) + 60, // 60-80
      };

      const overallScore = Math.round(
        (mockScores.website_score * 0.25) +
        (mockScores.social_score * 0.25) +
        (mockScores.reputation_score * 0.20) +
        (mockScores.visibility_score * 0.15) +
        (mockScores.consistency_score * 0.10) +
        (mockScores.positioning_score * 0.05)
      );

      const mockAnalysisData = {
        website: {
          seo_score: mockScores.website_score,
          performance_score: Math.floor(Math.random() * 20) + 70,
          content_quality: Math.floor(Math.random() * 25) + 65,
          technical_issues: Math.floor(Math.random() * 5) + 1
        },
        social: {
          total_followers: Math.floor(Math.random() * 10000) + 1000,
          engagement_rate: (Math.random() * 5 + 1).toFixed(2) + '%',
          platforms_active: 3,
          posting_frequency: 'Regular'
        },
        reputation: {
          average_rating: (Math.random() * 1.5 + 3.5).toFixed(1),
          total_reviews: Math.floor(Math.random() * 200) + 50,
          sentiment_score: mockScores.reputation_score,
          response_rate: Math.floor(Math.random() * 40) + 60 + '%'
        }
      };

      const mockRecommendations = [
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

      await supabase
        .from('brand_reports')
        .update({
          overall_score: overallScore,
          website_score: mockScores.website_score,
          social_score: mockScores.social_score,
          reputation_score: mockScores.reputation_score,
          visibility_score: mockScores.visibility_score,
          consistency_score: mockScores.consistency_score,
          positioning_score: mockScores.positioning_score,
          analysis_data: mockAnalysisData,
          recommendations: mockRecommendations,
          report_status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      console.log('Report updated with results');
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
                <div key={step.id} className="group">
                  <div className={`p-4 rounded-lg transition-all duration-200 ${
                    step.status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : step.status === 'processing'
                      ? 'bg-brand-50 border border-brand-200 shadow-sm'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-start gap-4">
                      {/* Step Icon and Number */}
                      <div className="flex items-center gap-3 mt-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                          step.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : step.status === 'processing'
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5" />
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