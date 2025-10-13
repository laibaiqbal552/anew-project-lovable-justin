import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

function App() {
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

export default App;