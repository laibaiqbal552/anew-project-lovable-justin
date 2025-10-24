# Project Exploration Summary

## 1. Project Type & Stack

### Framework
- **Type**: React 18.3.1 with Vite (build tool)
- **Routing**: React Router DOM v7.6.2
- **Build Tool**: Vite v5.4.14 with SWC transpiler
- **TypeScript**: ~5.7.2
- **CSS Framework**: Tailwind CSS v3.4.17

### Backend/Services
- **Database**: Supabase (PostgreSQL) with authentication
- **Edge Functions**: Deno-based serverless functions for API integrations
- **Client Library**: @supabase/supabase-js v2.50.0

### Key Features
- React Query for data fetching
- Framer Motion v12.4.7 for animations
- Form Handling: React Hook Form + Zod validation
- Component Library: Radix UI primitives with custom shadcn/ui components
- Toast Notifications: Sonner v2.0.1
- Charts: Recharts v3.0.0
- Icons: Lucide React v0.475.0

## 2. Current Loading Screen Implementation

### Existing LoadingSpinner Component
**Location**: src/components/LoadingSpinner.tsx

- Reusable spinner with configurable sizes (sm, md, lg)
- Uses Lucide Loader2 icon with spin animation
- Includes animated ping effect circle
- Optional text with pulse animation
- Applied in Dashboard and other pages showing Loader2 icon directly

### Current Loading Patterns
1. **Dashboard.tsx** (line 440-445): Shows Loader2 spinner while loading report data
2. **Analysis.tsx**: Full analysis page with step-by-step progress tracking
3. **No dedicated splash/boot screen**: Loading happens on individual pages, not globally

### CSS Animations Available
Located in src/index.css:
- fadeIn (0.8s ease-out)
- slideUp (0.8s ease-out)
- slideInLeft / slideInRight (0.6s)
- bounceIn, scaleIn, pulseSlow, float
- Shimmer effect for skeleton loading

## 3. Trustpilot Data Fetching

### Edge Function: fetch-trustpilot-reviews
**Location**: supabase/functions/fetch-trustpilot-reviews/index.ts

#### How It Works
1. **Authentication**: Requires SCRAPAPI_KEY from environment variables
2. **Search Method**: 
   - Attempts to find Trustpilot business page using domain via API
   - Falls back to constructing URL from business name
3. **Data Scraping**: Uses ScrapAPI service to scrape Trustpilot page
4. **Extracted Data**:
   - Business name
   - Overall rating (number or null)
   - Total review count
   - Top 3 reviews (title, rating, date)
   - Source identifier

#### Integration Points
- Called from: supabase/functions/analyze-reputation/index.ts
- Used in: Dashboard Reviews tab (lines 803-856)
- API Response Structure:
  ```
  {
    businessName: string
    rating: number | null
    totalReviews: number | null
    reviews: Array<{title, rating, date}>
    source: string
  }
  ```

#### Display in Dashboard
- **Reviews Tab**: Shows Trustpilot section with:
  - Rating displayed prominently
  - Review count
  - Individual review previews (first 2 reviews)
  - Alert if APIs not configured

#### API Dependencies
- Requires SCRAPAPI_KEY environment variable
- Returns gracefully if key not set (empty data, no error)
- Timeout: 30 seconds

## 4. Project Dependencies & Available UI Libraries

### UI Components
- Accordion, Alert Dialog, Avatar, Badge
- Button, Card, Checkbox, Collapsible
- Combobox/Command, Context Menu, Dialog
- Dropdown Menu, Drawer, Form, Input
- Label, Navigation Menu, Popover
- Progress Bar, Radio Group, Select
- Separator, Slider, Switch, Tabs
- Tooltip, Hover Card, Toast (via Sonner)

