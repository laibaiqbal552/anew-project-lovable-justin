// Test the edge function with the EXACT data from the logs

const SUPABASE_URL = 'https://kpqpswkalqbtbviogmcz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXBzd2thbHFidGJ2aW9nbWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDYyNjY1MywiZXhwIjoyMDY2MjAyNjUzfQ.vDa8N20iKEREWmOmhN6P9iAPNVAkWTnJHdAfYMRGv40';

console.log('🧪 Testing edge function with EXACT data from user logs\n');
console.log('='.repeat(60));

async function testFunction() {
  const url = `${SUPABASE_URL}/functions/v1/fetch-google-reviews`;

  // EXACT data from the user's logs
  const testData = {
    businessName: 'paramountpestsolutions',
    address: '3451 Washington Ave B, Gulfport, MS 39507, United States',
    website: 'https://paramountpestsolutions.com'
  };

  console.log('\n📍 Testing with:');
  console.log('   businessName:', testData.businessName);
  console.log('   address:', testData.address);
  console.log('   website:', testData.website);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (result.data) {
      const { businessName, rating, totalReviews, reviews } = result.data;

      console.log('\n📊 Edge Function Returned:');
      console.log('   Business Name:', businessName);
      console.log('   Rating:', rating);
      console.log('   Total Reviews:', totalReviews);

      if (reviews && reviews.length > 0) {
        console.log('\n   Sample Review:');
        console.log('   Author:', reviews[0].author);
        console.log('   Text:', reviews[0].text.substring(0, 100) + '...');
      }

      if (businessName === 'American Esoteric Laboratories') {
        console.log('\n❌ WRONG BUSINESS! Got medical lab instead of pest control');
        console.log('   This is the bug we need to fix!');
      } else if (businessName && businessName.includes('Paramount')) {
        console.log('\n✅ CORRECT BUSINESS! Got Paramount Pest Solutions');
      } else {
        console.log('\n⚠️  Unexpected business:', businessName);
      }
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFunction();
