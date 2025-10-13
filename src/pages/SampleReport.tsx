import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ArrowRight,
  ExternalLink,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  improvement?: string;
  isLive?: boolean;
}

const ScoreCard = ({ title, score, maxScore, description, icon: Icon, improvement, isLive = false }: ScoreCardProps) => {
  const percentage = (score / maxScore) * 100;
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
    <Card className="card-hover">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${getScoreBg(score)} rounded-lg flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${getScoreColor(score)}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {isLive ? (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 border-green-200">
                    Live Data
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                    Sample Data
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
        {improvement && (
          <p className="text-sm text-gray-600 mt-2">{improvement}</p>
        )}
      </CardContent>
    </Card>
  );
};

const SampleReport = () => {
  const navigate = useNavigate();

  // Sample data for demonstration
  const sampleReport = {
    business_name: "TechFlow Solutions",
    overall_score: 74,
    website_score: 82,
    social_score: 68,
    reputation_score: 79,
    visibility_score: 71,
    consistency_score: 65,
    positioning_score: 77,
    analysis_data: {
      website: {
        seo_score: 85,
        performance_score: 78,
        content_quality: 83,
        domain_authority: 45,
        backlinks_count: 1247,
        organic_keywords: 892,
        monthly_traffic: 12450,
        pagespeed_desktop: 89,
        pagespeed_mobile: 72
      },
      social: {
        total_followers: 8420,
        engagement_rate: "3.8%",
        platforms_active: 4,
        posting_frequency: "Regular"
      },
      reputation: {
        average_rating: "4.3",
        total_reviews: 127,
        sentiment_score: 79,
        response_rate: "85%"
      }
    },
    recommendations: [
      {
        category: 'Website Performance',
        priority: 'High',
        action: 'Optimize mobile page speed by compressing images and minifying CSS/JS',
        impact: 'Could improve website score by 8-12 points',
        specific_tasks: [
          'Compress and optimize all images',
          'Enable GZIP compression',
          'Minify CSS and JavaScript files',
          'Implement lazy loading for images'
        ]
      },
      {
        category: 'Social Media',
        priority: 'Medium',
        action: 'Increase engagement rates by posting more interactive content',
        impact: 'Could boost social presence score by 10-15 points',
        specific_tasks: [
          'Create more polls and questions',
          'Share behind-the-scenes content',
          'Respond to comments within 2 hours',
          'Use trending hashtags strategically'
        ]
      },
      {
        category: 'Brand Consistency',
        priority: 'Medium',
        action: 'Standardize visual branding across all digital platforms',
        impact: 'Could improve consistency score by 12-18 points',
        specific_tasks: [
          'Update all profile pictures to match brand guidelines',
          'Create consistent color palette usage',
          'Standardize bio/description formats',
          'Align posting styles across platforms'
        ]
      }
    ]
  };

  const getOverallScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getOverallScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const handleGetStarted = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/')} 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                Sample Report
              </Badge>
            </div>
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
              Brand Equity Report
            </h1>
            <p className="text-xl text-gray-600">
              {sampleReport.business_name} • Sample Analysis Report
            </p>
          </div>
          <div className="flex gap-3 mt-4 lg:mt-0">
            <Button variant="outline" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Sample Data Notice */}
        <Alert className="mb-8 border-l-4 border-l-blue-500 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>This is a sample report</strong> showing what your actual brand analysis would look like. 
                Real reports include live data from your connected accounts and websites.
              </div>
              <Button size="sm" onClick={handleGetStarted} className="ml-4 bg-blue-600 hover:bg-blue-700 text-white">
                Get My Real Report
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Overall Score */}
        <Card className="shadow-xl border-0 mb-8 bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center gap-6 mb-6 lg:mb-0">
                <div className="w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{sampleReport.overall_score}</div>
                    <div className="text-xs">/ 100</div>
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Overall Brand Equity Score
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${getOverallScoreColor(sampleReport.overall_score)} bg-transparent border`}>
                      {getOverallScoreLabel(sampleReport.overall_score)}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(sampleReport.overall_score / 20)
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
                  This sample brand is performing well compared to industry benchmarks
                </p>
                <Button
                  onClick={handleGetStarted}
                  className="btn-primary flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Analyze My Brand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ScoreCard
            title="Website Strength"
            score={sampleReport.website_score}
            maxScore={100}
            description="SEO, performance, content quality"
            icon={Globe}
            improvement="Focus on mobile optimization"
          />
          <ScoreCard
            title="Social Media"
            score={sampleReport.social_score}
            maxScore={100}
            description="Engagement, followers, consistency"
            icon={Users}
            improvement="Increase posting frequency"
          />
          <ScoreCard
            title="Online Reputation"
            score={sampleReport.reputation_score}
            maxScore={100}
            description="Reviews, sentiment, response rate"
            icon={Shield}
            improvement="Respond to more reviews"
          />
          <ScoreCard
            title="Brand Visibility"
            score={sampleReport.visibility_score}
            maxScore={100}
            description="Search rankings, mention frequency"
            icon={TrendingUp}
            improvement="Improve local SEO presence"
          />
          <ScoreCard
            title="Digital Consistency"
            score={sampleReport.consistency_score}
            maxScore={100}
            description="Visual branding, messaging alignment"
            icon={Zap}
            improvement="Standardize brand assets"
          />
          <ScoreCard
            title="Market Positioning"
            score={sampleReport.positioning_score}
            maxScore={100}
            description="Competitive comparison"
            icon={BarChart3}
            improvement="Highlight unique value"
          />
        </div>

        {/* Detailed Analysis */}
        <Tabs defaultValue="insights" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="data">Detailed Data</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <p className="text-sm">Strong website performance with good SEO optimization</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <p className="text-sm">Excellent customer review ratings across platforms</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <p className="text-sm">Active presence on multiple social media platforms</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <p className="text-sm">Mobile page speed needs optimization</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <p className="text-sm">Social media engagement rates below industry average</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <p className="text-sm">Inconsistent visual branding across platforms</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            {sampleReport.recommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
                        {rec.priority} Priority
                      </Badge>
                      <span className="font-semibold">{rec.category}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{rec.action}</p>
                  <p className="text-sm text-gray-600 mb-3">{rec.impact}</p>
                  {rec.specific_tasks && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Specific Tasks:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {rec.specific_tasks.map((task, taskIndex) => (
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
            ))}
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Website Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">SEO Score</span>
                    <span className="font-medium">{sampleReport.analysis_data.website.seo_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Performance</span>
                    <span className="font-medium">{sampleReport.analysis_data.website.performance_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Domain Authority</span>
                    <span className="font-medium">{sampleReport.analysis_data.website.domain_authority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Traffic</span>
                    <span className="font-medium">{sampleReport.analysis_data.website.monthly_traffic.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Media</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Followers</span>
                    <span className="font-medium">{sampleReport.analysis_data.social.total_followers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Engagement Rate</span>
                    <span className="font-medium">{sampleReport.analysis_data.social.engagement_rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active Platforms</span>
                    <span className="font-medium">{sampleReport.analysis_data.social.platforms_active}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Posting Frequency</span>
                    <span className="font-medium">{sampleReport.analysis_data.social.posting_frequency}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reputation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <span className="font-medium">{sampleReport.analysis_data.reputation.average_rating}/5.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-medium">{sampleReport.analysis_data.reputation.total_reviews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sentiment Score</span>
                    <span className="font-medium">{sampleReport.analysis_data.reputation.sentiment_score}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-medium">{sampleReport.analysis_data.reputation.response_rate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-brand-600 to-brand-700 text-white mt-8">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Your Real Brand Analysis?
            </h2>
            <p className="text-brand-100 mb-6 max-w-2xl mx-auto">
              This sample shows what your comprehensive brand equity report would look like. 
              Get started now to analyze your actual business data.
            </p>

            <Button
              onClick={handleGetStarted}
              size="lg"
              variant="secondary"
              className="bg-white text-brand-700 hover:bg-gray-50 px-8 py-4 h-auto text-lg font-semibold"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Analyze My Brand Now
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-brand-200 mt-4">
              Free analysis • No credit card required • Results in 3 minutes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SampleReport;