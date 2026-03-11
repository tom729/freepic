#!/usr/bin/env node
/**
 * Tencent Cloud Visual Search API - Accuracy Test POC
 * 
 * Tests the visual search API accuracy against a set of test images.
 * Expected: ≥ 70% accuracy (top 5 results)
 */

const tencentcloud = require("tencentcloud-sdk-nodejs");
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Visual Search API client
const TiiaClient = tencentcloud.tiia.v20190529.Client;

// Configuration
const CONFIG = {
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  region: process.env.TENCENT_REGION || 'ap-guangzhou',
  testImagesDir: process.env.TEST_IMAGES_DIR || './test-images',
  expectedAccuracy: 0.70, // 70% minimum accuracy
  topK: 5, // Check top 5 results
};

// Test cases: Map of image filename to expected keywords/tags
const TEST_CASES = [
  {
    image: 'landscape_mountain.jpg',
    expectedTags: ['mountain', 'landscape', 'nature', 'scenery'],
    description: 'Mountain landscape'
  },
  {
    image: 'food_pizza.jpg',
    expectedTags: ['food', 'pizza', 'meal', 'dining'],
    description: 'Pizza food item'
  },
  {
    image: 'architecture_building.jpg',
    expectedTags: ['building', 'architecture', 'structure'],
    description: 'Architectural building'
  },
  {
    image: 'animal_dog.jpg',
    expectedTags: ['dog', 'animal', 'pet'],
    description: 'Dog pet animal'
  },
  {
    image: 'person_portrait.jpg',
    expectedTags: ['person', 'portrait', 'human', 'face'],
    description: 'Person portrait'
  },
];

/**
 * Initialize Tencent Cloud client
 */
function createClient() {
  if (!CONFIG.secretId || !CONFIG.secretKey) {
    throw new Error('Missing TENCENT_SECRET_ID or TENCENT_SECRET_KEY in environment');
  }

  return new TiiaClient({
    credential: {
      secretId: CONFIG.secretId,
      secretKey: CONFIG.secretKey,
    },
    region: CONFIG.region,
    profile: {
      httpProfile: {
        endpoint: "tiia.tencentcloudapi.com",
      },
    },
  });
}

/**
 * Convert image to base64
 */
function imageToBase64(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  return buffer.toString('base64');
}

/**
 * Call Visual Search API
 */
async function searchImage(client, imageBase64) {
  const params = {
    ImageBase64: imageBase64,
    Limit: CONFIG.topK,
  };

  try {
    const response = await client.SearchImage(params);
    return response.ImageInfos || [];
  } catch (error) {
    console.error('API Error:', error.message);
    return [];
  }
}

/**
 * Check if result matches expected tags
 */
function matchesExpected(resultTags, expectedTags) {
  if (!resultTags || resultTags.length === 0) return false;
  
  // Check if any result tag matches expected tags
  const resultTagStrings = resultTags.map(t => t.toLowerCase());
  return expectedTags.some(expected => 
    resultTagStrings.some(result => result.includes(expected.toLowerCase()))
  );
}

/**
 * Run single test case
 */
async function runTestCase(client, testCase) {
  const imagePath = path.join(CONFIG.testImagesDir, testCase.image);
  
  if (!fs.existsSync(imagePath)) {
    return {
      image: testCase.image,
      status: 'SKIPPED',
      reason: 'Image file not found',
    };
  }

  console.log(`\n📝 Testing: ${testCase.description}`);
  console.log(`   Image: ${testCase.image}`);
  console.log(`   Expected tags: ${testCase.expectedTags.join(', ')}`);

  try {
    const imageBase64 = imageToBase64(imagePath);
    const results = await searchImage(client, imageBase64);

    if (results.length === 0) {
      return {
        image: testCase.image,
        status: 'FAIL',
        reason: 'No results returned from API',
      };
    }

    // Extract tags from results
    const resultTags = results.flatMap(r => [
      r.Name,
      r.Category,
      ...(r.Tags || []),
    ]).filter(Boolean);

    const matched = matchesExpected(resultTags, testCase.expectedTags);

    console.log(`   Results: ${results.length} items`);
    console.log(`   Tags found: ${resultTags.slice(0, 5).join(', ')}`);
    console.log(`   Match: ${matched ? '✅ YES' : '❌ NO'}`);

    return {
      image: testCase.image,
      status: matched ? 'PASS' : 'FAIL',
      topTags: resultTags.slice(0, 5),
      expected: testCase.expectedTags,
    };
  } catch (error) {
    return {
      image: testCase.image,
      status: 'ERROR',
      reason: error.message,
    };
  }
}

/**
 * Calculate accuracy metrics
 */
function calculateMetrics(results) {
  const completed = results.filter(r => r.status !== 'SKIPPED');
  const passed = completed.filter(r => r.status === 'PASS').length;
  const failed = completed.filter(r => r.status === 'FAIL').length;
  const errors = completed.filter(r => r.status === 'ERROR').length;
  
  const accuracy = completed.length > 0 ? passed / completed.length : 0;

  return {
    total: results.length,
    completed: completed.length,
    passed,
    failed,
    errors,
    accuracy,
    meetsThreshold: accuracy >= CONFIG.expectedAccuracy,
  };
}

/**
 * Print test summary
 */
function printSummary(results, metrics) {
  console.log('\n' + '='.repeat(60));
  console.log('VISUAL SEARCH ACCURACY TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nTotal test cases: ${metrics.total}`);
  console.log(`Completed: ${metrics.completed}`);
  console.log(`Passed: ${metrics.passed} ✅`);
  console.log(`Failed: ${metrics.failed} ❌`);
  console.log(`Errors: ${metrics.errors} ⚠️`);
  
  console.log(`\n📊 Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
  console.log(`🎯 Threshold: ${(CONFIG.expectedAccuracy * 100).toFixed(0)}%`);
  console.log(`✅ Status: ${metrics.meetsThreshold ? 'PASSED' : 'FAILED'}`);

  if (!metrics.meetsThreshold) {
    console.log('\n⚠️ WARNING: Accuracy below threshold!');
    console.log('Consider:');
    console.log('  - Reviewing test images for clarity');
    console.log('  - Adjusting expected tags');
    console.log('  - Contacting Tencent Cloud support');
  }

  console.log('\nDetailed Results:');
  console.log('-'.repeat(60));
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${r.image}: ${r.status}`);
    if (r.reason) console.log(`   Reason: ${r.reason}`);
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Tencent Cloud Visual Search - Accuracy Test POC');
  console.log('='.repeat(60));

  try {
    const client = createClient();
    const results = [];

    for (const testCase of TEST_CASES) {
      const result = await runTestCase(client, testCase);
      results.push(result);
    }

    const metrics = calculateMetrics(results);
    printSummary(results, metrics);

    // Exit with error code if threshold not met
    process.exit(metrics.meetsThreshold ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { runTestCase, calculateMetrics };
