import { useState, useEffect } from 'react';
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
import { Loader2, Building, Globe, MapPin, Phone, FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const businessSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  websiteUrl: z.string().url('Please enter a valid URL (including http:// or https://)'),
  industry: z.string().min(1, 'Please select an industry'),
  address: z.string().min(5, 'Please enter a complete address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  description: z.string().min(10, 'Please provide a brief description of your business'),
});

type BusinessForm = z.infer<typeof businessSchema>;

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

const BusinessSetup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const form = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      websiteUrl: '',
      industry: '',
      address: '',
      phone: '',
      description: '',
    },
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log('No authenticated user, redirecting to home');
        navigate('/');
        return;
      }
      setUser(user);
      console.log('Authenticated user:', user.id);
    } catch (err) {
      console.error('Error checking user:', err);
      navigate('/');
    }
  };


  const handleSubmit = async (data: BusinessForm) => {
    if (!user) {
      toast.error('Please log in to continue');
      navigate('/');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Creating business for user:', user.id);

      // Create business record
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
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
        throw businessError;
      }

      console.log('Business created successfully:', business.id);
      toast.success('Business details saved successfully!');

      // Store business ID in localStorage for the next steps
      localStorage.setItem('currentBusinessId', business.id);

      // Store business data for social media detection in next step
      localStorage.setItem('businessWebsiteUrl', data.websiteUrl);
      localStorage.setItem('businessName', data.businessName);

      // Navigate to social media connection
      navigate('/connect');

    } catch (err: any) {
      console.error('Failed to save business details:', err);
      setError(err.message || 'Failed to save business details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!user) {
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
            Tell Us About Your Business
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We need some basic information about your business to provide accurate brand equity analysis
          </p>
          <div className="mt-6">
            <Progress value={33} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Step 1 of 3</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building className="h-6 w-6 text-brand-600" />
              Business Information
            </CardTitle>
            <CardDescription>
              Please provide accurate information for the best analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    <p className="text-sm text-red-600">
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
                    <p className="text-sm text-red-600">
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
                    <p className="text-sm text-red-600">
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
                    <p className="text-sm text-red-600">
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
                  <p className="text-sm text-red-600">
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
                  <p className="text-sm text-red-600">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
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
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessSetup;