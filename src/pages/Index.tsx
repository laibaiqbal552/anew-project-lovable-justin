import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Globe, Users, TrendingUp, Shield, Zap, ArrowRight, Star } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: "Comprehensive Scoring",
      description: "Get a detailed 0-100 brand equity score across 6 key digital factors"
    },
    {
      icon: Globe,
      title: "Website Analysis",
      description: "Deep dive into your website's SEO, performance, and user experience"
    },
    {
      icon: Users,
      title: "Social Media Audit",
      description: "Complete analysis of your social presence across all major platforms"
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Monitor your brand equity improvements over time with detailed reports"
    },
    {
      icon: Shield,
      title: "Reputation Monitoring",
      description: "Track online reviews, mentions, and sentiment across the web"
    },
    {
      icon: Zap,
      title: "Comprehensive Analysis",
      description: "Complete brand equity analysis with website performance, social media, and reputation insights"
    }
  ];

  const scoringFactors = [
    { name: "Website Strength", weight: 25, description: "SEO, performance, content quality" },
    { name: "Social Media Presence", weight: 25, description: "Engagement, followers, consistency" },
    { name: "Online Reputation", weight: 20, description: "Reviews, sentiment, response rate" },
    { name: "Brand Visibility", weight: 15, description: "Search rankings, mention frequency" },
    { name: "Digital Consistency", weight: 10, description: "Visual branding, messaging alignment" },
    { name: "Market Positioning", weight: 5, description: "Competitive comparison, unique value" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 via-brand-400/5 to-brand-200/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4 text-brand-700 bg-brand-100">
              Powered by TopServ Digital
            </Badge>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-gray-900 mb-6 animate-fade-in">
              Brand Equity
              <span className="text-gradient block">Analyzer</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
              Discover your business's digital brand strength across the internet. 
              Get a comprehensive 0-100 score with actionable insights to boost your brand equity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button 
                onClick={() => navigate('/start-scan')}
                size="lg" 
                className="btn-primary text-lg px-8 py-4 h-auto"
              >
                Score My Business Brand
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4 h-auto"
                onClick={() => navigate('/sample')}
              >
                View Sample Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-brand-600 mb-2">15+</div>
              <div className="text-gray-600">Data Sources Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-600 mb-2">6</div>
              <div className="text-gray-600">Brand Equity Factors</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-600 mb-2">100%</div>
              <div className="text-gray-600">Actionable Insights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Everything You Need to Measure Brand Equity
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive analysis covers all aspects of your digital brand presence
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-0 shadow-md">
                <CardHeader>
                  <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Scoring Methodology */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Our Scoring Methodology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Based on industry-standard metrics that truly impact brand value
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scoringFactors.map((factor, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{factor.name}</h3>
                    <Badge variant="secondary" className="bg-brand-100 text-brand-700">
                      {factor.weight}%
                    </Badge>
                  </div>
                  <p className="text-gray-600">{factor.description}</p>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${factor.weight * 4}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-brand-600 to-brand-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Ready to Discover Your Brand's True Digital Strength?
          </h2>
          <p className="text-xl text-brand-100 mb-8">
            Join thousands of businesses who've improved their brand equity with our insights
          </p>
          <div className="flex items-center justify-center mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
            ))}
            <span className="ml-3 text-brand-100 font-medium">4.9/5 from 500+ businesses</span>
          </div>
          <Button 
            onClick={() => navigate('/start-scan')}
            size="lg" 
            variant="secondary"
            className="text-lg px-8 py-4 h-auto bg-white text-brand-700 hover:bg-gray-50"
          >
            Get Your Free Brand Analysis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">
              © 2024 TopServ Digital. Built with precision for business growth.
            </p>
            <div className="flex gap-6">
              <Button 
                variant="link" 
                className="text-gray-400 hover:text-white"
                onClick={() => navigate('/terms')}
              >
                Terms & Conditions
              </Button>
              <Button 
                variant="link" 
                className="text-gray-400 hover:text-white"
                onClick={() => navigate('/privacy')}
              >
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;