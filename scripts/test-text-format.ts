import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function test() {
  console.log('测试 text-embedding-v3 (已知可用的模型)...\n');

  const endpoint =
    'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding';

  // Try different body formats
  const formats = [
    {
      name: 'texts array',
      body: {
        model: 'text-embedding-v3',
        input: {
          texts: ['测试文本'],
        },
      },
    },
    {
      name: 'single text',
      body: {
        model: 'text-embedding-v3',
        input: {
          text: '测试文本',
        },
      },
    },
    {
      name: 'with text_type',
      body: {
        model: 'text-embedding-v3',
        input: {
          texts: ['测试文本'],
          text_type: 'query',
        },
      },
    },
  ];

  for (const format of formats) {
    console.log(`\n格式: ${format.name}`);
    console.log('Body:', JSON.stringify(format.body, null, 2));

    try {
      const response = await fetch(endpoint, {
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
        console.log('✓ 成功!');
        console.log('响应:', JSON.stringify(data, null, 2).slice(0, 500));
      } else {
        const error = await response.text();
        console.log('✗ 错误:', error.slice(0, 200));
      }
    } catch (err: any) {
      console.log('✗ 异常:', err.message);
    }
  }

  process.exit(0);
}

test();
