import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Building,
  Globe,
  MapPin,
  Phone,
  FileText,
  ArrowRight,
  User,
  Mail,
  Lock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Auto-format phone number to (XXX) XXX-XXXX format
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
};

// Auto-format website URL
const formatWebsiteUrl = (value: string): string => {
  value = value.trim();
  if (!value) return '';

  // Remove all protocols first (http:// or https://)
  let url = value.replace(/^(https?:\/\/)/, '');

  // Remove trailing slash
  url = url.replace(/\/$/, '');

  // If URL is empty after removing protocol, return empty
  if (!url) return '';

  // Add https:// if no protocol exists
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    url = 'https://' + url;
  } else {
    // If original value had protocol, preserve it
    url = value.replace(/\/$/, '');
  }

  return url;
};

const scanSchema = z.object({
  // Account Info
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Business Info
  firstName: z.string().min(2, "Please enter your first name"),
  lastName: z.string().min(2, "Please enter your last name"),
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters"),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .url("Please enter a valid URL (including http:// or https://)")
    .transform(formatWebsiteUrl),
  industry: z.string().min(1, "Please select an industry"),
  address: z.string().min(5, "Please enter a complete address"),
  phone: z.string()
    .min(10, "Please enter a valid phone number")
    .transform(formatPhoneNumber),
  description: z
    .string()
    .min(10, "Please provide a brief description of your business"),
});

type ScanForm = z.infer<typeof scanSchema>;

const StartScan = () => {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipAccount, setSkipAccount] = useState(false);
  const [reviewData, setReviewData] = useState<ScanForm | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Address autocomplete state
  const [addressInput, setAddressInput] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Check if user is already logged in AND if returning from social media
  useEffect(() => {
    const checkAuth = async () => {
      const isGuest = localStorage.getItem('isGuestUser') === 'true';

      // FIRST: Check if returning from social media step (handle for BOTH guests and authenticated users)
      const fromSocialMedia = localStorage.getItem("fromSocialMedia");
      if (fromSocialMedia === "true") {
        // Load saved form data
        const savedData = localStorage.getItem("registrationData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          form.reset(parsedData);
          setReviewData(parsedData);

          // Only check Supabase auth if NOT a guest
          if (!isGuest) {
            // Check if user is authenticated to set correct step count
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              setIsAuthenticated(true);
              setSkipAccount(true);
            }
          }

          setStep(4); // Go directly to review step
        }
        localStorage.removeItem("fromSocialMedia");
        setIsCheckingAuth(false);
        return; // Exit early - don't check auth again
      }

      // SECOND: Check if this is a guest user - NEVER call Supabase for guests!
      if (isGuest) {
        console.log('Guest user detected in StartScan, skipping all auth checks');
        setSkipAccount(true);
        setStep(2); // Skip account creation and go to business details
        setIsCheckingAuth(false);
        return; // Exit early - don't call Supabase!
      }

      // THIRD: Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        setSkipAccount(true);
        setStep(2); // Skip to Business Details step
      } else {
        // No user logged in - default to guest mode (skip account creation)
        setSkipAccount(true);
        setStep(2); // Go directly to business details
        localStorage.setItem('isGuestUser', 'true');
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const form = useForm<ScanForm>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      businessName: "",
      websiteUrl: "",
      industry: "",
      address: "",
      phone: "",
      description: "",
    },
  });

  // Debounce timer for autocomplete
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch address predictions from edge function
  const fetchAddressPredictions = async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsLoadingPredictions(true);

    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: { input }
      });

      if (error) throw error;

      if (data && data.success && data.predictions) {
        setPredictions(data.predictions);
        setShowPredictions(data.predictions.length > 0);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (err) {
      console.error('Error fetching address predictions:', err);
      setPredictions([]);
      setShowPredictions(false);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  // Handle address input change with debounce
  const handleAddressInputChange = (value: string) => {
    setAddressInput(value);
    form.setValue("address", value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchAddressPredictions(value);
    }, 300);
  };

  // Handle prediction selection
  const handlePredictionSelect = (prediction: any) => {
    const address = prediction.description;
    setAddressInput(address);
    form.setValue("address", address);
    setPredictions([]);
    setShowPredictions(false);
    console.log("✅ Address selected:", address);
  };

  // Close predictions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSkipAccount = () => {
    setSkipAccount(true);
    localStorage.setItem('isGuestUser', 'true');
    setStep(2);
  };

  const sendToWebhook = async (data: ScanForm) => {
    try {
      const webhookUrl =
        "https://services.leadconnectorhq.com/hooks/sOFKfTnicELjZQ3sH244/webhook-trigger/b375e331-650f-4897-b03d-5953c55df73c?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2NhdGlvbl9pZCI6InNPRktmVG5pY0VMalpRM3NIMjQ0IiwidmVyc2lvbiI6MSwiaWF0IjoxNzU5OTU4NjYxNDA1LCJzdWIiOiJ1bTVKbzlGUFhHQWczUnFvSmdWTyJ9.5pIP82gutEv4jwyS2CQhnSZI1xQaiewJrPePtwU6Oak";

      // Get the email based on authentication status
      let userEmail = "";
      let userName = "";

      if (isAuthenticated) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userEmail = user.email || "";
          userName = user.user_metadata?.full_name || data.businessName;
        }
      } else if (!skipAccount) {
        userEmail = data.email;
        userName = data.fullName;
      } else {
        userName = data.businessName;
      }

      const payload = {
        email: userEmail,
        phone: data.phone,
        fullName: userName,
        firstName: data.firstName,
        lastName: data.lastName,
        businessName: data.businessName,
        website: data.websiteUrl,
        industry: data.industry,
        address: data.address,
        description: data.description,
      };

      console.log("Sending to webhook:", payload);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Webhook error:", errorText);
      }

      console.log("Webhook sent successfully");
    } catch (error) {
      console.error("Error sending to webhook:", error);
    }
  };

  const handleNext = async () => {
    setError(null);

    // Validate current step - Step 1 is now skipped, so only handle Step 2 and Step 4
    if (step === 2) {
      const valid = await form.trigger([
        "firstName",
        "lastName",
        "businessName",
        "websiteUrl",
        "industry",
        "address",
        "phone",
        "description",
      ]);
      if (valid) {
        // Get form data
        const formData = form.getValues();

        // Send to webhook
        await sendToWebhook(formData);

        // Save form data to localStorage for later retrieval
        localStorage.setItem("registrationData", JSON.stringify(formData));
        localStorage.setItem("businessWebsiteUrl", formData.websiteUrl);
        localStorage.setItem("businessName", formData.businessName);

        // Navigate to social media connection
        toast.success("Information saved! Let's connect your social media.");
        navigate("/connect");
      }
    }
  };

  const handleSubmit = async (data: ScanForm) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if this is a guest user flow FIRST - don't call Supabase for guests!
      const isGuestFlow = skipAccount || localStorage.getItem('isGuestUser') === 'true';

      if (isGuestFlow) {
        // Guest flow - store business info in localStorage only, skip all Supabase calls
        const guestBusinessId = localStorage.getItem('currentBusinessId') || `guest_${Date.now()}`;

        localStorage.setItem("currentBusinessId", guestBusinessId);
        localStorage.setItem("businessWebsiteUrl", data.websiteUrl);
        localStorage.setItem("businessName", data.businessName);
        localStorage.setItem("businessIndustry", data.industry);
        localStorage.setItem("businessAddress", data.address);
        localStorage.setItem("businessPhone", data.phone);
        localStorage.setItem("businessDescription", data.description);
        localStorage.setItem("isGuestUser", "true");

        toast.success("Starting your brand analysis...");
        navigate("/analysis");
        return;
      }

      // Only check Supabase auth if NOT a guest user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && isAuthenticated) {
        // User is already logged in - create business for this user
        const { data: business, error: businessError } = await supabase
          .from("businesses")
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
          console.error("Business creation error:", businessError);
          setError("Failed to save business details. Please try again.");
          setIsLoading(false);
          return;
        }

        // Store business info for analysis
        localStorage.setItem("currentBusinessId", business.id);
        localStorage.setItem("businessWebsiteUrl", data.websiteUrl);
        localStorage.setItem("businessName", data.businessName);
        localStorage.removeItem("isGuestUser");

        // Clean up temporary data
        localStorage.removeItem("registrationData");
        localStorage.removeItem("fromSocialMedia");

        // Save social URLs from localStorage to database if they exist
        const savedSocialUrls = localStorage.getItem("socialUrls");
        if (savedSocialUrls) {
          try {
            const socialUrls = JSON.parse(savedSocialUrls);
            for (const [platform, url] of Object.entries(socialUrls)) {
              if (url && typeof url === "string" && url.trim() !== "") {
                await supabase.from("social_accounts").insert({
                  business_id: business.id,
                  platform: platform,
                  account_url: url.trim(),
                  is_connected: false,
                });
              }
            }
            localStorage.removeItem("socialUrls");
          } catch (err) {
            console.error("Error processing saved social URLs:", err);
          }
        }

        toast.success(
          "Business information saved! Starting your brand analysis..."
        );
        navigate("/analysis");
      } else {
        // New user registration flow - create account and save to database
        const redirectUrl = `${window.location.origin}/`;
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: data.email,
            password: data.password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                full_name: data.fullName,
                company_name: data.businessName,
              },
            },
          }
        );

        if (authError) {
          setError(authError.message);
          setIsLoading(false);
          return;
        }

        if (!authData.user) {
          setError("Failed to create account. Please try again.");
          setIsLoading(false);
          return;
        }

        // Create business record
        const { data: business, error: businessError } = await supabase
          .from("businesses")
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
          console.error("Business creation error:", businessError);
          setError("Failed to save business details. Please try again.");
          setIsLoading(false);
          return;
        }

        // Store business info for analysis
        localStorage.setItem("currentBusinessId", business.id);
        localStorage.setItem("businessWebsiteUrl", data.websiteUrl);
        localStorage.setItem("businessName", data.businessName);
        localStorage.removeItem("isGuestUser");

        // Clean up temporary registration data
        localStorage.removeItem("registrationData");
        localStorage.removeItem("fromSocialMedia");

        // Save social URLs from localStorage to database if they exist
        const savedSocialUrls = localStorage.getItem("socialUrls");
        if (savedSocialUrls) {
          try {
            const socialUrls = JSON.parse(savedSocialUrls);
            console.log("Saving social URLs to database:", socialUrls);

            // Insert each social account into the database
            for (const [platform, url] of Object.entries(socialUrls)) {
              if (url && typeof url === "string" && url.trim() !== "") {
                const { error: socialError } = await supabase
                  .from("social_accounts")
                  .insert({
                    business_id: business.id,
                    platform: platform,
                    account_url: url.trim(),
                    is_connected: false,
                  });

                if (socialError) {
                  console.error(
                    `Error saving ${platform} account:`,
                    socialError
                  );
                }
              }
            }

            // Clean up the temporary social URLs from localStorage
            localStorage.removeItem("socialUrls");
            console.log(
              "Social URLs saved successfully and cleaned up from localStorage"
            );
          } catch (err) {
            console.error("Error processing saved social URLs:", err);
          }
        }

        // Check if session exists (email confirmation disabled)
        if (authData.session) {
          toast.success("Account created! Starting your brand analysis...");
          navigate("/analysis");
        } else {
          toast.success(
            "Account created! Please check your email for a confirmation link."
          );
          setTimeout(() => navigate("/"), 2000);
        }
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Account creation step is removed, so always 4 steps total
  // Step 2 = Business Info (Step 1 of 4)
  // Step 3 = Social Connection (Step 2 of 4)
  // Step 4 = Review (Step 3 of 4)
  // Analysis = (Step 4 of 4)
  const totalSteps = 4;

  // Calculate progress value based on current step
  const progressValue =
    step === 2
      ? 25 // Business Info = 25%
      : step === 3
      ? 50 // Social Connection = 50%
      : step === 4
      ? 75 // Review = 75%
      : 100; // Analysis/Complete = 100%

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

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
            {step === 2 && "Tell us about your business"}
            {step === 3 && "Connect your social media accounts"}
            {step === 4 && "Review your information"}
          </p>
          <div className="mt-6">
            <Progress
              value={progressValue}
              className="w-full max-w-md mx-auto"
            />
            <p className="text-sm text-gray-500 mt-2">
              {/* Account creation step removed, so: */}
              {/* Step 2 = Step 1 of 4 (Business Info) */}
              {/* Step 3 = Step 2 of 4 (Social Connection) */}
              {/* Step 4 = Step 3 of 4 (Review) */}
              Step{" "}
              {
                step === 2
                  ? "1" // Business Info is now step 1
                  : step === 3
                  ? "2" // Social Connection is now step 2
                  : step === 4
                  ? "3" // Review is now step 3
                  : "4" // Analysis/Complete is step 4
              }{" "}
              of {totalSteps}
            </p>
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
              {step === 4 && (
                <>
                  <CheckCircle2 className="h-6 w-6 text-brand-600" />
                  Review Your Information
                </>
              )}
            </CardTitle>
            <CardDescription>
              {step === 1 &&
                "You'll use this email to access your brand reports"}
              {step === 2 &&
                "We'll analyze your digital presence across multiple channels"}
              {step === 4 &&
                "Please review your details before starting the analysis"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Step 1: Account Info */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  {!skipAccount && (
                    <>
                      <div className="space-y-2">
                        <Label
                          htmlFor="fullName"
                          className="flex items-center gap-2"
                        >
                          <User className="h-4 w-4" />
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          {...form.register("fullName")}
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
                        <Label
                          htmlFor="email"
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
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
                        <Label
                          htmlFor="password"
                          className="flex items-center gap-2"
                        >
                          <Lock className="h-4 w-4" />
                          Password *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          {...form.register("password")}
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
                            You're continuing without an account. You'll still
                            get your full brand analysis, but:
                          </p>
                          <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>
                                Results won't be saved for future access
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>
                                You won't receive email updates or notifications
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-600">•</span>
                              <span>
                                You can create an account anytime to save your
                                results
                              </span>
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
                  {/* First Name and Last Name Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        {...form.register("firstName")}
                        placeholder="John"
                        disabled={isLoading}
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        {...form.register("lastName")}
                        placeholder="Smith"
                        disabled={isLoading}
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Business Name and Website URL Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="businessName"
                        className="flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Business Name *
                      </Label>
                      <Input
                        id="businessName"
                        {...form.register("businessName")}
                        placeholder="e.g., Paramount Pest Solutions"
                        disabled={isLoading}
                      />
                      {form.formState.errors.businessName && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="websiteUrl"
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-4 w-4" />
                        Website URL *
                      </Label>
                      <Input
                        id="websiteUrl"
                        {...form.register("websiteUrl", {
                          onChange: (e) => {
                            const formatted = formatWebsiteUrl(e.target.value);
                            form.setValue("websiteUrl", formatted);
                          }
                        })}
                        placeholder="yourbusiness.com or https://yourbusiness.com"
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
                      <Input
                        id="industry"
                        {...form.register("industry")}
                        placeholder="e.g., Pest Control, HVAC, Plumbing"
                        disabled={isLoading}
                      />
                      {form.formState.errors.industry && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.industry.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        {...form.register("phone", {
                          onChange: (e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            form.setValue("phone", formatted);
                          }
                        })}
                        placeholder="(555) 123-4567"
                        disabled={isLoading}
                        maxLength={14}
                      />
                      {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="address"
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Business Address *
                    </Label>
                    <div className="relative" ref={autocompleteRef}>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Start typing an address..."
                        value={addressInput}
                        onChange={(e) => handleAddressInputChange(e.target.value)}
                        disabled={isLoading}
                        autoComplete="off"
                      />

                      {/* Autocomplete Dropdown */}
                      {showPredictions && predictions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {predictions.map((prediction, index) => (
                            <button
                              key={prediction.place_id || index}
                              type="button"
                              onClick={() => handlePredictionSelect(prediction)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {prediction.structured_formatting?.main_text || prediction.description}
                                  </div>
                                  {prediction.structured_formatting?.secondary_text && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {prediction.structured_formatting.secondary_text}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Loading indicator */}
                      {isLoadingPredictions && (
                        <div className="absolute right-3 top-3">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      )}
                    </div>

                    {form.formState.errors.address && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Business Description *
                    </Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
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

              {/* Step 4: Review Information */}
              {step === 4 && reviewData && (
                <div className="space-y-6 animate-fade-in">
                  <div className="border border-gray-200 rounded-lg p-6 space-y-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">
                      Review Your Information
                    </h3>

                    {!skipAccount && (
                      <div className="pb-6 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Account Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Full Name:</span>
                            <p className="font-medium text-gray-900">
                              {reviewData.fullName}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Email:</span>
                            <p className="font-medium text-gray-900">
                              {reviewData.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Business Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">First Name:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.firstName}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Last Name:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.lastName}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Business Name:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.businessName}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Website:</span>
                          <p className="font-medium text-gray-900 truncate">
                            {reviewData.websiteUrl}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Industry:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.industry}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.phone}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Address:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.address}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Description:</span>
                          <p className="font-medium text-gray-900">
                            {reviewData.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-brand-50 to-blue-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-semibold text-lg text-gray-900">
                      Next Steps
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Connect your social media accounts for deeper insights
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          We'll analyze your website, social media, and online
                          presence
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-brand-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">
                          Generate your comprehensive brand equity score (0-100)
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="text-center text-sm text-gray-500">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
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
                    onClick={() => {
                      // Handle back navigation correctly
                      if (step === 4) {
                        // From review step, go back to social media connection page
                        navigate("/connect");
                      } else if (step === 2 && isAuthenticated) {
                        // For authenticated users on business details, cancel to home
                        navigate("/");
                      } else {
                        // Normal back navigation
                        setStep(step - 1);
                      }
                    }}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/")}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}

                {step < 4 ? (
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
                    type="button"
                    onClick={() => {
                      // Use reviewData directly since it's already validated
                      if (reviewData) {
                        handleSubmit(reviewData);
                      }
                    }}
                    disabled={isLoading || !reviewData}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {skipAccount || isAuthenticated
                          ? "Starting Analysis..."
                          : "Creating Account..."}
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
