import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function test() {
  // Qwen-VL uses chat completion API
  console.log('测试 Qwen-VL 多模态 API...\n');
  
  const imageUrl = 'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/DSC00054.jpeg/thumb';
  
  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      input: {
        messages: [
          {
            role: 'user',
            content: [
              { image: imageUrl },
              { text: '描述这张图片的内容，重点关注是否有人物、风景（海、山、天空等）' }
            ]
          }
        ]
      }
    }),
  });
  
  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  
  process.exit(0);
}

test();
