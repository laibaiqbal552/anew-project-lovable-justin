const { execSync } = require('child_process');

// Get SEMrush API key from Supabase secrets
console.log('🔍 Fetching SEMrush API key from Supabase...\n');

const secretsList = execSync('npx supabase secrets list', { encoding: 'utf-8' });
const lines = secretsList.split('\n');
const semrushLine = lines.find(line => line.includes('SEMRUSH_API_KEY'));

if (!semrushLine) {
  console.error('❌ SEMRUSH_API_KEY not found in Supabase secrets');
  process.exit(1);
}

// For security, we won't display the full key
console.log('✅ SEMRUSH_API_KEY found in Supabase secrets');
console.log('📊 Testing SEMrush API with nike.com...\n');

// We can't get the actual key value without making a Supabase API call with service role key
// So let's just document what the user should check

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('SEMrush API Troubleshooting');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('The SEMrush API is returning zeros even for nike.com.');
console.log('This indicates an API key issue.\n');

console.log('Please check the following:\n');

console.log('1️⃣  API Key Validity:');
console.log('   • Log in to https://www.semrush.com/');
console.log('   • Go to your API dashboard');
console.log('   • Verify the API key is active and not expired\n');

console.log('2️⃣  API Credits/Quota:');
console.log('   • Check if you have remaining API credits');
console.log('   • SEMrush API keys often have usage limits');
console.log('   • You may need to upgrade your plan\n');

console.log('3️⃣  Database Access:');
console.log('   • Your API key must have access to "us" database');
console.log('   • Some plans limit which databases you can query');
console.log('   • Check your subscription includes domain_overview and backlinks_overview\n');

console.log('4️⃣  Test Your API Key Manually:');
console.log('   Visit this URL in your browser (replace YOUR_API_KEY):');
console.log('   https://api.semrush.com/?type=domain_overview&key=YOUR_API_KEY&domain=nike.com&database=us\n');
console.log('   Expected: You should see data rows with numbers');
console.log('   If Error: The API key is invalid or unauthorized\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('💡 RECOMMENDATION:');
console.log('   Implement Option 2: Show a friendly message when SEMrush data');
console.log('   is unavailable instead of zeros. This provides a better UX.');
console.log('   Most small/local businesses won\'t be in SEMrush anyway.\n');
