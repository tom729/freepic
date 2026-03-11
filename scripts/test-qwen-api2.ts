import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function test() {
  // Try different endpoints
  const endpoints = [
    'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
  ];
  
  const models = ['text-embedding-v3', 'qwen-turbo'];
  
  for (const endpoint of endpoints) {
    console.log(`\n测试 endpoint: ${endpoint}`);
    for (const model of models) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            input: { texts: ['测试'] },
          }),
        });
        
        console.log(`  ${model}: ${response.status}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✓ 成功!`, data);
        }
      } catch (err: any) {
        console.log(`  ${model}: ${err.message}`);
      }
    }
  }
  
  process.exit(0);
}

test();
