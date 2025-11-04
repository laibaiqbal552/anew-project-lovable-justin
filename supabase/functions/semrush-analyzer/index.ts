import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SEMrushResult {
  domain_authority: number;
  organic_keywords: number;
  organic_traffic: number;
  backlinks_count: number;
  referring_domains: number;
  authority_score: number;
  seo_health_score: number;
  recommendations: string[];
  ranking_keywords?: number;
  search_visibility?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { domain } = await req.json()

    if (!domain) {
      throw new Error('Domain is required')
    }

    console.log(`Analyzing domain with SEMrush: ${domain}`)

    // Get SEMrush API key from environment
    const apiKey = Deno.env.get('SEMRUSH_API_KEY')
    if (!apiKey) {
      throw new Error('SEMRUSH_API_KEY environment variable not set')
    }

    // Parse domain from URL if needed and remove www. prefix
    let parsedDomain = domain.replace(/^https?:\/\//, '').split('/')[0]
    // Remove www. prefix as SEMrush typically indexes root domains
    parsedDomain = parsedDomain.replace(/^www\./, '')

    // 1. Get Domain Ranks (organic keywords, traffic, etc.)
    console.log(`Fetching SEMrush Domain Ranks for: ${parsedDomain}`)
    const overviewUrl = `https://api.semrush.com/?type=domain_ranks&key=${apiKey}&domain=${parsedDomain}&database=us`
    const overviewRes = await fetch(overviewUrl)

    let overviewData = {
      organic_keywords: 0,
      organic_traffic: 0,
      search_visibility: 0,
    }

    if (overviewRes.ok) {
      const overviewText = await overviewRes.text()
      console.log(`📊 SEMrush Overview Response (first 500 chars): ${overviewText.substring(0, 500)}`)
      const lines = overviewText.trim().split('\n')
      console.log(`📊 Response has ${lines.length} lines, first line: ${lines[0]}`)
      if (lines.length > 1) {
        console.log(`📊 Second line: ${lines[1]}`)
      }
      if (lines.length > 1 && lines[1] !== 'Nothing found.' && !lines[1].includes('ERROR')) {
        const values = lines[1].split(';')
        // Domain Ranks format: Database;Domain;Rank;Organic Keywords;Organic Traffic;Organic Cost;...
        // Index: 0=Database, 1=Domain, 2=Rank, 3=Organic Keywords, 4=Organic Traffic
        overviewData = {
          organic_keywords: parseInt(values[3]) || 0,
          organic_traffic: parseInt(values[4]) || 0,
          search_visibility: Math.round((parseInt(values[4]) || 0) / 10000), // Normalize to 0-100
        }
        console.log(`SEMrush Overview: Keywords=${overviewData.organic_keywords}, Traffic=${overviewData.organic_traffic}`)
      } else {
        console.log('⚠️ No overview data found for domain - SEMrush returned "Nothing found" or empty response')
      }
    } else {
      console.error(`❌ SEMrush Overview API error: ${overviewRes.status} ${overviewRes.statusText}`)
      const errorText = await overviewRes.text()
      console.error(`❌ Error response: ${errorText.substring(0, 200)}`)
    }

    // 2. Try to get Backlinks data (may not be available in all plans)
    console.log(`Attempting to fetch SEMrush Backlinks for: ${parsedDomain}`)
    const backlinksUrl = `https://api.semrush.com/?type=backlinks_overview&key=${apiKey}&target=${parsedDomain}&target_type=root_domain`
    const backlinksRes = await fetch(backlinksUrl)

    let backlinksData = {
      backlinks_count: 0,
      referring_domains: 0,
      authority_score: 0,
    }

    if (backlinksRes.ok) {
      const backlinksText = await backlinksRes.text()
      console.log(`🔗 SEMrush Backlinks Response (first 500 chars): ${backlinksText.substring(0, 500)}`)
      const lines = backlinksText.trim().split('\n')

      // Check if endpoint is not available (common for basic plans)
      if (backlinksText.includes('ERROR') || backlinksText.includes('query type not found')) {
        console.log('⚠️ Backlinks endpoint not available - using estimated values based on traffic')
        // Estimate authority from organic metrics if backlinks not available
        const trafficScore = Math.min(100, Math.floor(overviewData.organic_traffic / 100000))
        backlinksData = {
          backlinks_count: 0,
          referring_domains: 0,
          authority_score: Math.min(100, 20 + trafficScore), // Estimate from traffic
        }
      } else if (lines.length > 1 && lines[1] !== 'Nothing found.') {
        const values = lines[1].split(';')
        // Backlinks Overview format: Target;Backlinks;Domains;IP Addresses;...
        backlinksData = {
          backlinks_count: parseInt(values[1]) || 0,
          referring_domains: parseInt(values[2]) || 0,
          authority_score: Math.min(100, Math.floor((parseInt(values[1]) || 0) / 100) + 20), // Estimate authority
        }
        console.log(`SEMrush Backlinks: Total=${backlinksData.backlinks_count}, Domains=${backlinksData.referring_domains}, Authority=${backlinksData.authority_score}`)
      } else {
        console.log('⚠️ No backlinks data found for domain - SEMrush returned "Nothing found" or empty response')
      }
    } else {
      console.error(`❌ SEMrush Backlinks API error: ${backlinksRes.status} ${backlinksRes.statusText}`)
      const errorText = await backlinksRes.text()
      console.error(`❌ Error response: ${errorText.substring(0, 200)}`)
    }

    // Calculate SEO Health Score
    const calculateSEOHealth = () => {
      const keywordsScore = Math.min(100, (overviewData.organic_keywords / 100) * 100)
      const trafficScore = Math.min(100, (overviewData.organic_traffic / 1000) * 100)
      const backlinkScore = Math.min(100, (backlinksData.referring_domains / 100) * 100)
      const authorityScore = backlinksData.authority_score

      return Math.round((keywordsScore * 0.3 + trafficScore * 0.3 + backlinkScore * 0.2 + authorityScore * 0.2))
    }

    const seoHealthScore = calculateSEOHealth()

    // Generate recommendations based on metrics
    const generateRecommendations = () => {
      const recommendations: string[] = []

      if (overviewData.organic_keywords < 100) {
        recommendations.push('Expand keyword targeting and create more optimized content')
      }

      if (overviewData.organic_traffic < 1000) {
        recommendations.push('Improve on-page SEO to increase organic traffic')
      }

      if (backlinksData.referring_domains < 50) {
        recommendations.push('Build more high-quality backlinks from relevant domains')
      }

      if (backlinksData.authority_score < 30) {
        recommendations.push('Focus on acquiring links from high-authority domains')
      }

      if (seoHealthScore < 50) {
        recommendations.push('Conduct a comprehensive SEO audit to identify critical issues')
      }

      if (recommendations.length === 0) {
        recommendations.push('Strong SEO foundation - focus on maintaining and growing organic reach')
      }

      return recommendations
    }

    // Use real data from APIs, don't generate random fallbacks
    const result: SEMrushResult = {
      domain_authority: backlinksData.authority_score,
      organic_keywords: overviewData.organic_keywords,
      organic_traffic: overviewData.organic_traffic,
      backlinks_count: backlinksData.backlinks_count,
      referring_domains: backlinksData.referring_domains,
      authority_score: backlinksData.authority_score,
      seo_health_score: seoHealthScore,
      search_visibility: overviewData.search_visibility,
      recommendations: generateRecommendations(),
    }

    console.log(`✅ SEMrush analysis completed for ${parsedDomain}:`, result)

    // Include debug info in response temporarily
    return new Response(
      JSON.stringify({
        success: true,
        result,
        debug: {
          parsedDomain,
          hasOverviewData: overviewData.organic_keywords > 0 || overviewData.organic_traffic > 0,
          hasBacklinksData: backlinksData.backlinks_count > 0 || backlinksData.referring_domains > 0,
          note: overviewData.organic_keywords === 0 && backlinksData.backlinks_count === 0
            ? 'Domain not found in SEMrush database - this is normal for small local businesses'
            : 'SEMrush data available'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('SEMrush analyzer error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to analyze domain with SEMrush'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
