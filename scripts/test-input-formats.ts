import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const ENDPOINT =
  'https://dashscope.aliyuncs.com/api/v1/services/embeddings/multimodal-embedding/multimodal-embedding';

async function test() {
  console.log('测试不同的 input formats...\n');

  const imageUrl = 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/256_1.png';

  const formats = [
    {
      name: 'Array format with image',
      body: {
        model: 'qwen3-vl-embedding',
        input: [{ image: imageUrl }],
      },
    },
    {
      name: 'Object format with images array',
      body: {
        model: 'qwen3-vl-embedding',
        input: {
          images: [imageUrl],
        },
      },
    },
    {
      name: 'Object format with contents (like GPT-4V)',
      body: {
        model: 'qwen3-vl-embedding',
        input: {
          contents: [{ type: 'image', image: imageUrl }],
        },
      },
    },
    {
      name: 'Direct input array',
      body: {
        model: 'qwen3-vl-embedding',
        input: [{ image: imageUrl }],
      },
    },
    {
      name: 'With text_type (like text-embedding)',
      body: {
        model: 'qwen3-vl-embedding',
        input: {
          texts: ['describe this image'],
          images: [imageUrl],
        },
      },
    },
    {
      name: 'Simple text only',
      body: {
        model: 'qwen3-vl-embedding',
        input: {
          texts: ['测试文本'],
        },
      },
    },
  ];

  for (const format of formats) {
    console.log(`\n${format.name}:`);
    console.log('Body:', JSON.stringify(format.body).slice(0, 100) + '...');

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(format.body),
      });

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ 成功! 维度: ${data.output?.embeddings?.[0]?.embedding?.length}`);
        console.log('响应:', JSON.stringify(data.output, null, 2).slice(0, 300));
      } else {
        const error = await response.text();
        console.log(`✗ 错误: ${error.slice(0, 200)}`);
      }
    } catch (err: any) {
      console.log(`✗ 异常: ${err.message}`);
    }
  }

  process.exit(0);
}

test();
