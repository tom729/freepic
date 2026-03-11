import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const MODEL = 'qwen3-vl-embedding';

// Try different service paths based on text-embedding pattern
const endpoints = [
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal/multimodal',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/qwen3-vl/qwen3-vl',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/qwen-vl/qwen-vl',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal/qwen3-vl',
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal/qwen-vl',
];

async function test() {
  const imageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/256_1.png';

  console.log('测试 Qwen3-VL embedding 的各种 service endpoints...\n');

  for (const endpoint of endpoints) {
    console.log(`\n测试: ${endpoint}`);

    // Try multimodal input
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
            texts: ['描述这张图片'],
            images: [imageUrl],
          },
        }),
      });

      console.log(`  texts+images format - Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log(`  ✓ Endpoint 找到!`);
        console.log('  响应:', JSON.stringify(data.output, null, 2).slice(0, 500));
        continue;
      } else {
        const error = await response.text();
        console.log(`  ✗ 错误: ${error.slice(0, 150)}`);
      }
    } catch (err: any) {
      console.log(`  ✗ 异常: ${err.message}`);
    }

    // Try image-only input
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
            images: [imageUrl],
          },
        }),
      });

      console.log(`  images-only format - Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log(`  ✓ Endpoint 找到!`);
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
