import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const MODEL = process.env.DASHSCOPE_EMBEDDING_MODEL || 'qwen3-vl-embedding';

const endpoints = [
  // Standard endpoints
  'https://dashscope.aliyuncs.com/api/v1/multimodal/embeddings',
  'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings',
  'https://dashscope.aliyuncs.com/api/v1/embeddings/multimodal',
  'https://dashscope.aliyuncs.com/api/v1/embeddings',
  // Service-based endpoints (like text-embedding-v3 uses)
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/qwen3-vl',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/qwen-vl',
  // Direct model endpoints
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
];

async function test() {
  const imageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/256_1.png';

  console.log('测试不同的 API endpoints...\n');

  for (const endpoint of endpoints) {
    console.log(`\n测试: ${endpoint}`);

    // Try with multimodal input format
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: [{ image: imageUrl }],
        }),
      });

      console.log(`  Multimodal input - Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log(`  ✓ Endpoint 找到 (multimodal format)!`);
        continue;
      }
    } catch (err: any) {
      console.log(`  Multimodal error: ${err.message}`);
    }

    // Try with text-only format
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: {
            texts: ['测试文本'],
          },
        }),
      });

      console.log(`  Text input - Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log(`  ✓ Endpoint 找到 (text format)!`);
      } else {
        const error = await response.text();
        console.log(`  ✗ 错误: ${error.slice(0, 100)}`);
      }
    } catch (err: any) {
      console.log(`  Text error: ${err.message}`);
    }
  }

  process.exit(0);
}

test();
