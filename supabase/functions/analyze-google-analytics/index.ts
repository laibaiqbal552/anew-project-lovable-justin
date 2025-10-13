import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function deepMerge(target: any, source: any) {
  const output = { ...(target || {}) }
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(output[key], source[key])
    } else {
      output[key] = source[key]
    }
  }
  return output
}

async function getServiceAccountAccessToken() {
  const clientEmail = Deno.env.get('GOOGLE_SA_EMAIL') || ''
  const privateKeyPem = Deno.env.get('GOOGLE_SA_PRIVATE_KEY') || ''
  if (!clientEmail || !privateKeyPem) return null

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const enc = (obj: any) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj)))).replace(/=+/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const unsigned = `${enc(header)}.${enc(claimSet)}`

  const keyData = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(unsigned))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=+/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${unsigned}.${sigB64}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  })
  if (!res.ok) {
    console.error('SA token exchange failed:', await res.text())
    return null
  }
  const json = await res.json()
  return json.access_token as string
}
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { websiteUrl, accessToken, propertyId, reportId } = await req.json()

    if (!propertyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Analytics property ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Prefer Service Account; fall back to provided OAuth accessToken
    let bearer = accessToken as string | null
    if (!bearer) {
      bearer = await getServiceAccountAccessToken()
    }
    if (!bearer) {
      return new Response(
        JSON.stringify({ success: false, error: 'No GA4 credentials available (Service Account or OAuth token)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Call GA4 Data API for last 30 days
    const gaUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`
    const gaBody = {
      dateRanges: [{ startDate: '30daysAgo', endDate: 'yesterday' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    }

    const gaResp = await fetch(gaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearer}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gaBody),
    })

    if (!gaResp.ok) {
      const txt = await gaResp.text()
      return new Response(
        JSON.stringify({ success: false, error: `GA4 request failed: ${txt}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    const gaJson: any = await gaResp.json()
    const row = gaJson?.rows?.[0]?.metricValues || []
    const getNum = (i: number) => Number(row[i]?.value || 0)
    const analysis = {
      sessions: getNum(1),
      users: getNum(0),
      pageviews: getNum(2),
      avg_session_duration: Math.round(getNum(4)),
      bounce_rate: Math.round(getNum(3) * 100) / 100,
      propertyId,
      websiteUrl,
    }

    // Optionally merge into brand_reports if reportId is provided
    if (reportId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE') ?? ''
      )
      const { data: existing } = await supabase
        .from('brand_reports')
        .select('analysis_data')
        .eq('id', reportId)
        .single()

      const merged = deepMerge(existing?.analysis_data, { analytics: analysis, last_updated: new Date().toISOString() })
      const { error: updateErr } = await supabase
        .from('brand_reports')
        .update({ analysis_data: merged })
        .eq('id', reportId)
      if (updateErr) console.log('Analytics merge non-fatal error:', updateErr)
    }

    return new Response(
      JSON.stringify({ success: true, data: analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Analytics function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error?.message || error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})