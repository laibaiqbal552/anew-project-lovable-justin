// Quick test script to check if the Reviews tab data is being populated
// Run this in the browser console on the Dashboard page

console.log('🔍 Checking Reviews Tab Data...');

// Get the report data from the page
const dashboardData = document.querySelector('[data-report-id]');
if (!dashboardData) {
  console.log('❌ Could not find report data on page');
} else {
  console.log('✅ Found report on page');
}

// Check localStorage
const reportId = localStorage.getItem('currentReportId');
console.log('📋 Current Report ID:', reportId);

// Check if analysis data exists
const guestResults = localStorage.getItem('guestAnalysisResults');
if (guestResults) {
  const data = JSON.parse(guestResults);
  console.log('📊 Guest Analysis Data:', {
    hasGoogleReviews: !!data.analysis_data?.googleReviews,
    hasTrustpilot: !!data.analysis_data?.trustpilotReviews,
    hasCompetitors: !!data.analysis_data?.competitors,
    googleReviewsData: data.analysis_data?.googleReviews,
    trustpilotData: data.analysis_data?.trustpilotReviews,
    competitorsData: data.analysis_data?.competitors
  });
} else {
  console.log('❌ No guest analysis results in localStorage');
}

// Check if this is authenticated user - you would need to inspect the report from the React component
console.log('💡 For authenticated users, check the browser DevTools Network tab for the brand_reports query');
