import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function getServiceAccountAccessToken() {
  const clientEmail = Deno.env.get('GOOGLE_SA_EMAIL') || ''
  const privateKeyPem = Deno.env.get('GOOGLE_SA_PRIVATE_KEY') || ''
  if (!clientEmail || !privateKeyPem) return null

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/analytics.edit https://www.googleapis.com/auth/analytics.readonly',
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
  if (!res.ok) return null
  const json = await res.json()
  return json.access_token as string
}

function extractGaIds(html: string) {
  const ids = new Set<string>()
  const ga4Matches = html.match(/G-[A-Z0-9]{6,}/g) || []
  ga4Matches.forEach((m) => ids.add(m))
  const gtmMatches = html.match(/GTM-[A-Z0-9]{6,}/g) || []
  gtmMatches.forEach((m) => ids.add(m))
  return Array.from(ids)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { businessId, websiteUrl } = await req.json()
    if (!businessId || !websiteUrl) {
      return new Response(JSON.stringify({ success: false, error: 'businessId and websiteUrl are required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE') ?? '')

    // 1) Fetch website HTML and extract GA/GTM IDs
    const siteResp = await fetch(websiteUrl, { redirect: 'follow' })
    if (!siteResp.ok) {
      return new Response(JSON.stringify({ success: false, error: `Failed to fetch site: ${siteResp.status}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
    const html = await siteResp.text()
    const ids = extractGaIds(html)
    const gaMeasurementId = ids.find((id) => id.startsWith('G-')) || null

    if (!gaMeasurementId) {
      return new Response(JSON.stringify({ success: false, error: 'No GA4 measurement ID found on site' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 2) Use Admin API to resolve propertyId by matching measurementId in web data streams
    const token = await getServiceAccountAccessToken()
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Service Account credentials missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // List account summaries -> iterate properties
    const summariesResp = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!summariesResp.ok) {
      const t = await summariesResp.text()
      return new Response(JSON.stringify({ success: false, error: `Admin API failed: ${t}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }
    const summaries = await summariesResp.json()
    let propertyId: string | null = null

    for (const acct of summaries?.accountSummaries || []) {
      for (const prop of acct.propertySummaries || []) {
        const pid = prop.property.split('/').pop()
        if (!pid) continue
        const streamsResp = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${pid}/dataStreams`, { headers: { Authorization: `Bearer ${token}` } })
        if (!streamsResp.ok) continue
        const streams = await streamsResp.json()
        const match = (streams?.dataStreams || []).find((s: any) => s.webStreamData?.measurementId === gaMeasurementId)
        if (match) {
          propertyId = pid
          break
        }
      }
      if (propertyId) break
    }

    if (!propertyId) {
      return new Response(JSON.stringify({ success: false, error: 'Property not found for measurement ID' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // 3) Persist to business
    const { error: updateErr } = await supabase
      .from('businesses')
      .update({ google_analytics_property_id: propertyId })
      .eq('id', businessId)
    if (updateErr) {
      return new Response(JSON.stringify({ success: false, error: `Failed to save propertyId: ${updateErr.message}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    return new Response(JSON.stringify({ success: true, propertyId, measurementId: gaMeasurementId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  }
})