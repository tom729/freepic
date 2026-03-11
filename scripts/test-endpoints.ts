import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const MODEL = process.env.DASHSCOPE_EMBEDDING_MODEL || 'qwen3-vl-embedding';

const endpoints = [
  'https://dashscope.aliyuncs.com/api/v1/multimodal/embeddings',
  'https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings',
  'https://dashscope.aliyuncs.com/api/v1/embeddings/multimodal',
];

async function test() {
  const imageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/256_1.png'; // 官方示例图片
  
  for (const endpoint of endpoints) {
    console.log(`\n测试: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          input: [{ image: imageUrl }],
        }),
      });
      
      console.log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log(`  ✓ Endpoint 找到!`);
        break;
      }
    } catch (err: any) {
      console.log(`  错误: ${err.message}`);
    }
  }
  
  process.exit(0);
}

test();
