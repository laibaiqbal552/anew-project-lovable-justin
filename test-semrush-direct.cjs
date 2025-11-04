const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kpqpswkalqbtbviogmcz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXBzd2thbHFidGJ2aW9nbWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczMTQ0NDUsImV4cCI6MjA1Mjg5MDQ0NX0.Vc_6v9sRXI2nDPtmDjLWI1Gg6q6HJ5BrN1JJ4jh_p8I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSEMrush() {
  console.log('🧪 Testing SEMrush Edge Function...\n');

  // Test with a well-known domain first
  console.log('📡 Test 1: Testing with nike.com (should have data if API key is valid)');
  try {
    const { data: nikeData, error: nikeError } = await supabase.functions.invoke('semrush-analyzer', {
      body: {
        domain: 'nike.com'
      }
    });

    if (!nikeError && nikeData?.success) {
      console.log('✅ Nike.com results:', {
        domain_authority: nikeData.result.domain_authority,
        organic_keywords: nikeData.result.organic_keywords,
        organic_traffic: nikeData.result.organic_traffic
      });
      if (nikeData.result.organic_keywords > 0) {
        console.log('✅ SEMrush API key is working!\n');
      } else {
        console.log('⚠️ Nike.com returned zeros - API key might be invalid\n');
      }
    } else {
      console.log('❌ Nike.com test failed:', nikeError || nikeData?.error, '\n');
    }
  } catch (err) {
    console.log('❌ Nike.com test error:', err.message, '\n');
  }

  // Now test with the actual domain
  console.log('📡 Test 2: Testing with paramountpestsolutions.com');
  try {
    console.log('📡 Calling semrush-analyzer edge function...');
    const { data, error } = await supabase.functions.invoke('semrush-analyzer', {
      body: {
        domain: 'paramountpestsolutions.com'
      }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return;
    }

    console.log('✅ Response received:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n📊 SEMrush Results:');
      console.log('   Domain Authority:', data.result.domain_authority);
      console.log('   Organic Keywords:', data.result.organic_keywords);
      console.log('   Organic Traffic:', data.result.organic_traffic);
      console.log('   Backlinks:', data.result.backlinks_count);
      console.log('   Referring Domains:', data.result.referring_domains);
      console.log('   SEO Health Score:', data.result.seo_health_score);

      if (data.result.domain_authority === 0 && data.result.organic_keywords === 0) {
        console.log('\n⚠️ All metrics are 0. This could mean:');
        console.log('   1. The domain is not in SEMrush\'s database yet');
        console.log('   2. The SEMrush API key is invalid');
        console.log('   3. The API quota is exhausted');
      }
    } else {
      console.error('❌ SEMrush analysis failed:', data.error);
    }

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testSEMrush();
