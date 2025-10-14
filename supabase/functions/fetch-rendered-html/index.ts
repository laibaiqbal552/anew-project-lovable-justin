import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchRequest {
  url: string;
}

interface FetchResponse {
  html: string;
  success: boolean;
  method: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url }: FetchRequest = await req.json()
    console.log(`Fetching rendered HTML for: ${url}`)

    // Try multiple methods to fetch the HTML
    let html = '';
    let method = '';

    // Method 1: Try ScrapingBee (supports JavaScript rendering)
    const scrapingBeeKey = Deno.env.get('SCRAPINGBEE_API_KEY');
    if (scrapingBeeKey && !html) {
      try {
        console.log('Trying ScrapingBee...');
        const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeKey}&url=${encodeURIComponent(url)}&render_js=true&wait=3000`;
        const response = await fetch(scrapingBeeUrl);
        if (response.ok) {
          html = await response.text();
          method = 'ScrapingBee (JavaScript rendered)';
          console.log(`✅ ScrapingBee succeeded`);
        }
      } catch (error) {
        console.warn('ScrapingBee failed:', error);
      }
    }

    // Method 2: Try direct fetch (fallback for static sites)
    if (!html) {
      try {
        console.log('Trying direct fetch...');
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        if (response.ok) {
          html = await response.text();
          method = 'Direct fetch';
          console.log(`✅ Direct fetch succeeded`);
        }
      } catch (error) {
        console.warn('Direct fetch failed:', error);
      }
    }

    // Method 3: Try CORS proxies
    if (!html) {
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];

      for (const proxyUrl of proxies) {
        try {
          console.log(`Trying proxy: ${proxyUrl}`);
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const data = await response.text();
            if (data && data.length > 100) {
              html = data;
              method = `CORS proxy`;
              console.log(`✅ CORS proxy succeeded`);
              break;
            }
          }
        } catch (error) {
          console.warn(`Proxy failed:`, error);
        }
      }
    }

    if (!html) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch website HTML',
          message: 'All fetching methods failed. The website may be blocking automated access.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        html,
        method
      } as FetchResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error fetching HTML:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
