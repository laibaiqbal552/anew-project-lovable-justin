import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BusinessSelector from '@/components/BusinessSelector';
import { 
  BarChart3, 
  Globe, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  Star,
  Calendar,
  Download,
  Share,
  AlertTriangle,
  CheckCircle,
  
  ExternalLink,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BrandScoreChart from '@/components/charts/BrandScoreChart';
import ScoreBreakdownChart from '@/components/charts/ScoreBreakdownChart';
import TrendChart from '@/components/charts/TrendChart';

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  improvement?: string;
  report?: any;
  breakdown?: any;
}

const ScoreCard = ({ title, score, maxScore, description, icon: Icon, report, breakdown }: ScoreCardProps) => {
  const percentage = (score / maxScore) * 100;
  const [showDetails, setShowDetails] = useState(false);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <Card className="card-hover cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${getScoreBg(score)} rounded-lg flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${getScoreColor(score)}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {report?.data_quality?.website_api && title === 'Website Strength' && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                    Live Data
                  </Badge>
                )}
                {report?.data_quality?.social_api && title === 'Social Media' && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                    Live Data
                  </Badge>
                )}
                {report?.data_quality?.reputation_api && title === 'Online Reputation' && (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                    Live Data
                  </Badge>
                )}
                {!report?.data_quality?.website_api && title === 'Website Strength' && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                    AI‑sourced
                  </Badge>
                )}
                {!report?.data_quality?.social_api && title === 'Social Media' && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                    AI‑sourced
                  </Badge>
                )}
                {!report?.data_quality?.reputation_api && title === 'Online Reputation' && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                    AI‑sourced
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div className="text-sm text-gray-500">/ {maxScore}</div>
          </div>
        </div>
        <Progress value={percentage} className="mb-2" />
        
        {showDetails && breakdown && (
          <div className="mt-4 pt-4 border-t space-y-3 animate-in slide-in-from-top-2">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">What We Measured:</h4>
              <div className="flex flex-wrap gap-1">
                {breakdown.factors?.map((factor: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
            
            {breakdown.strengths && breakdown.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-green-700 mb-1">✓ Strengths:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {breakdown.strengths.map((strength: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {breakdown.weaknesses && breakdown.weaknesses.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-orange-700 mb-1">⚠ Areas to Improve:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {breakdown.weaknesses.map((weakness: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {breakdown.improvement_areas && breakdown.improvement_areas.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-brand-700 mb-1">→ Next Steps:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {breakdown.improvement_areas.slice(0, 3).map((action: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-brand-600 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <p className="text-xs text-gray-500 text-center mt-3">
          {showDetails ? '▲ Click to collapse' : '▼ Click for detailed breakdown'}
        </p>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentBusinessId]);

  const loadDashboardData = async () => {
    try {
      console.log('Loading dashboard data...');
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth error:', error);
        navigate('/');
        return;
      }

      if (!user) {
        console.log('No authenticated user, redirecting to home');
        navigate('/');
        return;
      }
      setUser(user);
      console.log('User authenticated:', user.id);

      let businessId = currentBusinessId || localStorage.getItem('currentBusinessId');
      const reportId = localStorage.getItem('currentReportId');
      
      // If no business ID, try to get the user's first business
      if (!businessId) {
        const { data: userBusinesses } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (userBusinesses && userBusinesses.length > 0) {
          businessId = userBusinesses[0].id;
          if (businessId) {
            localStorage.setItem('currentBusinessId', businessId);
            setCurrentBusinessId(businessId);
          }
        } else {
          console.log('No business found, redirecting to setup');
          navigate('/setup');
          return;
        }
      }

      if (!businessId) {
        navigate('/setup');
        return;
      }

      console.log('Loading business:', businessId);

      // Load business details
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Error loading business:', businessError);
        if (businessError.code === 'PGRST116') {
          // No business found
          console.log('Business not found, redirecting to setup');
          localStorage.removeItem('currentBusinessId');
          localStorage.removeItem('currentReportId');
          navigate('/setup');
          return;
        }
        throw businessError;
      }

      if (!businessData) {
        console.log('No business data found, redirecting to setup');
        localStorage.removeItem('currentBusinessId');
        localStorage.removeItem('currentReportId');
        navigate('/setup');
        return;
      }
      setBusiness(businessData);
      console.log('Business loaded:', businessData.business_name);

      // Load report details if we have a report ID
      if (reportId) {
        console.log('Loading report:', reportId);

        const { data: reportData, error: reportError } = await supabase
          .from('brand_reports')
          .select('*')
          .eq('id', reportId)
          .single();

        if (reportError) {
          console.error('Error loading report:', reportError);
          if (reportError.code === 'PGRST116') {
            // No report found
            console.log('Report not found, redirecting to analysis');
            localStorage.removeItem('currentReportId');
            navigate('/analysis');
            return;
          }
          // Don't throw error for report issues, just redirect to analysis
          navigate('/analysis');
          return;
        }

        if (!reportData) {
          console.log('No report data found, redirecting to analysis');
          localStorage.removeItem('currentReportId');
          navigate('/analysis');
          return;
        }

        // Sanitize recommendations to purge any legacy "connect api" messages
        let sanitized = reportData;
        const recs: any[] = Array.isArray(reportData?.recommendations) ? reportData.recommendations : [];
        const isConnecty = (text?: string) => typeof text === 'string' && /connect\s+.*api|connect\s+api|connect\s+apis|missing\s+apis/i.test(text);
        const filtered = recs.filter((rec: any) => {
          if (!rec) return false;
          if (isConnecty(rec?.category) || isConnecty(rec?.action) || isConnecty(rec?.impact)) return false;
          if (Array.isArray(rec?.specific_tasks) && rec.specific_tasks.some((t: string) => isConnecty(t))) return false;
          return true;
        });
        if (filtered.length !== recs.length) {
          const { error: updErr } = await supabase
            .from('brand_reports')
            .update({ recommendations: filtered })
            .eq('id', reportData.id);
          if (updErr) console.warn('Failed to purge legacy recommendations:', updErr);
          sanitized = { ...reportData, recommendations: filtered } as any;
        }
        setReport(sanitized);
        console.log('Report loaded:', reportData.id);
      } else {
        console.log('No report ID found, redirecting to analysis to create one');
        navigate('/analysis');
        return;
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      toast.error('Failed to load dashboard data. Please try again.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getOverallScoreColor = (score: number) => {
    if (!score || isNaN(score)) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOverallScoreLabel = (score: number) => {
    if (!score || isNaN(score)) return 'Unknown';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const handleBookConsultation = () => {
    window.open('https://book.topservdigital.com/discovery-survey', '_blank', 'noopener,noreferrer');
  };

  const handleDownloadReport = () => {
    toast.info('PDF download functionality coming soon!');
  };

  const handleShareReport = () => {
    try {
      if (navigator.clipboard && window.location.href) {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Report link copied to clipboard!');
      } else {
        toast.error('Unable to copy link. Please copy the URL manually.');
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Unable to copy link. Please copy the URL manually.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!business || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <Button onClick={() => navigate('/setup')}>Start New Analysis</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <BusinessSelector 
              currentBusinessId={currentBusinessId || undefined}
              onBusinessChange={(newBusinessId: string) => {
                setCurrentBusinessId(newBusinessId);
                setLoading(true);
              }}
            />
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                Brand Equity Report
              </h1>
              <p className="text-xl text-gray-600">
                {business.business_name} • Generated on {new Date(report.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleShareReport} className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDownloadReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Data Source Notice (Perplexity mode) */}
        {report.data_quality && report.data_quality.real_data_percentage < 100 && (
          <Alert className="mb-8 border-l-4 border-l-blue-500 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Using AI‑sourced public signals where live sources aren’t connected. You can proceed without connecting anything.
            </AlertDescription>
          </Alert>
        )}

        {/* Overall Score */}
        <Card className="shadow-xl border-0 mb-8 bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center gap-6 mb-6 lg:mb-0">
                <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{report?.overall_score || 0}</div>
                    <div className="text-xs">/ 100</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Overall Brand Equity Score
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${getOverallScoreColor(report?.overall_score || 0)} bg-transparent border`}>
                      {getOverallScoreLabel(report?.overall_score || 0)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor((report?.overall_score || 0) / 20)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-gray-600 mb-4">
                  Your brand is performing {(report?.overall_score || 0) >= 70 ? 'well' : 'below average'} compared to industry benchmarks
                </p>
                <Button
                  onClick={handleBookConsultation}
                  className="btn-primary flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Book Free Consultation with TopServ Digital
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ScoreCard
            title="Website Strength"
            score={report.website_score || 0}
            maxScore={100}
            description="SEO, performance, content quality"
            icon={Globe}
            breakdown={report.score_breakdowns?.website}
          />
          <ScoreCard
            title="Social Media"
            score={report.social_score || 0}
            maxScore={100}
            description="Engagement, followers, consistency"
            icon={Users}
            breakdown={report.score_breakdowns?.social}
          />
          <ScoreCard
            title="Online Reputation"
            score={report.reputation_score || 0}
            maxScore={100}
            description="Reviews, sentiment, response rate"
            icon={Shield}
            breakdown={report.score_breakdowns?.reputation}
          />
          <ScoreCard
            title="Brand Visibility"
            score={report.visibility_score || 0}
            maxScore={100}
            description="Search rankings, mention frequency"
            icon={TrendingUp}
            breakdown={report.score_breakdowns?.visibility}
          />
          <ScoreCard
            title="Digital Consistency"
            score={report.consistency_score || 0}
            maxScore={100}
            description="Visual branding, messaging alignment"
            icon={Zap}
            breakdown={report.score_breakdowns?.consistency}
          />
          <ScoreCard
            title="Market Positioning"
            score={report.positioning_score || 0}
            maxScore={100}
            description="Competitive comparison"
            icon={BarChart3}
            breakdown={report.score_breakdowns?.positioning}
          />
        </div>

        {/* Detailed Analysis */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="data">Detailed Data</TabsTrigger>
            <TabsTrigger value="integrations">API Status</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Brand Score Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Brand Equity Score</CardTitle>
                  <CardDescription>
                    Your overall brand strength visualization
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <BrandScoreChart score={report?.overall_score || 0} size={250} />
                </CardContent>
              </Card>

              {/* Score Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Score Breakdown</CardTitle>
                  <CardDescription>
                    Performance across all brand equity factors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScoreBreakdownChart
                    data={[
                      { name: 'Website', score: Number(report?.website_score ?? 0), maxScore: 100 },
                      { name: 'Social', score: Number(report?.social_score ?? 0), maxScore: 100 },
                      { name: 'Reputation', score: Number(report?.reputation_score ?? 0), maxScore: 100 },
                      { name: 'Visibility', score: Number(report?.visibility_score ?? 0), maxScore: 100 },
                      { name: 'Consistency', score: Number(report?.consistency_score ?? 0), maxScore: 100 },
                      { name: 'Positioning', score: Number(report?.positioning_score ?? 0), maxScore: 100 },
                    ]}
                  />
                  {(report?.website_score ?? 0) === 0 || (report?.social_score ?? 0) === 0 || (report?.reputation_score ?? 0) === 0 ? (
                    <p className="mt-3 text-xs text-gray-600">Tip: Values may be AI‑sourced where live data isn’t available yet.</p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            {/* Trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Performance Trends</CardTitle>
                <CardDescription>
                  Track your brand equity improvements over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart title="6-Month Brand Score Progression" />
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-blue-800">
                    <strong>Insight:</strong> Your brand score has improved by 13 points over the last 6 months, 
                    showing consistent growth in digital presence and customer engagement.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid (hidden as requested) */}
            {/* Removed Monthly Website Visitors, Total Social Followers, and Average Review Rating row */}

            {/* Competitive Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Benchmark Comparison</CardTitle>
                <CardDescription>
                  See how your brand compares to industry averages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Brand Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(report?.overall_score || 0)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold">{report?.overall_score || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Industry Average</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-gray-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                      </div>
                      <span className="text-sm font-bold">62</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Top 10% Benchmark</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-bold">85</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <p className="text-sm text-green-800">
                    <strong>Great news!</strong> Your brand score is {((report?.overall_score || 0) - 62)} points above 
                    the industry average, putting you in the top {report?.overall_score >= 80 ? '20%' : '30%'} of businesses in your sector.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Check if we have breakdown data */}
            {!report.score_breakdowns ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Enhanced Insights Not Available</h3>
                  <p className="text-gray-600 mb-4">
                    This report was generated before our enhanced insights feature was added. 
                    Run a new analysis to get detailed breakdowns of your scores with specific strengths, 
                    weaknesses, and actionable next steps.
                  </p>
                  <Button onClick={() => navigate('/analysis')} className="mt-2">
                    Run New Analysis
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Strengths
                    </CardTitle>
                    <CardDescription>What your brand is doing well</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Collect all strengths from breakdowns */}
                    {report.score_breakdowns?.website?.strengths?.map((strength: string, idx: number) => (
                      <div key={`web-${idx}`} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{strength}</p>
                        </div>
                        {report.data_quality?.website_api && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto self-start">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    ))}
                    {report.score_breakdowns?.social?.strengths?.map((strength: string, idx: number) => (
                      <div key={`social-${idx}`} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{strength}</p>
                        </div>
                        {report.data_quality?.social_api && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto self-start">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    ))}
                    {report.score_breakdowns?.reputation?.strengths?.map((strength: string, idx: number) => (
                      <div key={`rep-${idx}`} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{strength}</p>
                        </div>
                        {report.data_quality?.reputation_api && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto self-start">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    ))}
                    {!report.score_breakdowns?.website?.strengths?.length && 
                     !report.score_breakdowns?.social?.strengths?.length && 
                     !report.score_breakdowns?.reputation?.strengths?.length && (
                      <p className="text-sm text-gray-500">No strengths data available yet. Run a new analysis to get insights.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      Areas for Improvement
                    </CardTitle>
                    <CardDescription>Opportunities to strengthen your brand</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Collect all weaknesses from breakdowns */}
                    {report.score_breakdowns?.website?.weaknesses?.map((weakness: string, idx: number) => (
                      <div key={`web-${idx}`} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{weakness}</p>
                        </div>
                        {report.data_quality?.website_api && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto self-start">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    ))}
                    {report.score_breakdowns?.social?.weaknesses?.map((weakness: string, idx: number) => (
                      <div key={`social-${idx}`} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{weakness}</p>
                        </div>
                        {report.data_quality?.social_api && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto self-start">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    ))}
                    {report.score_breakdowns?.reputation?.weaknesses?.map((weakness: string, idx: number) => (
                      <div key={`rep-${idx}`} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm">{weakness}</p>
                        </div>
                        {report.data_quality?.reputation_api && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200 ml-auto self-start">
                            Live Data
                          </Badge>
                        )}
                      </div>
                    ))}
                    {!report.score_breakdowns?.website?.weaknesses?.length && 
                     !report.score_breakdowns?.social?.weaknesses?.length && 
                     !report.score_breakdowns?.reputation?.weaknesses?.length && (
                      <p className="text-sm text-gray-500">No improvement areas identified. Great job!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {(() => {
              const recs: any[] = Array.isArray(report?.recommendations) ? report!.recommendations : []
              const isConnecty = (text?: string) =>
                typeof text === 'string' && /connect\s+.*api|connect\s+api|connect\s+apis|missing\s+apis/i.test(text)
              const filtered = recs.filter((rec: any) => {
                if (!rec) return false
                if (isConnecty(rec?.category) || isConnecty(rec?.action) || isConnecty(rec?.impact)) return false
                if (Array.isArray(rec?.specific_tasks)) {
                  if (rec.specific_tasks.some((t: string) => isConnecty(t))) return false
                }
                return true
              })
              return filtered.length > 0 ? (
                filtered.map((rec: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                            {rec.priority || 'Medium'} Priority
                          </Badge>
                          <span className="font-semibold">{rec.category || 'General'}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{rec.action || 'No action specified'}</p>
                      <p className="text-sm text-gray-600">{rec.impact || 'Impact assessment pending'}</p>
                      {rec.specific_tasks && rec.specific_tasks.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Specific Tasks:</p>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {rec.specific_tasks.map((task: string, taskIndex: number) => (
                              <li key={taskIndex} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-600">No recommendations available yet. Complete your brand analysis to get personalized suggestions.</p>
                    <Button 
                      onClick={() => navigate('/analysis')} 
                      className="mt-4"
                      variant="outline"
                    >
                      Run Analysis
                    </Button>
                  </CardContent>
                </Card>
              )})()}
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">SEO Score</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.analysis_data?.website?.seo_score}/100</span>
                      {report.data_quality?.website_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Performance</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.analysis_data?.website?.performance_score}/100</span>
                      {report.data_quality?.website_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Content Quality</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.analysis_data?.website?.content_quality}/100</span>
                      {report.data_quality?.website_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Total Followers</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.data_quality?.social_api && typeof report.analysis_data?.social?.total_followers === 'number' ? report.analysis_data.social.total_followers.toLocaleString() : '—'}</span>
                      {report.data_quality?.social_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Engagement Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.data_quality?.social_api && report.analysis_data?.social?.engagement_rate ? report.analysis_data.social.engagement_rate : '—'}</span>
                      {report.data_quality?.social_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Active Platforms</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.data_quality?.social_api && typeof report.analysis_data?.social?.platforms_active === 'number' ? report.analysis_data.social.platforms_active : '—'}</span>
                      {report.data_quality?.social_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reputation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.data_quality?.reputation_api && typeof report.analysis_data?.reputation?.average_rating === 'number' ? `${report.analysis_data.reputation.average_rating}/5.0` : '—'}</span>
                      {report.data_quality?.reputation_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.data_quality?.reputation_api && typeof report.analysis_data?.reputation?.total_reviews === 'number' ? report.analysis_data.reputation.total_reviews : '—'}</span>
                      {report.data_quality?.reputation_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{report.data_quality?.reputation_api && report.analysis_data?.reputation?.response_rate ? report.analysis_data.reputation.response_rate : '—'}</span>
                      {report.data_quality?.reputation_api ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                          Live Data
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                          AI‑sourced
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Integration Status</CardTitle>
                <CardDescription>
                  View which data sources are connected and how to improve your report accuracy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <span>Website API</span>
                    </div>
                    {report.data_quality?.website_api ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        Live Data
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                        AI‑sourced
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span>Social Media API</span>
                    </div>
                    {report.data_quality?.social_api ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        Live Data
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                        AI‑sourced
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <span>Reputation API</span>
                    </div>
                    {report.data_quality?.reputation_api ? (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                        Live Data
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 border-gray-300">
                        AI‑sourced
                      </Badge>
                    )}
                  </div>
                  {/* Removed connect prompts; Perplexity provides AI‑sourced estimates where needed */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-brand-600 to-brand-700 text-white mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Improve Your Brand Equity?
            </h2>
            <p className="text-brand-100 mb-6 max-w-2xl mx-auto">
              Book a free consultation with a representative from TopServ Digital to discuss your brand analysis 
              and create a strategic plan to boost your digital presence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <div className="flex items-center gap-2 text-brand-100">
                <Phone className="h-4 w-4" />
                <span>Free 30-minute consultation</span>
              </div>
              <div className="flex items-center gap-2 text-brand-100">
                <Mail className="h-4 w-4" />
                <span>Personalized action plan</span>
              </div>
            </div>

            <Button
              onClick={handleBookConsultation}
              size="lg"
              variant="secondary"
              className="bg-white text-brand-700 hover:bg-gray-50 px-8 py-4 h-auto text-lg font-semibold"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Book Free Consultation with TopServ Digital
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-brand-200 mt-4">
              TopServ Digital • Trusted by 500+ businesses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;