#!/usr/bin/env node
/**
 * Tencent Cloud Content Moderation API - False Positive Test POC
 * 
 * Tests the content moderation API for false positives (safe content flagged as unsafe).
 * Expected: ≤ 10% false positive rate
 */

const tencentcloud = require("tencentcloud-sdk-nodejs");
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Content Moderation API client
const TmsClient = tencentcloud.tms.v20201229.Client;

// Configuration
const CONFIG = {
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  region: process.env.TENCENT_REGION || 'ap-guangzhou',
  testImagesDir: process.env.TEST_IMAGES_DIR || './test-images',
  expectedFalsePositiveRate: 0.10, // 10% maximum false positive rate
  bizType: process.env.MODERATION_BIZ_TYPE || 'default',
};

// Safe test cases: Images that should NOT be flagged
const SAFE_TEST_CASES = [
  {
    image: 'safe_landscape.jpg',
    category: 'landscape',
    description: 'Natural landscape - mountains and trees',
    confidence: 'should be safe'
  },
  {
    image: 'safe_food.jpg',
    category: 'food',
    description: 'Regular food photography',
    confidence: 'should be safe'
  },
  {
    image: 'safe_architecture.jpg',
    category: 'architecture',
    description: 'Building and architecture',
    confidence: 'should be safe'
  },
  {
    image: 'safe_person.jpg',
    category: 'person',
    description: 'Regular person portrait (clothed, appropriate)',
    confidence: 'should be safe'
  },
  {
    image: 'safe_animal.jpg',
    category: 'animal',
    description: 'Pet or wildlife photography',
    confidence: 'should be safe'
  },
  {
    image: 'safe_product.jpg',
    category: 'product',
    description: 'Product/e-commerce photography',
    confidence: 'should be safe'
  },
  {
    image: 'safe_text.jpg',
    category: 'text',
    description: 'Image with normal text content',
    confidence: 'should be safe'
  },
  {
    image: 'safe_art.jpg',
    category: 'art',
    description: 'Artwork and illustrations',
    confidence: 'should be safe'
  },
  {
    image: 'safe_document.jpg',
    category: 'document',
    description: 'Document or screenshot',
    confidence: 'should be safe'
  },
  {
    image: 'safe_social.jpg',
    category: 'social',
    description: 'Social media style photo',
    confidence: 'should be safe'
  },
];

// Risk categories to check
const RISK_CATEGORIES = [
  'Porn',      // Adult/Pornographic content
  'Illegal',   // Illegal activities
  'Abuse',     // Abusive content
  'Ad',        // Excessive advertising
  'Politics',  // Political sensitivity
  'Terror',    // Terrorism-related
];

/**
 * Initialize Tencent Cloud client
 */
