import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function test() {
  console.log('API Key:', API_KEY ? '已设置' : '未设置');
  
  // Try different model names
  const models = [
    'qwen3-vl-embedding',
    'qwen-vl-embedding',
    'qwen-vl-embedding-v1',
    'text-embedding-v3',
  ];
  
  for (const model of models) {
    console.log(`\n测试模型: ${model}`);
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: model,
          input: {
            texts: ['测试文本'],
          },
        }),
      });
      
      console.log(`  Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ 成功! 维度: ${data.output.embeddings[0].embedding.length}`);
        console.log(`  ✓ 模型 ${model} 可用!`);
        break;
      } else {
        const error = await response.text();
        console.log(`  ✗ 错误: ${error.slice(0, 100)}`);
      }
    } catch (err: any) {
      console.log(`  ✗ 异常: ${err.message}`);
    }
  }
  
  process.exit(0);
}

test();