### Utility Libraries
- **Styling**: clsx, tailwind-merge
- **Date Handling**: date-fns v3.6.0
- **Validation**: Zod v3.25
- **Form OTP**: input-otp v1.4.2
- **Carousel**: embla-carousel-react v8.5.2
- **Resizable Panels**: react-resizable-panels v2.1.7

### Animations
- **Framer Motion / Motion**: v12.4.7 (not heavily used)
- **Tailwind Animate**: v1.0.7
- **Custom CSS keyframes**: Defined in index.css

## 5. API Integration Patterns

### Supabase Integration Pattern
1. **Supabase Client**: src/integrations/supabase/client.ts
   - Creates authenticated client with anon key
   - Configured for PKCE flow
   - Falls back to demo project if env vars not set

2. **Authentication Flow**:
   - Detects guest vs authenticated users
   - Stores business/report IDs in localStorage
   - Supports both database and guest modes

### Edge Function Pattern
Located in: supabase/functions/*/index.ts

#### Standard Structure
1. CORS headers configuration
2. Method routing (OPTIONS, POST)
3. Request parsing from JSON body
4. Async processing with try/catch
5. Response with status codes
6. Graceful fallback for missing APIs

#### Key Functions
1. run-brand-analysis: Orchestrates all analysis steps
2. analyze-website: PageSpeed Insights API
3. analyze-social-media: Social platform analysis
4. analyze-reputation: Google Reviews + Trustpilot + Competitors
5. semrush-analyzer: SEO domain metrics
6. generate-score-breakdown: Creates detailed insights
7. enrich-with-perplexity: AI enrichment for missing data

#### Data Quality Tracking
All functions track which APIs succeeded:
- website_api: boolean
- social_api: boolean
- reputation_api: boolean
- analytics_api: boolean
- real_data_percentage: number

### Fallback Pattern
- When APIs fail: Returns AI-sourced data via Perplexity
- Dashboard shows "Live Data" vs "AI-sourced" badges
- Functions return success: true even with fallback

## 6. Project Structure

### Key Directories
- src/components/ui/ - Radix UI wrapped components
- src/components/charts/ - Recharts visualizations
- src/pages/ - Main page components
- src/hooks/ - Custom React hooks
- src/integrations/supabase/ - Database client
- src/utils/ - Utility functions
- supabase/functions/ - Serverless edge functions

### Main Pages
- Index.tsx - Home page with features overview
- Dashboard.tsx - Main report view with tabs
- Analysis.tsx - Analysis progress tracking
- StartScan.tsx - Begin analysis workflow
- BusinessSetup.tsx - Business info entry
- SocialConnection.tsx - Social media account linking

## 7. What Needs to Be Changed for Loading Screens

### 1. Create Splash Component
- New src/components/SplashScreen.tsx
- Full-screen overlay during app boot
- TopServ Digital branding
- Animated logo/brand elements
- Progressive loading indicator

### 2. App Root Loading State
- Wrap App.tsx with splash logic
- Check authentication on mount
- Display while loading user/business context
- Auto-dismiss when ready

### 3. Analysis Page Enhancement
- Better progress visualization
- Step animations with staggered timing
- Progress percentage display
- Estimated time remaining

### 4. Trustpilot Loading
- Show skeleton loader while fetching
- Animated transitions for data reveal
- Error boundary with retry

### Design System Available
- Brand colors: Blue (600: #0284c7) - 9 shade palette
- Tailwind animations: 8+ keyframe animations
- Radix UI accessibility primitives
- Lucide React icons (100+ available)
- Responsive grid system (mobile-first)

## Key File Locations

- Main app: src/App.tsx
- Current spinner: src/components/LoadingSpinner.tsx
- Dashboard: src/pages/Dashboard.tsx
- Analysis: src/pages/Analysis.tsx
- Trustpilot function: supabase/functions/fetch-trustpilot-reviews/index.ts
- Supabase client: src/integrations/supabase/client.ts
- Styles: src/index.css, tailwind.config.ts
- HTML entry: index.html
- Vite config: vite.config.ts

