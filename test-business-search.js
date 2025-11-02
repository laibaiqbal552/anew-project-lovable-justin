// Test searching for Paramount Pest Solutions

const apiKey = 'AIzaSyBD2rDf-F62bDIKiB_OwDBNuCJvd0e1CjE';

console.log('🔍 Searching for Paramount Pest Solutions\n');
console.log('='.repeat(60));

async function searchBusiness() {
  // Method 1: Search by business name
  console.log('\n📍 Method 1: Text Search by Business Name');
  const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=Paramount+Pest+Solutions+Gulfport+MS&key=${apiKey}`;

  try {
    const response = await fetch(textSearchUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const business = data.results[0];
      console.log('✅ Found:');
      console.log('   Name:', business.name);
      console.log('   Address:', business.formatted_address);
      console.log('   Rating:', business.rating);
      console.log('   Reviews:', business.user_ratings_total);
      console.log('   Place ID:', business.place_id);
      console.log('   Types:', business.types.join(', '));
    } else {
      console.log('❌ Not found via text search');
      console.log('   Status:', data.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Method 2: Find Place by business name
  console.log('\n📍 Method 2: Find Place API');
  const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Paramount+Pest+Solutions+Gulfport+MS&inputtype=textquery&fields=name,formatted_address,place_id,rating,user_ratings_total,website&key=${apiKey}`;

  try {
    const response = await fetch(findPlaceUrl);
    const data = await response.json();

    if (data.status === 'OK' && data.candidates.length > 0) {
      const business = data.candidates[0];
      console.log('✅ Found:');
      console.log('   Name:', business.name);
      console.log('   Address:', business.formatted_address);
      console.log('   Rating:', business.rating);
      console.log('   Reviews:', business.user_ratings_total);
      console.log('   Website:', business.website);
      console.log('   Place ID:', business.place_id);
    } else {
      console.log('❌ Not found via find place');
      console.log('   Status:', data.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 CONCLUSION:\n');
  console.log('The correct address for Paramount Pest Solutions is:');
  console.log('  3413-A Washington Ave, Gulfport, MS 39507, USA');
  console.log('\nMake sure users select THIS address from autocomplete!');
  console.log('\n' + '='.repeat(60));
}

searchBusiness();