function createClient() {
  if (!CONFIG.secretId || !CONFIG.secretKey) {
    throw new Error('Missing TENCENT_SECRET_ID or TENCENT_SECRET_KEY in environment');
  }

  return new TmsClient({
    credential: {
      secretId: CONFIG.secretId,
      secretKey: CONFIG.secretKey,
    },
    region: CONFIG.region,
    profile: {
      httpProfile: {
        endpoint: "tms.tencentcloudapi.com",
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
 * Call Image Moderation API
 */
async function moderateImage(client, imageBase64, filename) {
  const params = {
    BizType: CONFIG.bizType,
    FileContent: imageBase64,
    FileName: filename,
  };

  try {
    const response = await client.ImageModeration(params);
    return response;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
}

/**
 * Check if content is flagged as unsafe
 */
function isFlagged(result) {
  if (!result) return false;

  // Check suggestion (Block = flagged)
  if (result.Suggestion === 'Block') {
    return true;
  }

  // Check risk details
  if (result.RiskDetails && result.RiskDetails.length > 0) {
    // Consider it flagged if any risk has high confidence
    const highRiskItems = result.RiskDetails.filter(risk => 
      risk.Score && risk.Score > 80
    );
    return highRiskItems.length > 0;
  }

  return false;
}

/**
 * Get risk labels from result
 */
function getRiskLabels(result) {
  if (!result || !result.RiskDetails) return [];
  
  return result.RiskDetails
    .filter(risk => risk.Score > 50)
    .map(risk => ({
      label: risk.Label,
      score: risk.Score,
      category: risk.Category
    }));
}

/**
 * Run single test case
 */
async function runTestCase(client, testCase) {
  const imagePath = path.join(CONFIG.testImagesDir, testCase.image);
  
  if (!fs.existsSync(imagePath)) {
    return {
      image: testCase.image,
      category: testCase.category,
      status: 'SKIPPED',
      reason: 'Image file not found',
    };
  }

  console.log(`\n📝 Testing: ${testCase.description}`);
  console.log(`   Image: ${testCase.image}`);
  console.log(`   Category: ${testCase.category}`);

  try {
    const imageBase64 = imageToBase64(imagePath);
    const result = await moderateImage(client, imageBase64, testCase.image);

    const flagged = isFlagged(result);
    const riskLabels = getRiskLabels(result);

    console.log(`   Suggestion: ${result.Suggestion || 'Unknown'}`);
    console.log(`   Risk Labels: ${riskLabels.map(r => `${r.label}(${r.score})`).join(', ') || 'None'}`);
    console.log(`   Flagged: ${flagged ? '⚠️ YES (FALSE POSITIVE)' : '✅ NO'}`);

    return {
      image: testCase.image,
      category: testCase.category,
      status: flagged ? 'FALSE_POSITIVE' : 'PASS',
      suggestion: result.Suggestion,
      riskLabels,
      confidence: result.Confidence || 0,
    };
  } catch (error) {
    return {
      image: testCase.image,
      category: testCase.category,
      status: 'ERROR',
      reason: error.message,
    };
  }
}

/**
 * Calculate false positive metrics
 */
function calculateMetrics(results) {
  const completed = results.filter(r => r.status !== 'SKIPPED');
  const passed = completed.filter(r => r.status === 'PASS').length;
  const falsePositives = completed.filter(r => r.status === 'FALSE_POSITIVE').length;
  const errors = completed.filter(r => r.status === 'ERROR').length;
  
  const fpr = completed.length > 0 ? falsePositives / completed.length : 0;

  return {
    total: results.length,
    completed: completed.length,
    passed,
    falsePositives,
    errors,
    falsePositiveRate: fpr,
    meetsThreshold: fpr <= CONFIG.expectedFalsePositiveRate,
  };
}

/**
 * Print test summary
 */
function printSummary(results, metrics) {
  console.log('\n' + '='.repeat(60));
  console.log('CONTENT MODERATION FALSE POSITIVE TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\nTotal test cases: ${metrics.total}`);
  console.log(`Completed: ${metrics.completed}`);
  console.log(`Passed (safe): ${metrics.passed} ✅`);
  console.log(`False Positives: ${metrics.falsePositives} ⚠️`);
  console.log(`Errors: ${metrics.errors} ❌`);
  
  console.log(`\n📊 False Positive Rate: ${(metrics.falsePositiveRate * 100).toFixed(1)}%`);
  console.log(`🎯 Threshold: ≤ ${(CONFIG.expectedFalsePositiveRate * 100).toFixed(0)}%`);
  console.log(`✅ Status: ${metrics.meetsThreshold ? 'PASSED' : 'FAILED'}`);

  if (!metrics.meetsThreshold) {
    console.log('\n⚠️ WARNING: False positive rate exceeds threshold!');
    console.log('Review the following images:');
    results
      .filter(r => r.status === 'FALSE_POSITIVE')
      .forEach(r => {
        console.log(`  - ${r.image} (${r.category})`);
        console.log(`    Risk: ${r.riskLabels.map(l => l.label).join(', ')}`);
      });
    console.log('\nConsider:');
    console.log('  - Adjusting business type (BizType) configuration');
    console.log('  - Reviewing flagged images manually');
    console.log('  - Tuning moderation sensitivity settings');
    console.log('  - Contacting Tencent Cloud support');
  }

  // Category breakdown
  console.log('\nCategory Breakdown:');
  console.log('-'.repeat(60));
  const categoryStats = {};
  results.forEach(r => {
    if (!categoryStats[r.category]) {
      categoryStats[r.category] = { total: 0, fp: 0 };
    }
    categoryStats[r.category].total++;
    if (r.status === 'FALSE_POSITIVE') {
      categoryStats[r.category].fp++;
    }
  });

  Object.entries(categoryStats).forEach(([cat, stats]) => {
    const rate = stats.total > 0 ? (stats.fp / stats.total * 100).toFixed(0) : 0;
    console.log(`  ${cat}: ${stats.fp}/${stats.total} FP (${rate}%)`);
  });

  console.log('\nDetailed Results:');
  console.log('-'.repeat(60));
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'FALSE_POSITIVE' ? '⚠️' : '❌';
    console.log(`${icon} ${r.image}: ${r.status}`);
    if (r.riskLabels && r.riskLabels.length > 0) {
      console.log(`   Risk: ${r.riskLabels.map(l => `${l.label}(${l.score})`).join(', ')}`);
    }
    if (r.reason) console.log(`   Reason: ${r.reason}`);
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🛡️ Tencent Cloud Content Moderation - False Positive Test POC');
  console.log('='.repeat(60));

  try {
    const client = createClient();
    const results = [];

    for (const testCase of SAFE_TEST_CASES) {
      const result = await runTestCase(client, testCase);
      results.push(result);
    }

    const metrics = calculateMetrics(results);
    printSummary(results, metrics);

    // Exit with error code if threshold exceeded
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

module.exports = { runTestCase, calculateMetrics, isFlagged };
