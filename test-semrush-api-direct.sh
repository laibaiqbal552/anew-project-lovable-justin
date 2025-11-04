#!/bin/bash

# Get the SEMrush API key from Supabase secrets
API_KEY=$(npx supabase secrets list | grep SEMRUSH_API_KEY | awk '{print $1}')

echo "Testing SEMrush API with nike.com..."
echo ""

# Test Domain Overview
echo "1. Testing Domain Overview API..."
curl -s "https://api.semrush.com/?type=domain_overview&key=${API_KEY}&display_limit=1&domain=nike.com&database=us" | head -20

echo ""
echo ""

# Test Backlinks Overview
echo "2. Testing Backlinks Overview API..."
curl -s "https://api.semrush.com/?type=backlinks_overview&key=${API_KEY}&target=nike.com&target_type=root_domain" | head -20

echo ""
echo ""
echo "If you see 'ERROR' or authentication errors above, the API key is invalid."
echo "If you see 'Nothing found', the API key works but the domain isn't tracked."
echo "If you see data rows with numbers, the API is working correctly!"
