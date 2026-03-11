import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debug() {
  const imageUrl =
    'https://tukupic.mepai.me/users/41a8ccef-e4b5-44fa-97bd-e8cb262ce252/2026/03/DSC00054.jpeg/thumb';

  console.log('Testing with actual image URL...\n');
  console.log('URL:', imageUrl);

  const response = await fetch(
    'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen3-vl-embedding',
        input: {
          contents: [{ image: imageUrl }],
        },
      }),
    }
  );

  console.log('Status:', response.status);

  const data = await response.json();
  console.log('\nFull response:');
  console.log(JSON.stringify(data, null, 2));

  process.exit(0);
}

debug();
