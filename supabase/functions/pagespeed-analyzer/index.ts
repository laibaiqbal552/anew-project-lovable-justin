import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface PageSpeedResult {
  mobile: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  desktop: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  loadingTime: {
    mobile: number;
    desktop: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      throw new Error('URL is required')
    }

    console.log(`Analyzing website: ${url}`)

    // Get PageSpeed API key from environment
    const apiKey = Deno.env.get('PAGESPEED_API_KEY')
    if (!apiKey) {
      throw new Error('PAGESPEED_API_KEY environment variable not set')
    }

    // Fetch both mobile and desktop PageSpeed scores
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile`
      ),
      fetch(
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=desktop`
      )
    ])

    if (!mobileRes.ok || !desktopRes.ok) {
      console.error(`PageSpeed API error: mobile=${mobileRes.status}, desktop=${desktopRes.status}`)
      throw new Error(`PageSpeed API error: mobile=${mobileRes.status}, desktop=${desktopRes.status}`)
    }

    const mobileData = await mobileRes.json()
    const desktopData = await desktopRes.json()

    // Extract Lighthouse scores
    const extractScore = (data: any, category: string) => {
      const score = data?.lighthouseResult?.categories?.[category]?.score
      return score ? Math.round(score * 100) : 0
    }

    const extractLoadingTime = (data: any) => {
      const fcp = data?.lighthouseResult?.audits?.['first-contentful-paint']?.numericValue || 0
      return fcp / 1000 // Convert to seconds
    }

    const result: PageSpeedResult = {
      mobile: {
        performance: extractScore(mobileData, 'performance'),
        accessibility: extractScore(mobileData, 'accessibility'),
        bestPractices: extractScore(mobileData, 'best-practices'),
        seo: extractScore(mobileData, 'seo'),
      },
      desktop: {
        performance: extractScore(desktopData, 'performance'),
        accessibility: extractScore(desktopData, 'accessibility'),
        bestPractices: extractScore(desktopData, 'best-practices'),
        seo: extractScore(desktopData, 'seo'),
      },
      loadingTime: {
        mobile: extractLoadingTime(mobileData),
        desktop: extractLoadingTime(desktopData),
      },
    }

    console.log(`✅ PageSpeed analysis completed for ${url}:`, result)

    return new Response(
      JSON.stringify({ success: true, result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('PageSpeed analyzer error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to analyze website with PageSpeed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
