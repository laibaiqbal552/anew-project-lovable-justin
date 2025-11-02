// Test the full flow with proper formatting

const SUPABASE_URL = 'https://kpqpswkalqbtbviogmcz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXBzd2thbHFidGJ2aW9nbWN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDYyNjY1MywiZXhwIjoyMDY2MjAyNjUzfQ.vDa8N20iKEREWmOmhN6P9iAPNVAkWTnJHdAfYMRGv40';

console.log('🧪 Testing with PROPER formatting\n');
console.log('='.repeat(60));

async function testReviews() {
  const url = `${SUPABASE_URL}/functions/v1/fetch-google-reviews`;

  // Test with proper business name formatting
  const testData = {
    businessName: 'Paramount Pest Solutions',  // Proper capitalization
    address: '3451 Washington Ave B, Gulfport, MS 39507, United States',
    website: 'https://paramountpestsolutions.com'
  };

  console.log('\n📍 Test 1: With proper business name');
  console.log('   businessName:', testData.businessName);

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
      const { businessName, rating, totalReviews, website } = result.data;

      console.log('\n📊 Results:');
      console.log('   Business:', businessName);
      console.log('   Rating:', rating || 'N/A');
      console.log('   Reviews:', totalReviews || 0);
      console.log('   Website:', website || 'N/A');

      if (businessName && businessName.toLowerCase().includes('paramount')) {
        console.log('\n✅ SUCCESS! Found Paramount Pest Solutions');
      } else if (businessName && businessName.toLowerCase().includes('american')) {
        console.log('\n❌ STILL WRONG! Got medical lab');
      } else {
        console.log('\n⚠️  No business found');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testCompetitors() {
  const url = `${SUPABASE_URL}/functions/v1/fetch-competitor-search`;

  const testData = {
    businessName: 'Paramount Pest Solutions',
    address: '3451 Washington Ave B, Gulfport, MS 39507, United States',
    industry: 'Pest Control',
    radius: 5000,
    limit: 15
  };

  console.log('\n\n📍 Test 2: Competitors (should NOT include Paramount)');

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

    if (result.competitors) {
      console.log('\n📊 Competitors found:', result.competitors.length);

      // Check if Paramount is in the list
      const hasParamount = result.competitors.some(c =>
        c.name.toLowerCase().includes('paramount')
      );

      if (hasParamount) {
        console.log('❌ FAIL: Paramount Pest Solutions IS in competitors list');
        const paramount = result.competitors.find(c => c.name.toLowerCase().includes('paramount'));
        console.log('   Found as:', paramount.name);
      } else {
        console.log('✅ SUCCESS: Paramount is NOT in competitors list');
      }

      console.log('\nTop 3 competitors:');
      result.competitors.slice(0, 3).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.name} (${c.rating} ⭐, ${c.reviewCount} reviews)`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  await testReviews();
  await testCompetitors();

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 NEXT STEPS:\n');
  console.log('1. If reviews are working: ✅ Great!');
  console.log('2. If competitors exclude Paramount: ✅ Great!');
  console.log('3. Re-run analysis on your site with FULL business name');
  console.log('4. Make sure to enter: "Paramount Pest Solutions"');
  console.log('\n' + '='.repeat(60));
}

runTests();
