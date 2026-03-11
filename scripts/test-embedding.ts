import { generateTextEmbedding } from '../lib/embedding';

async function test() {
  console.log('Testing text embedding generation...');
  try {
    const embedding = await generateTextEmbedding('海边');
    console.log('✓ Success! Embedding length:', embedding.length);
    console.log('First 5 values:', embedding.slice(0, 5));
  } catch (err) {
    console.error('✗ Failed:', err);
  }
  process.exit(0);
}

test();
