import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const MODEL = process.env.DASHSCOPE_EMBEDDING_MODEL || 'qwen3-vl-embedding';

async function test() {
  console.log(`测试多模态 embedding API: ${MODEL}\n`);
  
  const imageUrl = 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/DSC00054.jpeg/thumb';
  
  // Test multimodal embeddings endpoint
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/multimodal/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          image: imageUrl,
        }
      ],
    }),
  });
  
  console.log('Status:', response.status);
  
  if (response.ok) {
    const data = await response.json();
    console.log('✓ 成功!');
    console.log('Embedding 维度:', data.output?.embeddings?.[0]?.embedding?.length);
    console.log('Response:', JSON.stringify(data.output, null, 2).slice(0, 500));
  } else {
    const error = await response.text();
    console.log('✗ 错误:', error);
  }
  
  process.exit(0);
}

test();
