import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, Building, Globe, MapPin, Phone, FileText, ArrowRight, 
  User, Mail, Lock, CheckCircle2, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const scanSchema = z.object({
  // Account Info
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Business Info
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  websiteUrl: z.string().url('Please enter a valid URL (including http:// or https://)'),
  industry: z.string().min(1, 'Please select an industry'),
  address: z.string().min(5, 'Please enter a complete address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  description: z.string().min(10, 'Please provide a brief description of your business'),
});

type ScanForm = z.infer<typeof scanSchema>;

const industries = [
  'HVAC',
  'Pest Control',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Landscaping & Lawn Care',
  'Carpet Cleaning',
  'House Cleaning',
  'Window Cleaning',
  'Garage Door Services',
  'Painting',
  'Handyman Services',
  'Appliance Repair',
  'Lock & Security',
  'Pool & Spa Services',
  'Junk Removal',
  'Moving Services',
  'General Contracting',
  'Flooring',
  'Kitchen & Bath Remodeling',
  'Siding',
  'Gutter Services',
  'Pressure Washing',
  'Tree Services',
  'Snow Removal',
  'Septic Services',
  'Well Services',
  'Foundation Repair',
  'Insulation',
  'Waterproofing',
  'Home Inspection',
  'Other Home Services'
];

const StartScan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipAccount, setSkipAccount] = useState(false);

  const form = useForm<ScanForm>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      businessName: '',
      websiteUrl: '',
      industry: '',
      address: '',
      phone: '',
      description: '',
    },
  });

  const handleSkipAccount = () => {
    setSkipAccount(true);
    setStep(2);
  };

  const handleNext = async () => {
    setError(null);
    
    // Validate current step
    if (step === 1) {
      if (skipAccount) {
        setStep(2);
      } else {
        const valid = await form.trigger(['fullName', 'email', 'password']);
        if (valid) setStep(2);
      }
    } else if (step === 2) {
      const valid = await form.trigger([
        'businessName', 'websiteUrl', 'industry', 
        'address', 'phone', 'description'
      ]);
      if (valid) setStep(3);
    }
  };

  const handleSubmit = async (data: ScanForm) => {
    setIsLoading(true);
    setError(null);

    try {
      if (skipAccount) {
        // Guest flow - store business info in localStorage only
        const guestBusinessId = `guest_${Date.now()}`;
        
        localStorage.setItem('currentBusinessId', guestBusinessId);
        localStorage.setItem('businessWebsiteUrl', data.websiteUrl);
        localStorage.setItem('businessName', data.businessName);
        localStorage.setItem('businessIndustry', data.industry);
        localStorage.setItem('businessAddress', data.address);
        localStorage.setItem('businessPhone', data.phone);
        localStorage.setItem('businessDescription', data.description);
        localStorage.setItem('isGuestUser', 'true');

        toast.success('Starting your brand analysis...');
        navigate('/connect');
      } else {
        // Authenticated flow - create account and save to database
        const redirectUrl = `${window.location.origin}/`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: data.fullName,
              company_name: data.businessName,
            }
          }
        });

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          setError('Failed to create account. Please try again.');
          setIsLoading(false);
          return;
        }

        // Create business record
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .insert({
            user_id: authData.user.id,
            business_name: data.businessName,
            website_url: data.websiteUrl,
            industry: data.industry,
            address: data.address,
            phone: data.phone,
            description: data.description,
          })
          .select()
          .single();

        if (businessError) {
          console.error('Business creation error:', businessError);
          setError('Failed to save business details. Please try again.');
          setIsLoading(false);
          return;
        }

        // Store business info for analysis
        localStorage.setItem('currentBusinessId', business.id);
        localStorage.setItem('businessWebsiteUrl', data.websiteUrl);
        localStorage.setItem('businessName', data.businessName);
        localStorage.removeItem('isGuestUser');

        // Check if session exists (email confirmation disabled)
        if (authData.session) {
          toast.success('Account created! Starting your brand analysis...');
          navigate('/connect');
        } else {
          toast.success('Account created! Please check your email for a confirmation link.');
          setTimeout(() => navigate('/'), 2000);
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
            Start Your Brand Equity Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {step === 1 && "Let's start with your account details"}
            {step === 2 && "Tell us about your business"}
            {step === 3 && "Review and launch your analysis"}
          </p>
          <div className="mt-6">
            <Progress value={progressValue} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Step {step} of 3</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {step === 1 && (
                <>
                  <User className="h-6 w-6 text-brand-600" />
                  Create Your Account
                </>
              )}
              {step === 2 && (
                <>
                  <Building className="h-6 w-6 text-brand-600" />
                  Business Information
                </>
              )}
              {step === 3 && (
                <>
                  <CheckCircle2 className="h-6 w-6 text-brand-600" />
                  Ready to Launch
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1 && "You'll use this email to access your brand reports"}
              {step === 2 && "We'll analyze your digital presence across multiple channels"}
              {step === 3 && "Review your information and start your brand analysis"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Step 1: Account Info */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {!skipAccount && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          {...form.register('fullName')}
                          placeholder="John Smith"
                          disabled={isLoading}
                          autoComplete="name"
                        />
                        {form.formState.errors.fullName && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.fullName.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register('email')}
                          placeholder="you@company.com"
                          disabled={isLoading}
                          autoComplete="email"
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          {...form.register('password')}
                          placeholder="Create a secure password"
                          disabled={isLoading}
                          autoComplete="new-password"
                        />
                        {form.formState.errors.password && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSkipAccount}
                        disabled={isLoading}
                        className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        Continue without creating an account
                      </Button>
                    </>
                  )}

                  {skipAccount && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Guest Mode
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            You're continuing without an account. You'll still get your full brand analysis, but:
                          </p>
                          <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>Results won't be saved for future access</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>You won't receive email updates or notifications</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>You can create an account anytime to save your results</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSkipAccount(false)}
                        size="sm"
                        className="w-full"
                      >
                        I want to create an account instead
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Business Info */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Business Name *
                      </Label>
                      <Input
                        id="businessName"
                        {...form.register('businessName')}
                        placeholder="Your Business Name"
                        disabled={isLoading}
                      />
                      {form.formState.errors.businessName && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Website URL *
                      </Label>
                      <Input
                        id="websiteUrl"
                        {...form.register('websiteUrl')}
                        placeholder="https://yourbusiness.com"
                        disabled={isLoading}
                      />
                      {form.formState.errors.websiteUrl && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.websiteUrl.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select onValueChange={(value) => form.setValue('industry', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.industry && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.industry.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        {...form.register('phone')}
                        placeholder="+1 (555) 123-4567"
                        disabled={isLoading}
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Business Address *
                    </Label>
                    <Input
                      id="address"
                      {...form.register('address')}
                      placeholder="123 Main Street, City, State, ZIP"
                      disabled={isLoading}
                    />
                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Business Description *
                    </Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Briefly describe your business, products, or services..."
                      rows={4}
                      disabled={isLoading}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review and Submit */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-r from-brand-50 to-blue-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      What happens next?
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          We'll create your account and business profile
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Analyze your website, social media, and online presence
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Generate your comprehensive brand equity score (0-100)
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Provide actionable recommendations to improve your brand
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">Your Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Name:</span>
                        <p className="font-medium text-gray-900">{form.watch('fullName')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <p className="font-medium text-gray-900">{form.watch('email')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Business:</span>
                        <p className="font-medium text-gray-900">{form.watch('businessName')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Website:</span>
                        <p className="font-medium text-gray-900 truncate">{form.watch('websiteUrl')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating Your Analysis...
                      </>
                    ) : (
                      <>
                        Start Brand Analysis
                        <Sparkles className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StartScan;
