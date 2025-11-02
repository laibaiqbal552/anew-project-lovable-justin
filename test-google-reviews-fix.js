// Test if the FIXED fetch-google-reviews function is deployed

const SUPABASE_URL = 'https://kpqpswkalqbtbviogmcz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXBzd2thbHFidGJ2aW9nbWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDYyNjY1MywiZXhwIjoyMDY2MjAyNjUzfQ.vDa8N20iKEREWmOmhN6P9iAPNVAkWTnJHdAfYMRGv40';

console.log('🧪 Testing fetch-google-reviews Edge Function\n');
console.log('='.repeat(60));

async function testFunction() {
  const url = `${SUPABASE_URL}/functions/v1/fetch-google-reviews`;

  console.log('\n📍 Test: Fetch reviews for Paramount Pest Solutions');
  console.log('Address: 3413-A Washington Ave, Gulfport, MS 39507, USA');
  console.log('Website: https://paramountpestsolutions.com');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        businessName: 'Paramount Pest Solutions',
        address: '3413-A Washington Ave, Gulfport, MS 39507, USA',
        website: 'https://paramountpestsolutions.com'
      })
    });

    console.log('Status:', response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Function call successful!\n');

      if (result.data) {
        const { businessName, rating, totalReviews, placeId, website } = result.data;

        console.log('📊 Results:');
        console.log('  Business Name:', businessName);
        console.log('  Rating:', rating || 'N/A');
        console.log('  Total Reviews:', totalReviews || 0);
        console.log('  Place ID:', placeId || 'N/A');
        console.log('  Website:', website || 'N/A');

        // Check if it's the correct business
        if (businessName && businessName.toLowerCase().includes('paramount')) {
          console.log('\n✅ CORRECT BUSINESS FOUND!');
          console.log('   The fix is working!');
        } else if (businessName && businessName.toLowerCase().includes('american esoteric')) {
          console.log('\n❌ WRONG BUSINESS (Medical Lab)');
          console.log('   The old version is still deployed!');
          console.log('   You need to deploy the updated function.');
        } else if (!businessName || businessName === 'paramountpestsolutions') {
          console.log('\n⚠️  No business found in Google Places');
          console.log('   The business may not have a Google Business Profile');
        } else {
          console.log('\n⚠️  Found different business:', businessName);
        }
      }

      console.log('\n' + '='.repeat(60));
    } else {
      console.log('❌ Function call failed!');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  console.log('\n📋 NEXT STEPS:\n');
  console.log('If you see "WRONG BUSINESS":');
  console.log('  → Deploy the updated function:');
  console.log('  → npx supabase functions deploy fetch-google-reviews --project-ref kpqpswkalqbtbviogmcz --token YOUR_TOKEN');
  console.log('\nIf you see "No business found":');
  console.log('  → The business needs a Google Business Profile');
  console.log('  → Or try a different address format');
  console.log('\n' + '='.repeat(60));
}

testFunction();
