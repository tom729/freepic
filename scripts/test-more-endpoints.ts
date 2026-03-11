import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;

// Based on text-embedding pattern: /api/v1/services/embeddings/{service-name}/{endpoint}
// Let's try various combinations for multimodal
const endpoints = [
  // Pattern: .../embeddings/{service}/{service}
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding-v1/multimodal-embedding-v1',
  // Pattern: .../aigc/{service}
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-embedding',
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/qwen3-vl-embedding',
  // Direct service
  'https://dashscope.aliyuncs.com/api/v1/services/multimodal-embedding',
  'https://dashscope.aliyuncs.com/api/v1/services/qwen3-vl-embedding',
  // Model-based
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/model/qwen3-vl-embedding',
];

async function test() {
  console.log('测试更多可能的 endpoints...\n');

  const imageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/256_1.png';

  for (const endpoint of endpoints) {
    console.log(`\n测试: ${endpoint}`);

    // Try multimodal input format (array)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'qwen3-vl-embedding',
          input: [{ image: imageUrl }],
        }),
      });

      console.log(`  Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log(`  ✓ Endpoint 找到!`);
        console.log('  响应:', JSON.stringify(data.output, null, 2).slice(0, 500));
      } else {
        const error = await response.text();
        console.log(`  ✗ 错误: ${error.slice(0, 150)}`);
      }
    } catch (err: any) {
      console.log(`  ✗ 异常: ${err.message}`);
    }
  }

  process.exit(0);
}

test();
