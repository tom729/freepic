# Tencent Cloud API Testing - Proof of Concept

This directory contains proof-of-concept scripts for testing Tencent Cloud Visual Search and Content Moderation APIs.

## Prerequisites

1. Node.js (v14 or higher)
2. Tencent Cloud account with API access
3. Test images in the `test-images/` directory

## Installation

```bash
# Install dependencies
npm install tencentcloud-sdk-nodejs dotenv
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Tencent Cloud credentials:
```bash
# Required
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key

# Optional (defaults shown)
TENCENT_REGION=ap-guangzhou
TEST_IMAGES_DIR=./test-images
MODERATION_BIZ_TYPE=default
```

### Getting Tencent Cloud Credentials

1. Log in to [Tencent Cloud Console](https://console.cloud.tencent.com/)
2. Go to "API Key Management" (访问密钥)
3. Create a new API key pair
4. Copy the SecretId and SecretKey to your `.env` file

**⚠️ Security Warning**: Never commit the `.env` file to version control!

## Test Images Setup

Create a `test-images/` directory and add test images:

```
test-images/
├── landscape_mountain.jpg    # For visual search
├── food_pizza.jpg
├── architecture_building.jpg
├── animal_dog.jpg
├── person_portrait.jpg
├── safe_landscape.jpg        # For moderation (safe content)
├── safe_food.jpg
├── safe_architecture.jpg
├── safe_person.jpg
├── safe_animal.jpg
└── ... (add more as needed)
```

### Test Image Guidelines

**For Visual Search Tests:**
- Clear, high-quality images
- Distinct subjects (landscapes, food, buildings, animals, people)
- Varied categories for comprehensive testing

**For Moderation Tests:**
- **Must be safe/appropriate content** (we're testing for false positives)
- Normal everyday photography
- Avoid any potentially sensitive content
- Include variety: people, products, documents, art, etc.

## Running Tests

### Visual Search Accuracy Test

Tests the image search API for accuracy (expecting ≥ 70% match rate in top 5 results):

```bash
node visual-search-test.js
```

**What it tests:**
- Sends test images to Tencent Visual Search API
- Checks if returned tags match expected categories
- Calculates accuracy percentage

**Output:**
- Individual test results (PASS/FAIL/SKIPPED)
- Overall accuracy percentage
- Comparison against threshold (70%)

### Content Moderation False Positive Test

Tests the moderation API for false positives (expecting ≤ 10% false positive rate):

```bash
node moderation-test.js
```

**What it tests:**
- Sends safe images to Tencent Content Moderation API
- Checks if any are incorrectly flagged as unsafe
- Calculates false positive rate

**Output:**
- Individual test results (PASS/FALSE_POSITIVE/ERROR)
- False positive rate by category
- Comparison against threshold (10%)
- List of false positives with risk labels

## Expected Results

| Test | Metric | Threshold |
|------|--------|-----------|
| Visual Search | Accuracy | ≥ 70% (top 5 results) |
| Content Moderation | False Positive Rate | ≤ 10% |

## Troubleshooting

### API Authentication Errors
```
❌ Fatal Error: The provided credentials could not be validated
```
- Check your SecretId and SecretKey in `.env`
- Ensure the API key has appropriate permissions
- Verify the key is active in Tencent Cloud console

### Image Not Found
```
⚠️ SKIPPED: Image file not found
```
- Ensure test images exist in `test-images/` directory
- Check file names match the test cases in the scripts
- Verify `TEST_IMAGES_DIR` path is correct

### Rate Limiting
If you hit API rate limits:
- Add delays between requests (modify the script)
- Contact Tencent Cloud to increase limits
- Use multiple API keys for parallel testing

### Low Accuracy / High False Positives

**Visual Search:**
- Review test images for clarity
- Adjust expected tags in test cases
- Consider image quality and composition

**Content Moderation:**
- Review `BizType` configuration in Tencent Cloud console
- Check if specific categories are overly sensitive
- Contact Tencent Cloud for sensitivity tuning

## Customizing Tests

### Adding Test Cases

Edit the `TEST_CASES` array in `visual-search-test.js`:
```javascript
const TEST_CASES = [
  {
    image: 'your_image.jpg',
    expectedTags: ['tag1', 'tag2', 'tag3'],
    description: 'Description of your test'
  },
  // ... more tests
];
```

Edit the `SAFE_TEST_CASES` array in `moderation-test.js`:
```javascript
const SAFE_TEST_CASES = [
  {
    image: 'your_safe_image.jpg',
    category: 'your_category',
    description: 'Description',
    confidence: 'should be safe'
  },
  // ... more tests
];
```

### Adjusting Thresholds

Modify the `CONFIG` object in each script:
```javascript
const CONFIG = {
  expectedAccuracy: 0.80,        // Change from 0.70 to 0.80
  expectedFalsePositiveRate: 0.05, // Change from 0.10 to 0.05
  // ... other config
};
```

## CI/CD Integration

These scripts exit with code 1 if thresholds are not met, making them suitable for CI/CD:

```yaml
# Example GitHub Actions
- name: Run Visual Search Tests
  run: node scripts/poc/visual-search-test.js
  
- name: Run Moderation Tests
  run: node scripts/poc/moderation-test.js
```

## Further Reading

- [Tencent Cloud Visual Search API](https://cloud.tencent.com/document/product/865)
- [Tencent Cloud Content Moderation API](https://cloud.tencent.com/document/product/1124)
- [Tencent Cloud SDK for Node.js](https://github.com/TencentCloud/tencentcloud-sdk-nodejs)

## Support

For issues with:
- **These scripts**: Check the troubleshooting section above
- **Tencent Cloud APIs**: Contact Tencent Cloud support
- **API credentials**: Visit Tencent Cloud console
