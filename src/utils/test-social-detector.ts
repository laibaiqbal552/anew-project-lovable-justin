import { socialMediaDetector } from './socialMediaDetector';

export async function testSocialMediaDetector() {
  console.log('🧪 Testing Social Media Detector...\n');

  // Test case 1: A real website with social media links
  try {
    console.log('📍 Test 1: Testing with example business website...');
    const result1 = await socialMediaDetector.detectSocialMedia(
      'https://starbucks.com',
      'Starbucks'
    );
    console.log('✅ Test 1 Results:', {
      score: result1.score,
      platformCount: result1.platforms.length,
      detectionMethods: result1.detectionMethods,
      platforms: result1.platforms.map(p => `${p.platform}: ${p.url}`)
    });
  } catch (error) {
    console.log('❌ Test 1 Failed:', error);
  }

  console.log('\n---\n');

  // Test case 2: Website with no social media
  try {
    console.log('📍 Test 2: Testing with website that has no social media...');
    const result2 = await socialMediaDetector.detectSocialMedia(
      'https://example.com',
      'Example Company'
    );
    console.log('✅ Test 2 Results:', {
      score: result2.score,
      platformCount: result2.platforms.length,
      detectionMethods: result2.detectionMethods
    });
  } catch (error) {
    console.log('❌ Test 2 Failed:', error);
  }

  console.log('\n---\n');

  // Test case 3: Business name variations (removed - methods no longer exist)
  try {
    console.log('📍 Test 3: Testing business name variations (skipped)...');
  } catch (error) {
    console.log('❌ Test 3 Failed:', error);
  }

  console.log('\n🎉 Social Media Detector testing completed!');
}

// Uncomment this line to run the test when this file is imported
// testSocialMediaDetector();