#!/usr/bin/env node

/**
 * Supabase Edge Function Deployment Script
 * This script deploys the competitor search functions to Supabase
 *
 * Prerequisites:
 * 1. Set SUPABASE_ACCESS_TOKEN environment variable with your Supabase access token
 * 2. Set SUPABASE_PROJECT_ID environment variable (kpqpswkalqbtbviogmcz)
 *
 * Usage:
 * SUPABASE_ACCESS_TOKEN=your_token SUPABASE_PROJECT_ID=kpqpswkalqbtbviogmcz node deploy-competitors.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'kpqpswkalqbtbviogmcz';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

const functions = [
  'fetch-competitor-search',
  'fetch-competitor-reviews',
  'comprehensive-brand-analysis',
  'fetch-google-reviews',
  'fetch-trustpilot-reviews'
];

if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('Get your token from: https://app.supabase.com/account/tokens');
  process.exit(1);
}

async function deployFunction(functionName) {
  try {
    const functionPath = path.join(__dirname, 'supabase', 'functions', functionName, 'index.ts');

    if (!fs.existsSync(functionPath)) {
      console.error(`❌ Function file not found: ${functionPath}`);
      return false;
    }

    const code = fs.readFileSync(functionPath, 'utf8');

    console.log(`⏳ Deploying ${functionName}...`);

    const formData = new URLSearchParams();
    formData.append('verify_jwt', 'false');

    // Create multipart form data for file upload
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="verify_jwt"\r\n\r\n` +
      `false\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="code"; filename="index.ts"\r\n` +
      `Content-Type: application/typescript\r\n\r\n` +
      code +
      `\r\n--${boundary}--\r\n`;

    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_ID}/functions/${functionName}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to deploy ${functionName}:`);
      console.error(error);
      return false;
    }

    console.log(`✅ ${functionName} deployed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Error deploying ${functionName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Edge Function Deployment');
  console.log(`Project ID: ${PROJECT_ID}\n`);

  let successCount = 0;

  for (const functionName of functions) {
    const success = await deployFunction(functionName);
    if (success) successCount++;
  }

  console.log(`\n📊 Summary: ${successCount}/${functions.length} functions deployed`);

  if (successCount === functions.length) {
    console.log('\n✅ All functions deployed successfully!');
    console.log('\nNext steps:');
    console.log('1. Go to https://app.supabase.com/project/' + PROJECT_ID);
    console.log('2. Navigate to Edge Functions');
    console.log('3. Verify all functions are listed and active');
    console.log('4. Add environment variables: GOOGLE_MAPS_API_KEY');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some functions failed to deploy');
    process.exit(1);
  }
}

main();
