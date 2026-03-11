import { db } from '../lib/db';
import { imageEmbeddings } from '../lib/schema';
import { v4 as uuidv4 } from 'uuid';

async function main() {
  // Generate random 512-dim embedding
  const generateEmbedding = () => {
    const arr = [];
    for (let i = 0; i < 512; i++) {
      arr.push((Math.random() - 0.5).toFixed(6));
    }
    return `[${arr.join(',')}]`;
  };

  const images = [
    { id: '75a87803-b199-405b-8647-e5e8750135be', key: 'DSC00054' },
    { id: 'ef8ced91-3944-416d-ad33-c0edcdc76c9d', key: 'DSC00032' },
    { id: 'c8f5ff0c-31f4-4504-95be-f1e7dfe8bb46', key: 'c40fca8c' },
  ];

  await db.delete(imageEmbeddings);
  console.log('Cleared old embeddings');

  for (const img of images) {
    await db.insert(imageEmbeddings).values({
      id: uuidv4(),
      imageId: img.id,
      embedding: generateEmbedding(),
      createdAt: new Date(),
    });
    console.log(`✓ Inserted embedding for ${img.key}`);
  }

  console.log('\nDone!');
  process.exit(0);
}

main().catch(console.error);
