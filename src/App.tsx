import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import StartScan from "./pages/StartScan";
import BusinessSetup from "./pages/BusinessSetup";
import SocialConnection from "./pages/SocialConnection";
import Analysis from "./pages/Analysis";
import Dashboard from "./pages/Dashboard";
import SampleReport from "./pages/SampleReport";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AccountHub from "./pages/AccountHub";
import SiteHeader from "@/components/SiteHeader";
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <SiteHeader />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/start-scan" element={<StartScan />} />
              <Route path="/setup" element={<BusinessSetup />} />
              <Route path="/connect" element={<SocialConnection />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sample" element={<SampleReport />} />
              <Route path="/account" element={<AccountHub />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initProgress, setInitProgress] = useState(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization with progress updates
        setInitProgress(20);

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        setInitProgress(60);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
        setInitProgress(100);

        // Hide splash screen after a brief moment
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error('App initialization error:', error);
        // Even if there's an error, continue loading
        setInitProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <SplashScreen
        isVisible={isInitializing}
        progress={initProgress}
        currentStep="Initializing TopServ..."
      />
      <AppContent />
    </>
  );
}

export default App;